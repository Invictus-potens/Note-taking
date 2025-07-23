'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

// Dynamic imports for client-side only components
const DroppableComponent = dynamic(() => import('react-beautiful-dnd').then(mod => ({ default: mod.Droppable })), {
  ssr: false
});

const DraggableComponent = dynamic(() => import('react-beautiful-dnd').then(mod => ({ default: mod.Draggable })), {
  ssr: false
});

interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_private: boolean;
  user_id: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

interface KanbanCard {
  id: string;
  note_id: string;
  column_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  note?: Note;
}

interface KanbanBoardProps {
  notes: Note[];
  tags: Array<{ id: string; name: string; color?: string }>;
  onNoteSelect?: (noteId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ notes, tags, onNoteSelect }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Fetch Kanban data
  const fetchKanbanData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
        return;
      }

      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        return;
      }

      // Enrich cards with note data
      const enrichedCards = cardsData?.map(card => ({
        ...card,
        note: notes.find(note => note.id === card.note_id)
      })) || [];

      setColumns(columnsData || []);
      setCards(enrichedCards || []);
    } catch (error) {
      console.error('Error fetching Kanban data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, notes]);

  // Initialize with default columns if none exist
  const initializeDefaultColumns = useCallback(async () => {
    if (!user || columns.length > 0) return;

    const defaultColumns = [
      { title: 'Aguardando início', position: 0 },
      { title: 'Aguardando retorno do cliente/vendedor', position: 1 },
      { title: 'Aguardando análise', position: 2 },
      { title: 'Coleta de dados', position: 3 },
      { title: 'Em análise', position: 4 }
    ];

    try {
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert(defaultColumns.map(col => ({ ...col, user_id: user.id })))
        .select();

      if (error) {
        console.error('Error creating default columns:', error);
        return;
      }

      setColumns(data || []);
    } catch (error) {
      console.error('Error initializing default columns:', error);
    }
  }, [user, columns.length]);

  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData]);

  useEffect(() => {
    initializeDefaultColumns();
  }, [initializeDefaultColumns]);

  // Create new column
  const handleCreateColumn = async () => {
    if (!user || !newColumnTitle.trim()) return;

    try {
      const newPosition = columns.length;
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert([{
          user_id: user.id,
          title: newColumnTitle.trim(),
          position: newPosition
        }])
        .select();

      if (error) {
        console.error('Error creating column:', error);
        return;
      }

      setColumns(prev => [...prev, data[0]]);
      setNewColumnTitle('');
      setShowAddColumn(false);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  // Update column title
  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('kanban_columns')
        .update({ title: newTitle.trim() })
        .eq('id', columnId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating column:', error);
        return;
      }

      setColumns(prev => prev.map(col => 
        col.id === columnId ? { ...col, title: newTitle.trim() } : col
      ));
      setEditingColumn(null);
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  // Delete column
  const handleDeleteColumn = async (columnId: string) => {
    if (!user) return;

    try {
      // Delete all cards in the column first
      const { error: cardsError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('column_id', columnId)
        .eq('user_id', user.id);

      if (cardsError) {
        console.error('Error deleting cards:', cardsError);
        return;
      }

      // Delete the column
      const { error: columnError } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', columnId)
        .eq('user_id', user.id);

      if (columnError) {
        console.error('Error deleting column:', columnError);
        return;
      }

      setColumns(prev => prev.filter(col => col.id !== columnId));
      setCards(prev => prev.filter(card => card.column_id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  // Add note to column
  const handleAddNoteToColumn = async (columnId: string, noteId: string) => {
    if (!user) return;

    // Check if note is already in a column
    const existingCard = cards.find(card => card.note_id === noteId);
    if (existingCard) return;

    try {
      const newPosition = cards.filter(card => card.column_id === columnId).length;
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert([{
          user_id: user.id,
          note_id: noteId,
          column_id: columnId,
          position: newPosition
        }])
        .select();

      if (error) {
        console.error('Error adding note to column:', error);
        return;
      }

      const newCard = {
        ...data[0],
        note: notes.find(note => note.id === noteId)
      };

      setCards(prev => [...prev, newCard]);
    } catch (error) {
      console.error('Error adding note to column:', error);
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
      // Reorder columns
      const reorderedColumns = Array.from(columns);
      const [removed] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, removed);

      setColumns(reorderedColumns);

      // Update positions in database
      try {
        const updates = reorderedColumns.map((col, index) => ({
          id: col.id,
          position: index
        }));

        for (const update of updates) {
          await supabase
            .from('kanban_columns')
            .update({ position: update.position })
            .eq('id', update.id)
            .eq('user_id', user?.id);
        }
      } catch (error) {
        console.error('Error updating column positions:', error);
      }
    } else if (type === 'CARD') {
      // Move card between columns
      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;
      const cardId = result.draggableId;

      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      // Remove card from source column
      const sourceCards = cards.filter(c => c.column_id === sourceColumnId);
      const destCards = cards.filter(c => c.column_id === destColumnId);

      // Update positions
      const updatedCards = cards.map(c => {
        if (c.column_id === sourceColumnId && c.position > source.index) {
          return { ...c, position: c.position - 1 };
        }
        if (c.column_id === destColumnId && c.position >= destination.index) {
          return { ...c, position: c.position + 1 };
        }
        if (c.id === cardId) {
          return { ...c, column_id: destColumnId, position: destination.index };
        }
        return c;
      });

      setCards(updatedCards);

      // Update in database
      try {
        await supabase
          .from('kanban_cards')
          .update({ 
            column_id: destColumnId, 
            position: destination.index 
          })
          .eq('id', cardId)
          .eq('user_id', user?.id);

        // Update positions for other cards
        const cardsToUpdate = updatedCards.filter(c => 
          (c.column_id === sourceColumnId || c.column_id === destColumnId) && c.id !== cardId
        );

        for (const cardToUpdate of cardsToUpdate) {
          await supabase
            .from('kanban_cards')
            .update({ position: cardToUpdate.position })
            .eq('id', cardToUpdate.id)
            .eq('user_id', user?.id);
        }
      } catch (error) {
        console.error('Error updating card position:', error);
      }
    }
  };

  // Get available notes (not already in Kanban)
  const getAvailableNotes = () => {
    const usedNoteIds = new Set(cards.map(card => card.note_id));
    return notes.filter(note => !usedNoteIds.has(note.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-r from-purple-900 to-blue-900">
      {/* Board Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Desenvolvimento</h1>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-grid-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-arrow-down-s-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-rocket-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-flashlight-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-list-check"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-star-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-user-line"></i>
              </button>
              <button className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded">
                <i className="ri-more-line"></i>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">ST</div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium">JD</div>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">MK</div>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Column</h3>
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Column title..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateColumn()}
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateColumn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnTitle('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="p-6 min-h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableComponent droppableId="columns" direction="horizontal" type="COLUMN">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-6 h-full"
                  style={{ minHeight: 'calc(100vh - 200px)' }}
                >
                  {columns.map((column, columnIndex) => (
                    <DraggableComponent key={column.id} draggableId={column.id} index={columnIndex}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-gray-800 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col ${
                            snapshot.isDragging ? 'shadow-2xl transform rotate-2' : ''
                          }`}
                          style={{ minHeight: 'calc(100vh - 250px)' }}
                        >
                          {/* Column Header */}
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
                          >
                            {editingColumn === column.id ? (
                              <input
                                type="text"
                                value={column.title}
                                onChange={(e) => setColumns(prev => 
                                  prev.map(col => col.id === column.id ? { ...col, title: e.target.value } : col)
                                )}
                                onBlur={() => handleUpdateColumnTitle(column.id, column.title)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateColumnTitle(column.id, column.title)}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                autoFocus
                              />
                            ) : (
                              <h3 
                                className="text-lg font-semibold text-white flex-1 cursor-pointer"
                                onClick={() => setEditingColumn(column.id)}
                              >
                                {column.title}
                              </h3>
                            )}
                            <div className="flex items-center gap-1">
                              <button className="text-gray-400 hover:text-white transition-colors p-1">
                                <i className="ri-arrow-right-s-line"></i>
                              </button>
                              <button className="text-gray-400 hover:text-white transition-colors p-1">
                                <i className="ri-more-line"></i>
                              </button>
                            </div>
                          </div>

                          {/* Column Cards */}
                          <DroppableComponent droppableId={column.id} type="CARD">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 overflow-y-auto ${
                                  snapshot.isDraggingOver ? 'bg-blue-900 bg-opacity-20 rounded' : ''
                                }`}
                              >
                                {cards
                                  .filter(card => card.column_id === column.id)
                                  .sort((a, b) => a.position - b.position)
                                  .map((card, cardIndex) => (
                                    <DraggableComponent key={card.id} draggableId={card.id} index={cardIndex}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`bg-gray-700 rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing ${
                                            snapshot.isDragging ? 'shadow-lg transform rotate-1' : ''
                                          }`}
                                          onClick={() => onNoteSelect?.(card.note_id)}
                                        >
                                          <h4 className="font-medium text-white mb-2 line-clamp-2">
                                            {card.note?.title || 'Untitled'}
                                          </h4>
                                          {card.note?.tags && card.note.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                              {card.note.tags.slice(0, 3).map((tagName) => {
                                                const tag = tags.find(t => t.name === tagName);
                                                return (
                                                  <span
                                                    key={tagName}
                                                    className="px-2 py-1 text-xs rounded-full text-white"
                                                    style={{ 
                                                      backgroundColor: tag?.color || '#3b82f6',
                                                      opacity: 0.8
                                                    }}
                                                  >
                                                    {tagName}
                                                  </span>
                                                );
                                              })}
                                              {card.note.tags.length > 3 && (
                                                <span className="px-2 py-1 text-xs text-gray-400">
                                                  +{card.note.tags.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                          <div className="flex items-center justify-between text-gray-400 text-xs">
                                            <div className="flex items-center gap-1">
                                              <i className="ri-message-2-line"></i>
                                              <span>2</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </DraggableComponent>
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </DroppableComponent>

                          {/* Add Note Button */}
                          <div className="mt-4">
                            <button
                              onClick={() => {
                                // Show dropdown or modal to add note
                              }}
                              className="w-full p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-left flex items-center gap-2"
                            >
                              <i className="ri-add-line"></i>
                              Adicionar um cartão
                            </button>
                          </div>
                        </div>
                      )}
                    </DraggableComponent>
                  ))}
                  {provided.placeholder}
                  
                  {/* Add Column Button */}
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="w-80 h-12 bg-gray-800 bg-opacity-50 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-colors flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0"
                    style={{ minHeight: 'calc(100vh - 250px)' }}
                  >
                    <i className="ri-add-line mr-2"></i>
                    Adicionar uma lista
                  </button>
                </div>
              )}
            </DroppableComponent>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard; 
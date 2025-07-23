'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Kanban from '@asseinfo/react-kanban';
import '@asseinfo/react-kanban/dist/styles.css';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

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

// Custom card component to match dark theme
const CustomCard = ({ card, onEdit, onDelete, tags }: any) => {
  const note = card.note;
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-3 hover:bg-gray-600 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white line-clamp-2 flex-1">
          {note?.title || 'Untitled'}
        </h4>
        <div className="flex items-center gap-1 ml-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="text-gray-400 hover:text-blue-400 transition-colors p-1"
            title="Edit card"
          >
            <i className="ri-edit-line text-sm"></i>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            title="Delete card"
          >
            <i className="ri-delete-bin-line text-sm"></i>
          </button>
        </div>
      </div>
      
      {note?.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 3).map((tagName: string) => {
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
          {note.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-400">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      <div className="text-gray-400 text-xs">
        {note?.content && note.content.length > 0 && (
          <div className="line-clamp-2 text-gray-300 mb-1">
            {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
            {note.content.length > 100 && '...'}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Created {new Date(card.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ notes, tags, onNoteSelect }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: [] as string[] });

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
      { title: 'To Do', position: 0 },
      { title: 'In Progress', position: 1 },
      { title: 'Review', position: 2 },
      { title: 'Done', position: 3 }
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

  // Convert data to @asseinfo/react-kanban format
  const getKanbanData = () => {
    return {
      columns: columns.map(column => ({
        id: column.id,
        title: column.title,
        cards: cards
          .filter(card => card.column_id === column.id)
          .sort((a, b) => a.position - b.position)
          .map(card => ({
            id: card.id,
            title: card.note?.title || 'Untitled',
            description: card.note?.content || '',
            note_id: card.note_id,
            note: card.note,
            created_at: card.created_at,
            tags: card.note?.tags || []
          }))
      }))
    };
  };

  // Handle card creation
  const handleCardCreate = async (column: any, card: any) => {
    if (!user) return;

    try {
      // Create a new note first
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          title: card.title,
          content: card.description || '',
          folder: 'kanban',
          tags: card.tags || [],
          is_pinned: false,
          is_private: false
        }])
        .select();

      if (noteError) {
        console.error('Error creating note:', noteError);
        return;
      }

      // Create the card
      const newPosition = cards.filter(c => c.column_id === column.id).length;
      const { data: cardData, error: cardError } = await supabase
        .from('kanban_cards')
        .insert([{
          user_id: user.id,
          note_id: noteData[0].id,
          column_id: column.id,
          position: newPosition
        }])
        .select();

      if (cardError) {
        console.error('Error creating card:', cardError);
        return;
      }

      const newCard = {
        ...cardData[0],
        note: noteData[0]
      };

      setCards(prev => [...prev, newCard]);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  // Handle card update
  const handleCardUpdate = async (card: any) => {
    if (!user) return;

    try {
      // Update the note
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title: card.title,
          content: card.description,
          tags: card.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', card.note_id)
        .eq('user_id', user.id);

      if (noteError) {
        console.error('Error updating note:', noteError);
        return;
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === card.id 
          ? { 
              ...c, 
              note: { 
                ...c.note!, 
                title: card.title, 
                content: card.description, 
                tags: card.tags 
              } 
            }
          : c
      ));

      setShowEditModal(false);
      setEditingCard(null);
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  // Handle card delete
  const handleCardDelete = async (cardId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting card:', error);
        return;
      }

      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  // Handle column creation
  const handleColumnCreate = async (column: any) => {
    if (!user) return;

    try {
      const newPosition = columns.length;
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert([{
          user_id: user.id,
          title: column.title,
          position: newPosition
        }])
        .select();

      if (error) {
        console.error('Error creating column:', error);
        return;
      }

      setColumns(prev => [...prev, data[0]]);
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  // Handle column update
  const handleColumnUpdate = async (column: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('kanban_columns')
        .update({ title: column.title })
        .eq('id', column.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating column:', error);
        return;
      }

      setColumns(prev => prev.map(col => 
        col.id === column.id ? { ...col, title: column.title } : col
      ));
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  // Handle column delete
  const handleColumnDelete = async (columnId: string) => {
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

  // Handle card movement
  const handleCardMove = async (card: any, source: any, destination: any) => {
    if (!user) return;

    try {
      // Update card position in database
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: destination.fromColumnId,
          position: destination.toIndex
        })
        .eq('id', card.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error moving card:', error);
        return;
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === card.id 
          ? { ...c, column_id: destination.fromColumnId, position: destination.toIndex }
          : c
      ));
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  // Handle card edit
  const handleCardEdit = (card: any) => {
    setEditingCard(card);
    setEditForm({
      title: card.title,
      content: card.description,
      tags: card.tags || []
    });
    setShowEditModal(true);
  };

  // Handle card click (open in note editor)
  const handleCardClick = (card: any) => {
    onNoteSelect?.(card.note_id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Board Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Kanban Board</h1>
            <span className="text-gray-400 text-sm">
              {columns.length} columns • {cards.length} cards
            </span>
          </div>
        </div>
      </div>

      {/* Edit Card Modal */}
      {showEditModal && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Card</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border ${
                        editForm.tags.includes(tag.name)
                          ? 'text-white'
                          : 'text-gray-300 border-gray-600'
                      }`}
                      style={{
                        backgroundColor: editForm.tags.includes(tag.name) ? tag.color || '#3b82f6' : 'transparent',
                        borderColor: tag.color || '#3b82f6'
                      }}
                      onClick={() => {
                        setEditForm(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag.name)
                            ? prev.tags.filter(t => t !== tag.name)
                            : [...prev.tags, tag.name]
                        }));
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleCardUpdate({ ...editingCard, ...editForm })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCard(null);
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
      <div className="flex-1 overflow-hidden">
        <style jsx global>{`
          .react-kanban-board {
            background-color: #111827 !important;
            color: white !important;
            height: 100% !important;
          }
          
          .react-kanban-column {
            background-color: #1f2937 !important;
            border: 1px solid #374151 !important;
            border-radius: 8px !important;
            margin: 0 8px !important;
            min-height: calc(100vh - 200px) !important;
          }
          
          .react-kanban-column-header {
            background-color: #1f2937 !important;
            color: white !important;
            border-bottom: 1px solid #374151 !important;
            padding: 12px 16px !important;
          }
          
          .react-kanban-column-header__title {
            color: white !important;
            font-weight: 600 !important;
          }
          
          .react-kanban-card {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
            border-radius: 8px !important;
            margin: 8px !important;
            padding: 12px !important;
            color: white !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          
          .react-kanban-card:hover {
            background-color: #4b5563 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
          
          .react-kanban-card__title {
            color: white !important;
            font-weight: 500 !important;
            margin-bottom: 8px !important;
          }
          
          .react-kanban-card__description {
            color: #d1d5db !important;
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          
          .react-kanban-add-card {
            background-color: transparent !important;
            border: 2px dashed #6b7280 !important;
            border-radius: 8px !important;
            color: #9ca3af !important;
            margin: 8px !important;
            padding: 12px !important;
            text-align: center !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          
          .react-kanban-add-card:hover {
            background-color: #374151 !important;
            border-color: #9ca3af !important;
            color: white !important;
          }
          
          .react-kanban-add-column {
            background-color: transparent !important;
            border: 2px dashed #6b7280 !important;
            border-radius: 8px !important;
            color: #9ca3af !important;
            margin: 0 8px !important;
            padding: 20px !important;
            text-align: center !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            min-height: calc(100vh - 200px) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          .react-kanban-add-column:hover {
            background-color: #374151 !important;
            border-color: #9ca3af !important;
            color: white !important;
          }
          
          .react-kanban-column-header__button {
            background-color: transparent !important;
            border: none !important;
            color: #9ca3af !important;
            cursor: pointer !important;
            padding: 4px !important;
            border-radius: 4px !important;
            transition: color 0.2s !important;
          }
          
          .react-kanban-column-header__button:hover {
            color: #ef4444 !important;
          }
          
          .react-kanban-card-adder-form {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
            border-radius: 8px !important;
            margin: 8px !important;
            padding: 12px !important;
          }
          
          .react-kanban-card-adder-form__input {
            background-color: #4b5563 !important;
            border: 1px solid #6b7280 !important;
            border-radius: 4px !important;
            color: white !important;
            padding: 8px 12px !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          
          .react-kanban-card-adder-form__input:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
          }
          
          .react-kanban-card-adder-form__button {
            background-color: #3b82f6 !important;
            border: none !important;
            border-radius: 4px !important;
            color: white !important;
            padding: 6px 12px !important;
            cursor: pointer !important;
            margin-right: 8px !important;
            transition: background-color 0.2s !important;
          }
          
          .react-kanban-card-adder-form__button:hover {
            background-color: #2563eb !important;
          }
          
          .react-kanban-card-adder-form__button--cancel {
            background-color: #6b7280 !important;
          }
          
          .react-kanban-card-adder-form__button--cancel:hover {
            background-color: #4b5563 !important;
          }
          
          .react-kanban-column-header__title-input {
            background-color: transparent !important;
            border: none !important;
            color: white !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            width: 100% !important;
          }
          
          .react-kanban-column-header__title-input:focus {
            outline: none !important;
            background-color: #374151 !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
          }
        `}</style>
        
        <Kanban
          data={getKanbanData()}
          onCardCreate={handleCardCreate}
          onCardUpdate={handleCardUpdate}
          onCardDelete={handleCardDelete}
          onColumnCreate={handleColumnCreate}
          onColumnUpdate={handleColumnUpdate}
          onColumnDelete={handleColumnDelete}
          onCardMove={handleCardMove}
          onCardClick={handleCardClick}
          renderCard={(card: any) => (
            <CustomCard 
              card={card} 
              onEdit={handleCardEdit}
              onDelete={handleCardDelete}
              tags={tags}
            />
          )}
          allowAddCard
          allowAddColumn
          allowEditCard
          allowEditColumn
          allowDeleteCard
          allowDeleteColumn
          allowDragCard
          allowDragColumn
        />
      </div>
    </div>
  );
};

export default KanbanBoard; 
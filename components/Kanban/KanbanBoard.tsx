'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Board from 'react-trello';
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

  // Convert data to react-trello format
  const getKanbanData = () => {
    return {
      lanes: columns.map(column => ({
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
            tags: card.note?.tags || [],
            label: card.note?.tags?.slice(0, 2).join(', ') || '',
            laneId: column.id
          }))
      }))
    };
  };

  // Handle card creation
  const handleCardCreate = async (card: any, laneId: string) => {
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
      const newPosition = cards.filter(c => c.column_id === laneId).length;
      const { data: cardData, error: cardError } = await supabase
        .from('kanban_cards')
        .insert([{
          user_id: user.id,
          note_id: noteData[0].id,
          column_id: laneId,
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
  const handleCardUpdate = async (cardId: string, card: any) => {
    if (!user) return;

    try {
      const existingCard = cards.find(c => c.id === cardId);
      if (!existingCard) return;

      // Update the note
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title: card.title,
          content: card.description,
          tags: card.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCard.note_id)
        .eq('user_id', user.id);

      if (noteError) {
        console.error('Error updating note:', noteError);
        return;
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === cardId 
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

  // Handle lane creation
  const handleLaneCreate = async (lane: any) => {
    if (!user) return;

    try {
      const newPosition = columns.length;
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert([{
          user_id: user.id,
          title: lane.title,
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

  // Handle lane update
  const handleLaneUpdate = async (laneId: string, lane: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('kanban_columns')
        .update({ title: lane.title })
        .eq('id', laneId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating column:', error);
        return;
      }

      setColumns(prev => prev.map(col => 
        col.id === laneId ? { ...col, title: lane.title } : col
      ));
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  // Handle lane delete
  const handleLaneDelete = async (laneId: string) => {
    if (!user) return;

    try {
      // Delete all cards in the lane first
      const { error: cardsError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('column_id', laneId)
        .eq('user_id', user.id);

      if (cardsError) {
        console.error('Error deleting cards:', cardsError);
        return;
      }

      // Delete the lane
      const { error: laneError } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', laneId)
        .eq('user_id', user.id);

      if (laneError) {
        console.error('Error deleting column:', laneError);
        return;
      }

      setColumns(prev => prev.filter(col => col.id !== laneId));
      setCards(prev => prev.filter(card => card.column_id !== laneId));
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  // Handle card movement
  const handleCardMove = async (cardId: string, sourceLaneId: string, targetLaneId: string, position: number) => {
    if (!user) return;

    try {
      // Update card position in database
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: targetLaneId,
          position: position
        })
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error moving card:', error);
        return;
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === cardId 
          ? { ...c, column_id: targetLaneId, position: position }
          : c
      ));
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  // Handle card click (open in note editor)
  const handleCardClick = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      onNoteSelect?.(card.note_id);
    }
  };

  // Handle card edit
  const handleCardEdit = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setEditingCard(card);
      setEditForm({
        title: card.note?.title || '',
        content: card.note?.content || '',
        tags: card.note?.tags || []
      });
      setShowEditModal(true);
    }
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
                <label htmlFor="card-title" className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  id="card-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter card title"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="card-content" className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  id="card-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter card content"
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
                onClick={() => handleCardUpdate(editingCard.id, editForm)}
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
          .react-trello-board {
            background-color: #111827 !important;
            color: white !important;
            height: 100% !important;
            font-family: inherit !important;
          }
          
          .react-trello-lane {
            background-color: #1f2937 !important;
            border: 1px solid #374151 !important;
            border-radius: 8px !important;
            margin: 0 8px !important;
            min-height: calc(100vh - 200px) !important;
          }
          
          .react-trello-lane-header {
            background-color: #1f2937 !important;
            color: white !important;
            border-bottom: 1px solid #374151 !important;
            padding: 12px 16px !important;
          }
          
          .react-trello-lane-title {
            color: white !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
          }
          
          .react-trello-card {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
            border-radius: 8px !important;
            margin: 8px !important;
            padding: 12px !important;
            color: white !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          
          .react-trello-card:hover {
            background-color: #4b5563 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
          
          .react-trello-card-title {
            color: white !important;
            font-weight: 500 !important;
            margin-bottom: 8px !important;
          }
          
          .react-trello-card-description {
            color: #d1d5db !important;
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          
          .react-trello-add-card {
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
          
          .react-trello-add-card:hover {
            background-color: #374151 !important;
            border-color: #9ca3af !important;
            color: white !important;
          }
          
          .react-trello-add-lane {
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
          
          .react-trello-add-lane:hover {
            background-color: #374151 !important;
            border-color: #9ca3af !important;
            color: white !important;
          }
          
          .react-trello-lane-header__button {
            background-color: transparent !important;
            border: none !important;
            color: #9ca3af !important;
            cursor: pointer !important;
            padding: 4px !important;
            border-radius: 4px !important;
            transition: color 0.2s !important;
          }
          
          .react-trello-lane-header__button:hover {
            color: #ef4444 !important;
          }
          
          .react-trello-card-adder-form {
            background-color: #374151 !important;
            border: 1px solid #4b5563 !important;
            border-radius: 8px !important;
            margin: 8px !important;
            padding: 12px !important;
          }
          
          .react-trello-card-adder-form__input {
            background-color: #4b5563 !important;
            border: 1px solid #6b7280 !important;
            border-radius: 4px !important;
            color: white !important;
            padding: 8px 12px !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }
          
          .react-trello-card-adder-form__input:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
          }
          
          .react-trello-card-adder-form__button {
            background-color: #3b82f6 !important;
            border: none !important;
            border-radius: 4px !important;
            color: white !important;
            padding: 6px 12px !important;
            cursor: pointer !important;
            margin-right: 8px !important;
            transition: background-color 0.2s !important;
          }
          
          .react-trello-card-adder-form__button:hover {
            background-color: #2563eb !important;
          }
          
          .react-trello-card-adder-form__button--cancel {
            background-color: #6b7280 !important;
          }
          
          .react-trello-card-adder-form__button--cancel:hover {
            background-color: #4b5563 !important;
          }
          
          .react-trello-lane-header__title-input {
            background-color: transparent !important;
            border: none !important;
            color: white !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            width: 100% !important;
          }
          
          .react-trello-lane-header__title-input:focus {
            outline: none !important;
            background-color: #374151 !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
          }
        `}</style>
        
        <Board
          data={getKanbanData()}
          onCardAdd={handleCardCreate}
          onCardUpdate={handleCardUpdate}
          onCardDelete={handleCardDelete}
          onLaneAdd={handleLaneCreate}
          onLaneUpdate={handleLaneUpdate}
          onLaneDelete={handleLaneDelete}
          onCardMoveAcrossLanes={handleCardMove}
          onCardClick={handleCardClick}
          onCardEdit={handleCardEdit}
          editable
          canAddLanes
          canAddCards
          canEditLanes
          canEditCards
          draggable
          laneDraggable
          cardDraggable
          style={{ backgroundColor: '#111827' }}
        />
      </div>
    </div>
  );
};

export default KanbanBoard; 
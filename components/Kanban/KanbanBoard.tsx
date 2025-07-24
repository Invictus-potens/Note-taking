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
  isDark?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ notes, tags, onNoteSelect, isDark = true }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLaneForLink, setSelectedLaneForLink] = useState<string>('');
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: [] as string[] });
  const [openLaneMenu, setOpenLaneMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

      setCards(cardsData || []);

      setColumns(columnsData || []);
    } catch (error) {
      console.error('Error fetching Kanban data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update cards when notes change (without re-fetching from database)
  const updateCardsWithNotes = useCallback(() => {
    console.log('Updating cards with notes:', { notesCount: notes.length });
    setCards(prevCards => {
      const updatedCards = prevCards.map(card => {
        const note = notes.find(note => note.id === card.note_id);
        console.log('Card:', card.id, 'Note found:', !!note, 'Note title:', note?.title);
        return {
          ...card,
          note: note
        };
      });
      console.log('Updated cards:', updatedCards.length);
      return updatedCards;
    });
  }, [notes]);



  // Initialize with default columns if none exist
  const initializeDefaultColumns = useCallback(async () => {
    if (!user) return;

    // Check if user already has columns in the database
    const { data: existingColumns, error: checkError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (checkError) {
      console.error('Error checking existing columns:', checkError);
      return;
    }

    // If columns already exist, don't create default ones
    if (existingColumns && existingColumns.length > 0) {
      setColumns(existingColumns);
      return;
    }

    // Only create default columns if none exist
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
  }, [user]);

  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData]);

  useEffect(() => {
    initializeDefaultColumns();
  }, [initializeDefaultColumns]);

  // Enrich cards with notes when both are available
  useEffect(() => {
    if (cards.length > 0 && notes.length > 0) {
      console.log('Enriching cards with notes:', { cardsCount: cards.length, notesCount: notes.length });
      updateCardsWithNotes();
    }
  }, [cards.length, notes, updateCardsWithNotes]);

  // Update cards when notes change (without re-fetching)
  useEffect(() => {
    if (cards.length > 0) {
      updateCardsWithNotes();
    }
  }, [notes, updateCardsWithNotes]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openLaneMenu && !(event.target as Element).closest('.lane-menu-container')) {
        setOpenLaneMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openLaneMenu]);

  // Convert data to react-trello format
  const getKanbanData = () => {
    const data = {
      lanes: columns.map(column => ({
        id: column.id,
        title: column.title,
        cards: cards
          .filter(card => card.column_id === column.id)
          .sort((a, b) => a.position - b.position)
          .map(card => {
            const note = card.note;
            const hasNote = !!note;
            
            return {
              id: card.id,
              title: note?.title || 'Untitled',
              description: hasNote ? note.content : 'No content available',
              note_id: card.note_id,
              note: note,
              created_at: card.created_at,
              tags: note?.tags || [],
              label: note?.tags?.slice(0, 2).join(', ') || '',
              laneId: column.id,
              // Add metadata for styling
              metadata: {
                isPinned: note?.is_pinned || false,
                isPrivate: note?.is_private || false,
                hasNote: hasNote
              }
            };
          })
      }))
    };
    
    console.log('getKanbanData called:', {
      columnsCount: columns.length,
      cardsCount: cards.length,
      lanesWithCards: data.lanes.map(lane => ({
        laneId: lane.id,
        laneTitle: lane.title,
        cardsCount: lane.cards.length,
        cardTitles: lane.cards.map(c => c.title),
        cardDetails: lane.cards.map(c => ({
          id: c.id,
          title: c.title,
          hasDescription: !!c.description,
          descriptionLength: c.description?.length || 0
        }))
      }))
    });
    
    return data;
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

  // Handle card movement across lanes
  const handleCardMoveAcrossLanes = async (fromLaneId: string, toLaneId: string, cardId: string, index: number) => {
    if (!user) return;

    try {
      // Update card position in database
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: toLaneId,
          position: index
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
          ? { ...c, column_id: toLaneId, position: index }
          : c
      ));
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  // Handle card movement within the same lane
  const handleCardMove = async (fromLaneId: string, toLaneId: string, cardId: string, index: number) => {
    if (!user) return;

    try {
      // Update card position in database
      const { error } = await supabase
        .from('kanban_cards')
        .update({ 
          column_id: toLaneId,
          position: index
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
          ? { ...c, column_id: toLaneId, position: index }
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

  // Handle opening link modal for a specific lane
  const handleOpenLinkModal = (laneId: string) => {
    setSelectedLaneForLink(laneId);
    setShowLinkModal(true);
    setOpenLaneMenu(null);
  };

  // Handle linking existing note to kanban card
  const handleLinkNote = async (noteId: string, laneId: string) => {
    if (!user) return;

    try {
      // Check if note is already linked to a card
      const existingCard = cards.find(card => card.note_id === noteId);
      if (existingCard) {
        console.log('Note is already linked to a card');
        return;
      }

      // Create a new card linked to the existing note
      const newPosition = cards.filter(c => c.column_id === laneId).length;
      const { data: cardData, error: cardError } = await supabase
        .from('kanban_cards')
        .insert([{
          user_id: user.id,
          note_id: noteId,
          column_id: laneId,
          position: newPosition
        }])
        .select();

      if (cardError) {
        console.error('Error creating card:', cardError);
        return;
      }

      const note = notes.find(n => n.id === noteId);
      const newCard = {
        ...cardData[0],
        note: note
      };

      setCards(prev => [...prev, newCard]);
      setShowLinkModal(false);
      setSelectedLaneForLink('');
    } catch (error) {
      console.error('Error linking note:', error);
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
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Board Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-b p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kanban Board</h1>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {columns.length} columns • {cards.length} cards
            </span>
          </div>

        </div>
      </div>

      {/* Edit Card Modal */}
      {showEditModal && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Card</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="card-title" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                <input
                  id="card-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter card title"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label htmlFor="card-content" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Content</label>
                <textarea
                  id="card-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter card content"
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border ${
                        editForm.tags.includes(tag.name)
                          ? 'text-white'
                          : isDark ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-400'
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
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-96`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Lane</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this lane? This action cannot be undone and will also delete all cards in this lane.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleLaneDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Note Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Link Note to Kanban</h3>
            
                          <div className="space-y-4">
                {!selectedLaneForLink && (
                  <div>
                    <label htmlFor="lane-select" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Column</label>
                    <select
                      id="lane-select"
                      value={selectedLaneForLink}
                      onChange={(e) => setSelectedLaneForLink(e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select a column...</option>
                      {columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedLaneForLink && (
                  <div className={`p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                    <div className="text-sm font-medium mb-1">Selected Column:</div>
                    <div>{columns.find(col => col.id === selectedLaneForLink)?.title}</div>
                  </div>
                )}
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Note</label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notes
                    .filter(note => !cards.some(card => card.note_id === note.id)) // Only show unlinked notes
                    .map((note) => (
                      <button
                        key={note.id}
                        onClick={() => selectedLaneForLink && handleLinkNote(note.id, selectedLaneForLink)}
                        disabled={!selectedLaneForLink}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                            : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                        } ${
                          !selectedLaneForLink 
                            ? 'opacity-50 cursor-not-allowed' 
                            : isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        <div className="font-medium">{note.title || 'Untitled'}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {note.content.substring(0, 100)}...
                        </div>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.slice(0, 3).map((tagName) => {
                              const tag = tags.find(t => t.name === tagName);
                              return (
                                <span
                                  key={tagName}
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: tag?.color || '#3b82f6',
                                    color: 'white'
                                  }}
                                >
                                  {tagName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
                {notes.filter(note => !cards.some(card => card.note_id === note.id)).length === 0 && (
                  <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    All notes are already linked to kanban cards
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedLaneForLink('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading Kanban board...</p>
            </div>
          </div>
        )}
                {!loading && (
          <>
            <style jsx global>{`
          .react-trello-board {
            background-color: ${isDark ? 'var(--bg-primary)' : '#f9fafb'} !important;
            color: ${isDark ? 'white' : 'var(--text-primary)'} !important;
            height: 100% !important;
            font-family: inherit !important;
          }
          
                      .react-trello-lane {
              background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
              border: 1px solid ${isDark ? '#374151' : '#e5e7eb'} !important;
              border-radius: 12px !important;
              margin: 0 8px !important;
              min-height: calc(100vh - 200px) !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
          
          .react-trello-lane-header {
            background-color: ${isDark ? '#374151' : '#ffffff'} !important;
            color: ${isDark ? 'white' : 'var(--text-primary)'} !important;
            border-bottom: 1px solid ${isDark ? '#4b5563' : '#e5e7eb'} !important;
            padding: 16px 20px !important;
            font-weight: 600 !important;
            border-radius: 12px 12px 0 0 !important;
          }
          
          .react-trello-lane-title {
            color: ${isDark ? 'white' : 'var(--text-primary)'} !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
          }
          
          .react-trello-card {
            background-color: ${isDark ? '#1f2937' : '#ffffff'} !important;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'} !important;
            border-radius: 12px !important;
            margin: 8px !important;
            padding: 16px !important;
            color: ${isDark ? '#f9fafb' : '#1f2937'} !important;
            cursor: pointer !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .react-trello-card::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 3px !important;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4) !important;
            opacity: 0 !important;
            transition: opacity 0.3s ease !important;
          }
          
          .react-trello-card:hover {
            background-color: ${isDark ? '#374151' : '#f8fafc'} !important;
            transform: translateY(-2px) !important;
            border-color: ${isDark ? '#4b5563' : '#d1d5db'} !important;
            box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
          
          .react-trello-card:hover::before {
            opacity: 1 !important;
          }
          
          .react-trello-card-title {
            color: ${isDark ? '#f9fafb' : '#111827'} !important;
            font-weight: 700 !important;
            font-size: 0.95rem !important;
            line-height: 1.4 !important;
            letter-spacing: -0.025em !important;
          }
          
          .react-trello-card-description {
            color: ${isDark ? '#d1d5db' : '#6b7280'} !important;
            font-size: 0.875rem !important;
            line-height: 1.5 !important;
            font-weight: 400 !important;
          }
          
          .react-trello-card-description p {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .react-trello-card-description p:not(:last-child) {
            margin-bottom: 0.5rem !important;
          }
          
          .react-trello-card-label {
            background: linear-gradient(90deg, #3b82f6, #8b5cf6) !important;
            color: white !important;
            padding: 2px 8px !important;
            border-radius: 12px !important;
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            margin-top: 8px !important;
            display: inline-block !important;
          }
          
          .react-trello-card-label:empty {
            display: none !important;
          }
          
          .react-trello-add-card {
            background-color: transparent !important;
            border: 2px dashed ${isDark ? '#6b7280' : '#9ca3af'} !important;
            border-radius: 8px !important;
            color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
            margin: 8px !important;
            padding: 12px !important;
            text-align: center !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
          }
          
          .react-trello-add-card:hover {
            background-color: ${isDark ? 'var(--bg-hover)' : '#f3f4f6'} !important;
            border-color: ${isDark ? 'var(--bg-blue)' : '#6b7280'} !important;
            color: ${isDark ? 'white' : 'var(--text-primary)'} !important;
          }
          
          .react-trello-add-lane {
            display: none !important;
          }
          
          .react-trello-add-lane:hover {
            background-color: ${isDark ? 'var(--bg-hover)' : '#f3f4f6'} !important;
            border-color: ${isDark ? 'var(--bg-blue)' : '#6b7280'} !important;
            color: ${isDark ? 'white' : 'var(--text-primary)'} !important;
          }
          
          .react-trello-lane-header__button {
            background-color: transparent !important;
            border: none !important;
            color: ${isDark ? '#9ca3af' : '#6b7280'} !important;
            cursor: pointer !important;
            padding: 4px !important;
            border-radius: 4px !important;
            transition: color 0.2s !important;
          }
          
          .react-trello-lane-header__button:hover {
            color: #ef4444 !important;
          }
          
          .react-trello-card-adder-form {
            background-color: ${isDark ? 'var(--bg-card)' : '#f3f4f6'} !important;
            border: 1px solid ${isDark ? '#4b5563' : '#d1d5db'} !important;
            border-radius: 8px !important;
            margin: 8px !important;
            padding: 12px !important;
          }
          
          .react-trello-card-adder-form__input {
            background-color: ${isDark ? '#4b5563' : '#ffffff'} !important;
            border: 1px solid ${isDark ? '#6b7280' : '#d1d5db'} !important;
            border-radius: 4px !important;
            color: ${isDark ? 'white' : '#111827'} !important;
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
            background-color: ${isDark ? '#6b7280' : '#9ca3af'} !important;
          }
          
          .react-trello-card-adder-form__button--cancel:hover {
            background-color: ${isDark ? '#4b5563' : '#6b7280'} !important;
          }
          
          .react-trello-lane-header__title-input {
            background-color: transparent !important;
            border: none !important;
            color: ${isDark ? 'white' : '#111827'} !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            width: 100% !important;
          }
          
          .react-trello-lane-header__title-input:focus {
            outline: none !important;
            background-color: ${isDark ? '#374151' : '#f3f4f6'} !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
          }
        `}</style>
        
        <Board
          key={`kanban-${cards.length}-${columns.length}`}
          data={getKanbanData()}
          onCardAdd={handleCardCreate}
          onCardUpdate={handleCardUpdate}
          onCardDelete={handleCardDelete}
          onLaneAdd={handleLaneCreate}
          onLaneUpdate={handleLaneUpdate}
          onLaneDelete={handleLaneDelete}
          onCardMoveAcrossLanes={handleCardMoveAcrossLanes}
          onCardMove={handleCardMove}
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
          style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
          components={{
            LaneHeader: ({ lane, onLaneDelete, onLaneUpdate }: any) => {
              // Add null checks to prevent errors
              if (!lane) {
                return (
                  <div className="react-trello-lane-header">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="react-trello-lane-title">Loading...</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // If lane has no title, show a default
              if (!lane.title) {
                return (
                  <div className="react-trello-lane-header">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="react-trello-lane-title">Untitled Lane</div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="react-trello-lane-header">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                      <input
                        value={lane.title || ''}
                        onChange={(e) => onLaneUpdate && onLaneUpdate(lane.id, { title: e.target.value })}
                        className="react-trello-lane-header__title-input"
                        placeholder="Enter lane title..."
                      />
                    </div>
                    <div className="relative lane-menu-container">
                      <button
                        onClick={() => setOpenLaneMenu(openLaneMenu === lane.id ? null : lane.id)}
                        className={`p-1 rounded transition-colors ${
                          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        aria-label="Lane options"
                      >
                        <i className="ri-more-2-fill"></i>
                      </button>
                      
                      {openLaneMenu === lane.id && (
                        <div className={`absolute right-0 top-8 z-50 min-w-48 rounded-lg shadow-lg border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-300'
                        }`}>
                          <div className="py-1">
                            <button
                              onClick={() => handleOpenLinkModal(lane.id)}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                isDark 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <i className="ri-link mr-2"></i>
                              Link Note
                            </button>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(lane.id);
                                setOpenLaneMenu(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                isDark 
                                  ? 'text-red-400 hover:bg-gray-700' 
                                  : 'text-red-600 hover:bg-gray-100'
                              }`}
                            >
                              <i className="ri-delete-bin-line mr-2"></i>
                              Delete Lane
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          }}
        />
          </>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard; 
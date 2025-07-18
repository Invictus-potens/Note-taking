
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import * as React from 'react';
import { useAuth } from '../lib/authContext';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Notes/Sidebar';
import NotesList from '../components/Notes/NotesList';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';


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

interface Folder {
  id: string;
  name: string;
  count: number;
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

function NotesApp() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true); // Default to dark theme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [modalError, setModalError] = useState('');

  const [notes, setNotes] = useState<Note[]>([]);
  // Remove hardcoded folders/tags from state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);


  // Fetch notes, folders, and tags from Supabase on load
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error && data) setNotes(data);
    };
    const fetchFolders = async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) setFolders(data);
    };
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) setTags(data);
    };
    fetchNotes();
    fetchFolders();
    fetchTags();
    setIsDark(true);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [user]);

  // Create a new note in Supabase
  const handleNewNote = async () => {
    if (!user) return;
    const newNote = {
      user_id: user.id,
      title: '',
      content: '',
      folder: selectedFolder === 'all' ? 'personal' : selectedFolder,
      tags: [],
      is_pinned: false,
      is_private: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('notes').insert([newNote]).select();
    if (!error && data && data[0]) {
      setNotes(prev => [data[0], ...prev]);
      setSelectedNote(data[0].id);
      setCurrentNote(data[0]);
      setIsEditing(true);
    }
  };

  // Update a note in Supabase
  const handleSaveNote = async () => {
    if (!currentNote || !user) return;
    const updatedNote = { ...currentNote, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('notes')
      .update(updatedNote)
      .eq('id', updatedNote.id)
      .eq('user_id', user.id)
      .select();
    if (!error && data && data[0]) {
      setNotes(prev => prev.map(note => note.id === updatedNote.id ? data[0] : note));
      setIsEditing(false);
    }
  };

  // Delete a note in Supabase
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);
    if (!error) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote === noteId) {
        setSelectedNote('');
        setCurrentNote(null);
      }
    }
  };

  // Pin/unpin a note in Supabase
  const handleTogglePin = async (noteId: string) => {
    if (!user) return;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const { data, error } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select();
    if (!error && data && data[0]) {
      setNotes(prev => prev.map(n => n.id === noteId ? data[0] : n));
    }
  };

  const handleNoteSelect = (noteId: string) => {
    const note = notes.find((n: Note) => n.id === noteId);
    if (note) {
      setSelectedNote(noteId);
      setCurrentNote(note);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Restore original note content
    const originalNote = notes.find((n: Note) => n.id === currentNote?.id);
    if (originalNote) {
      setCurrentNote(originalNote);
    }
  };

  // Folder and Tag creation functions
  // Update handleCreateFolder to persist to Supabase
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setModalError('Nome da pasta não pode ser vazio');
      return;
    }
    if (!user) return;
    const exists = folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase());
    if (exists) {
      setModalError('Uma pasta com este nome já existe');
      return;
    }
    const { data, error } = await supabase
      .from('folders')
      .insert([{ user_id: user.id, name: newFolderName.trim() }])
      .select();
    if (!error && data && data[0]) {
      setFolders(prev => [...prev, data[0]]);
      setNewFolderName('');
      setModalError('');
      setShowFolderModal(false);
    } else {
      console.error('Erro ao criar pasta:', error);
      setModalError(error?.message || 'Erro ao criar pasta');
    }
  };

  // Update handleCreateTag to persist to Supabase
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setModalError('Nome da etiqueta não pode ser vazio');
      return;
    }
    if (!user) return;
    const exists = tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      setModalError('Uma etiqueta com este nome já existe');
      return;
    }
    const { data, error } = await supabase
      .from('tags')
      .insert([{ user_id: user.id, name: newTagName.trim() }])
      .select();
    if (!error && data && data[0]) {
      setTags(prev => [...prev, data[0]]);
      setNewTagName('');
      setModalError('');
      setShowTagModal(false);
    } else {
      console.error('Erro ao criar etiqueta:', error);
      setModalError(error?.message || 'Erro ao criar etiqueta');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    
    try {
      // First, move all notes from this folder to 'personal' in the database
      const { error: updateError } = await supabase
        .from('notes')
        .update({ folder: 'personal' })
        .eq('folder', folderId)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Erro ao mover notas:', updateError);
        return;
      }
      
      // Then delete the folder from the database
      const { error: deleteError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error('Erro ao deletar pasta:', deleteError);
        return;
      }
      
      // Update local state
      setNotes((prev: Note[]) => prev.map((note: Note) => 
        note.folder === folderId ? { ...note, folder: 'personal' } : note
      ));
      
      setFolders((prev: Folder[]) => prev.filter((folder: Folder) => folder.id !== folderId));
      
      if (selectedFolder === folderId) {
        setSelectedFolder('all');
      }
    } catch (error) {
      console.error('Erro ao deletar pasta:', error);
    }
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return;
    
    try {
      // Get the tag name to remove from notes
      const tagToDelete = tags.find(tag => tag.id === tagId);
      if (!tagToDelete) return;
      
      // Remove this tag from all notes in the database
      const { data: notesToUpdate, error: fetchError } = await supabase
        .from('notes')
        .select('id, tags')
        .eq('user_id', user.id)
        .contains('tags', [tagToDelete.name]);
      
      if (fetchError) {
        console.error('Erro ao buscar notas:', fetchError);
        return;
      }
      
      // Update each note to remove the tag
      for (const note of notesToUpdate || []) {
        const updatedTags = note.tags.filter((tag: string) => tag !== tagToDelete.name);
        const { error: updateError } = await supabase
          .from('notes')
          .update({ tags: updatedTags })
          .eq('id', note.id)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Erro ao atualizar nota:', updateError);
        }
      }
      
      // Delete the tag from the database
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error('Erro ao deletar etiqueta:', deleteError);
        return;
      }
      
      // Update local state
      setNotes((prev: Note[]) => prev.map((note: Note) => ({
        ...note,
        tags: note.tags.filter((tag: string) => tag !== tagToDelete.name)
      })));
      
      setTags((prev: Tag[]) => prev.filter((tag: Tag) => tag.id !== tagId));
      setSelectedTags(prev => prev.filter(t => t !== tagId));
    } catch (error) {
      console.error('Erro ao deletar etiqueta:', error);
    }
  };

  const filteredNotes = notes.filter((note: Note) => {
    if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
    if (selectedTags.length > 0 && !selectedTags.every(tag => note.tags.includes(tag))) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter((note: Note) => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter((note: Note) => !note.is_pinned);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    return date.toLocaleDateString();
  };

  const handleToggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('notesapp_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('notesapp_theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };



  // Dynamically calculate folder/tag counts from notes
  const foldersWithCounts = folders.map(folder => ({
    ...folder,
    count: notes.filter(note => note.folder === folder.id || note.folder === folder.name).length
  }));
  const tagsWithCounts = tags.map(tag => ({
    ...tag,
    count: notes.filter(note => note.tags.includes(tag.name)).length
  }));

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="new-note-btn" onClick={handleNewNote}>
            <i className="ri-add-line minimalist-icon"></i>
            Nova Nota
          </button>
        </div>

        <div className="section-header">
          <div className="section-title">Pastas</div>
          <button 
            className="add-btn"
            onClick={() => setShowFolderModal(true)}
            aria-label="Add new folder"
          >
            <i className="ri-add-line minimalist-icon"></i>
          </button>
        </div>
        
        <div className="sidebar-item" onClick={() => setSelectedFolder('all')}>
          <div className="sidebar-item-left">
            <i className="ri-file-text-line minimalist-icon"></i>
            <span>Todas as Notas</span>
          </div>
          <div className="badge">{notes.length}</div>
        </div>
        
        {foldersWithCounts.map((folder: Folder) => (
          <div 
            key={folder.id} 
            className={`sidebar-item ${selectedFolder === folder.id ? 'selected' : ''}`}
            onClick={() => setSelectedFolder(folder.id)}
          >
            <div className="sidebar-item-left">
              <i className="ri-folder-line minimalist-icon"></i>
              <span>{folder.name}</span>
            </div>
            <div className="sidebar-item-right">
              <div className="badge">{folder.count}</div>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                aria-label={`Delete folder ${folder.name}`}
              >
                <i className="ri-delete-bin-line minimalist-icon"></i>
              </button>
            </div>
          </div>
        ))}

        <div className="section-header">
          <div className="section-title">Etiquetas</div>
          <button 
            className="add-btn"
            onClick={() => setShowTagModal(true)}
            aria-label="Add new tag"
          >
            <i className="ri-add-line minimalist-icon"></i>
          </button>
        </div>
        
        {tagsWithCounts.map((tag: Tag) => (
          <div 
            key={tag.id} 
            className={`sidebar-item ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
            onClick={() => handleTagSelect(tag.id)}
          >
            <div className="sidebar-item-left">
              <i className="ri-price-tag-3-line minimalist-icon"></i>
              <span>#{tag.name}</span>
            </div>
            <div className="sidebar-item-right">
              <div className="badge">{tag.count}</div>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id);
                }}
                aria-label={`Delete tag ${tag.name}`}
              >
                <i className="ri-delete-bin-line minimalist-icon"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content-area">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="app-title">NotesApp</div>
          <div className="top-bar-actions">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="theme-toggle" onClick={handleToggleTheme} aria-label="Toggle theme">
              <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
            </button>
            
            <button className="signout-btn" onClick={handleSignOut} aria-label="Sign out">
              <i className="ri-logout-box-line"></i>
            </button>
          </div>
        </div>

        <div className="main-content-columns" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          {/* Middle Column */}
          <div className="middle-column">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Pesquisar notas..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="notes-container">
              {pinnedNotes.length > 0 && (
                <div className="notes-section">
                  <div className="notes-section-title">Notas Fixadas</div>
                  {pinnedNotes.map((note: Note) => (
                    <div 
                      key={note.id}
                      className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                      onClick={() => handleNoteSelect(note.id)}
                    >
                      <div className="note-header">
                        <div className="note-title">{note.title || 'Sem título'}</div>
                        <div className="note-date">{formatDate(note.updated_at)}</div>
                      </div>
                      <div className="note-preview">{note.content}</div>
                      {note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.map((tag: string) => (
                            <span key={tag} className="tag-pill">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="note-actions">
                        <button 
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(note.id);
                          }}
                          aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
                        >
                          <i className="ri-pushpin-fill minimalist-icon"></i>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          aria-label="Delete note"
                        >
                          <i className="ri-delete-bin-line minimalist-icon"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="notes-section">
                <div className="notes-section-title">Todas as Notas</div>
                {unpinnedNotes.map((note: Note) => (
                  <div 
                    key={note.id}
                    className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                    onClick={() => handleNoteSelect(note.id)}
                  >
                    <div className="note-header">
                      <div className="note-title">{note.title || 'Sem título'}</div>
                      <div className="note-date">{formatDate(note.updated_at)}</div>
                    </div>
                    <div className="note-preview">{note.content}</div>
                    {note.tags.length > 0 && (
                      <div className="note-tags">
                        {note.tags.map((tag: string) => {
                          const tagObj = tags.find(t => t.id === tag);
                          return tagObj ? (
                            <span key={tag} className="tag-pill">#{tagObj.name}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="note-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(note.id);
                        }}
                        aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
                      >
                        <i className="ri-pushpin-fill minimalist-icon"></i>
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        aria-label="Delete note"
                      >
                        <i className="ri-delete-bin-line minimalist-icon"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Pane */}
          <div className="right-pane">
            {currentNote ? (
              <div className="note-editor">
                <div className="editor-header">
                  <div className="editor-title">Editor de Notas</div>
                  <div className="editor-actions">
                    {isEditing ? (
                      <>
                        <button className="editor-btn" onClick={handleCancelEdit}>
                          Cancelar
                        </button>
                        <button className="editor-btn primary" onClick={handleSaveNote}>
                          Salvar
                        </button>
                      </>
                    ) : (
                      <button className="editor-btn primary" onClick={() => setIsEditing(true)}>
                        Editar
                      </button>
                    )}
                  </div>
                </div>
                <div className="editor-content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        className="editor-input"
                        value={currentNote.title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentNote({ ...currentNote, title: e.target.value })}
                        placeholder="Título da nota..."
                      />
                      <textarea
                        className="editor-textarea"
                        value={currentNote.content}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder="Comece a escrever sua nota..."
                        style={{ minHeight: '200px', maxHeight: '40vh', overflowY: 'auto' }}
                      />
                      <div className="editor-tags">
                        <div className="editor-tags-label">Etiquetas:</div>
                        <div className="editor-tags-list">
                          {tags.length === 0 && (
                            <span className="editor-tags-empty">Nenhuma etiqueta criada ainda.</span>
                          )}
                          {tags.map((tag: Tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className={`tag-pill editor-tag-btn${currentNote.tags.includes(tag.id) ? ' selected' : ''}`}
                              onClick={() => {
                                if (currentNote.tags.includes(tag.id)) {
                                  setCurrentNote({
                                    ...currentNote,
                                    tags: currentNote.tags.filter(t => t !== tag.id)
                                  });
                                } else {
                                  setCurrentNote({
                                    ...currentNote,
                                    tags: [...currentNote.tags, tag.id]
                                  });
                                }
                              }}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="editor-input">{currentNote.title || 'Sem título'}</h1>
                      <div className="editor-textarea" style={{ whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto' }}>
                        {currentNote.content || 'Sem conteúdo'}
                      </div>
                      {currentNote.tags.length > 0 && (
                        <div className="note-tags" style={{ marginTop: '16px' }}>
                          {currentNote.tags.map((tagId: string) => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <span key={tag.id} className="tag-pill">#{tag.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-title">Editor de Notas</div>
                <div className="empty-subtitle"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                              <h3>Criar Nova Pasta</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFolderModal(false)}
                aria-label="Close modal"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-content">
              <input
                type="text"
                className="modal-input"
                placeholder="Digite o nome da pasta..."
                value={newFolderName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              {modalError && <div className="modal-error">{modalError}</div>}
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowFolderModal(false)}>
                Cancelar
              </button>
              <button className="modal-btn primary" onClick={handleCreateFolder}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Creation Modal */}
      {showTagModal && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Nova Etiqueta</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTagModal(false)}
                aria-label="Close modal"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="modal-content">
              <input
                type="text"
                className="modal-input"
                placeholder="Digite o nome da etiqueta..."
                value={newTagName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                autoFocus
              />
              {modalError && <div className="modal-error">{modalError}</div>}
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowTagModal(false)}>
                Cancelar
              </button>
              <button className="modal-btn primary" onClick={handleCreateTag}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <NotesApp />
    </ProtectedRoute>
  );
}


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
      setModalError('Folder name cannot be empty');
      return;
    }
    if (!user) return;
    const exists = folders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase());
    if (exists) {
      setModalError('A folder with this name already exists');
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
      console.error('Folder creation error:', error);
      setModalError(error?.message || 'Failed to create folder');
    }
  };

  // Update handleCreateTag to persist to Supabase
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setModalError('Tag name cannot be empty');
      return;
    }
    if (!user) return;
    const exists = tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      setModalError('A tag with this name already exists');
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
      console.error('Tag creation error:', error);
      setModalError(error?.message || 'Failed to create tag');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    // Move notes from deleted folder to 'personal'
    setNotes((prev: Note[]) => prev.map((note: Note) => 
      note.folder === folderId ? { ...note, folder: 'personal' } : note
    ));
    
    setFolders((prev: Folder[]) => prev.filter((folder: Folder) => folder.id !== folderId));
    
    if (selectedFolder === folderId) {
      setSelectedFolder('all');
    }
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteTag = (tagId: string) => {
    // Remove tag from all notes
    setNotes((prev: Note[]) => prev.map((note: Note) => ({
      ...note,
      tags: note.tags.filter((tag: string) => tag !== tagId)
    })));
    
    setTags((prev: Tag[]) => prev.filter((tag: Tag) => tag.id !== tagId));
    setSelectedTags(prev => prev.filter(t => t !== tagId));
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
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
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
            <i className="ri-add-line minimalist-icon">+</i>
            New Note
          </button>
        </div>

        <div className="section-header">
          <div className="section-title">Folders</div>
          <button 
            className="add-btn"
            onClick={() => setShowFolderModal(true)}
            aria-label="Add new folder"
          >
            <i className="ri-add-line minimalist-icon">+</i>
          </button>
        </div>
        
        <div className="sidebar-item" onClick={() => setSelectedFolder('all')}>
          <div className="sidebar-item-left">
            <i className="ri-file-text-line minimalist-icon">🗒️</i>
            <span>All Notes</span>
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
              <i className="ri-folder-line minimalist-icon">▣</i>
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
                <i className="ri-delete-bin-line minimalist-icon">✕</i>
              </button>
            </div>
          </div>
        ))}

        <div className="section-header">
          <div className="section-title">Tags</div>
          <button 
            className="add-btn"
            onClick={() => setShowTagModal(true)}
            aria-label="Add new tag"
          >
            <i className="ri-add-line minimalist-icon">+</i>
          </button>
        </div>
        
        {tagsWithCounts.map((tag: Tag) => (
          <div 
            key={tag.id} 
            className={`sidebar-item ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
            onClick={() => handleTagSelect(tag.id)}
          >
            <div className="sidebar-item-left">
              <i className="ri-price-tag-3-line minimalist-icon">#</i>
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
                <i className="ri-delete-bin-line minimalist-icon">✕</i>
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
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="notes-container">
              {pinnedNotes.length > 0 && (
                <div className="notes-section">
                  <div className="notes-section-title">Pinned Notes</div>
                  {pinnedNotes.map((note: Note) => (
                    <div 
                      key={note.id}
                      className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                      onClick={() => handleNoteSelect(note.id)}
                    >
                      <div className="note-header">
                        <div className="note-title">{note.title || 'Untitled'}</div>
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
                          <i className="ri-pushpin-fill minimalist-icon">📌</i>
                        </button>
                        <button 
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          aria-label="Delete note"
                        >
                          <i className="ri-delete-bin-line minimalist-icon">✕</i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="notes-section">
                <div className="notes-section-title">All Notes</div>
                {unpinnedNotes.map((note: Note) => (
                  <div 
                    key={note.id}
                    className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                    onClick={() => handleNoteSelect(note.id)}
                  >
                    <div className="note-header">
                      <div className="note-title">{note.title || 'Untitled'}</div>
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
                        <i className="ri-pushpin-fill minimalist-icon">📌</i>
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        aria-label="Delete note"
                      >
                        <i className="ri-delete-bin-line minimalist-icon">✕</i>
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
                  <div className="editor-title">Note Editor</div>
                  <div className="editor-actions">
                    {isEditing ? (
                      <>
                        <button className="editor-btn" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                        <button className="editor-btn primary" onClick={handleSaveNote}>
                          Save
                        </button>
                      </>
                    ) : (
                      <button className="editor-btn primary" onClick={() => setIsEditing(true)}>
                        Edit
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
                        placeholder="Note title..."
                      />
                      <textarea
                        className="editor-textarea"
                        value={currentNote.content}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder="Start writing your note..."
                        style={{ minHeight: '200px', maxHeight: '40vh', overflowY: 'auto' }}
                      />
                      <div className="editor-tags">
                        <div className="editor-tags-label">Tags:</div>
                        <div className="editor-tags-list">
                          {tags.length === 0 && (
                            <span className="editor-tags-empty">No tags created yet.</span>
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
                              #{tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="editor-input">{currentNote.title || 'Untitled'}</h1>
                      <div className="editor-textarea" style={{ whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto' }}>
                        {currentNote.content || 'No content'}
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
                <div className="empty-title">Note Editor</div>
                <div className="empty-subtitle">Note editing functionality will be implemented here</div>
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
              <h3>Create New Folder</h3>
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
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              {modalError && <div className="modal-error">{modalError}</div>}
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowFolderModal(false)}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleCreateFolder}>
                Create
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
              <h3>Create New Tag</h3>
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
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                autoFocus
              />
              {modalError && <div className="modal-error">{modalError}</div>}
            </div>
            <div className="modal-actions">
              <button className="modal-btn" onClick={() => setShowTagModal(false)}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleCreateTag}>
                Create
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

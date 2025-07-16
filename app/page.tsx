
'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Notes/Sidebar';
import NotesList from '../components/Notes/NotesList';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isPrivate: boolean;
}

export default function Home() {
  const [isDark, setIsDark] = useState(true); // Default to dark theme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<any[]>([
    { id: 'personal', name: 'Personal', count: 0 },
    { id: 'work', name: 'Work', count: 0 },
    { id: 'projects', name: 'Projects', count: 0 }
  ]);
  const [tags, setTags] = useState<any[]>([
    { id: 'important', name: 'Important', count: 0 },
    { id: 'ideas', name: 'Ideas', count: 0 },
    { id: 'todo', name: 'To-Do', count: 0 }
  ]);

  useEffect(() => {
    // Load data from localStorage
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      // Add some sample notes
      const sampleNotes = [
        {
          id: '1',
          title: 'Welcome to NotesApp',
          content: 'This is your first note! You can edit, organize, and manage all your notes here.',
          folder: 'personal',
          tags: ['important'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: true,
          isPrivate: false
        },
        {
          id: '2',
          title: 'Meeting Notes',
          content: 'Remember to discuss project timeline and budget allocation.',
          folder: 'work',
          tags: ['todo'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: false,
          isPrivate: false
        }
      ];
      setNotes(sampleNotes);
      localStorage.setItem('notes', JSON.stringify(sampleNotes));
    }

    // Always start with dark theme
    setIsDark(true);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

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

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      folder: selectedFolder === 'all' ? 'personal' : selectedFolder,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      isPrivate: false
    };
    
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote.id);
    setCurrentNote(newNote);
    setIsEditing(true);
  };

  const handleNoteSelect = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(noteId);
      setCurrentNote(note);
      setIsEditing(false);
    }
  };

  const handleTogglePin = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNote === noteId) {
      setSelectedNote('');
      setCurrentNote(null);
    }
  };

  const handleSaveNote = () => {
    if (!currentNote) return;

    setNotes(prev => prev.map(note => 
      note.id === currentNote.id 
        ? { ...currentNote, updatedAt: new Date().toISOString() }
        : note
    ));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Restore original note content
    const originalNote = notes.find(n => n.id === currentNote?.id);
    if (originalNote) {
      setCurrentNote(originalNote);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

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

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="app-title">NotesApp</div>
        <button className="theme-toggle" onClick={handleToggleTheme} aria-label="Toggle theme">
          <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
        </button>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <button className="new-note-btn" onClick={handleNewNote}>
          <i className="ri-add-line"></i>
          New Note
        </button>

        <div className="section-title">Folders</div>
        <div className="sidebar-item" onClick={() => setSelectedFolder('all')}>
          <div className="sidebar-item-left">
            <i className="ri-folder-line sidebar-icon"></i>
            <span>All Notes</span>
          </div>
          <div className="badge">{notes.length}</div>
        </div>
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className={`sidebar-item ${selectedFolder === folder.id ? 'selected' : ''}`}
            onClick={() => setSelectedFolder(folder.id)}
          >
            <div className="sidebar-item-left">
              <i className="ri-folder-line sidebar-icon"></i>
              <span>{folder.name}</span>
            </div>
            <div className="badge">{notes.filter(note => note.folder === folder.id).length}</div>
          </div>
        ))}

        <div className="section-title">Tags</div>
        {tags.map(tag => (
          <div 
            key={tag.id} 
            className={`sidebar-item ${selectedTag === tag.id ? 'selected' : ''}`}
            onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
          >
            <div className="sidebar-item-left">
              <i className="ri-price-tag-3-line sidebar-icon"></i>
              <span>#{tag.name}</span>
            </div>
            <div className="badge">{notes.filter(note => note.tags.includes(tag.id)).length}</div>
          </div>
        ))}
      </div>

      {/* Middle Column */}
      <div className="middle-column">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="notes-container">
          {pinnedNotes.length > 0 && (
            <div className="notes-section">
              <div className="notes-section-title">Pinned Notes</div>
              {pinnedNotes.map(note => (
                <div 
                  key={note.id}
                  className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                  onClick={() => handleNoteSelect(note.id)}
                >
                  <div className="note-header">
                    <div className="note-title">{note.title || 'Untitled'}</div>
                    <div className="note-date">{formatDate(note.updatedAt)}</div>
                  </div>
                  <div className="note-preview">{note.content}</div>
                  {note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.map(tag => (
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
                      aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      <i className="ri-pushpin-fill"></i>
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      aria-label="Delete note"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="notes-section">
            <div className="notes-section-title">All Notes</div>
            {unpinnedNotes.map(note => (
              <div 
                key={note.id}
                className={`note-card ${selectedNote === note.id ? 'selected' : ''}`}
                onClick={() => handleNoteSelect(note.id)}
              >
                <div className="note-header">
                  <div className="note-title">{note.title || 'Untitled'}</div>
                  <div className="note-date">{formatDate(note.updatedAt)}</div>
                </div>
                <div className="note-preview">{note.content}</div>
                {note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
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
                    aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                  >
                    <i className="ri-pushpin-fill"></i>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    aria-label="Delete note"
                  >
                    <i className="ri-delete-bin-line"></i>
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
            <div className="editor-content">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className="editor-input"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                    placeholder="Note title..."
                  />
                  <textarea
                    className="editor-textarea"
                    value={currentNote.content}
                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                    placeholder="Start writing your note..."
                  />
                </>
              ) : (
                <>
                  <h1 className="editor-input">{currentNote.title || 'Untitled'}</h1>
                  <div className="editor-textarea" style={{ whiteSpace: 'pre-wrap' }}>
                    {currentNote.content || 'No content'}
                  </div>
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
  );
}

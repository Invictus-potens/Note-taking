
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
  const [isDark, setIsDark] = useState(false);
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

    // Check for dark mode preference
    const savedTheme = localStorage.getItem('notesapp_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
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
      document.documentElement.classList.add('dark');
      localStorage.setItem('notesapp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
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

  const filteredNotes = notes.filter(note => {
    if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Header 
        onToggleTheme={handleToggleTheme} 
        isDark={isDark} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          tags={tags}
          selectedFolder={selectedFolder}
          selectedTag={selectedTag}
          onFolderSelect={setSelectedFolder}
          onTagSelect={setSelectedTag}
          onNewNote={handleNewNote}
        />
        
        <div className="flex-1 flex">
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            
            <NotesList
              notes={filteredNotes}
              selectedNote={selectedNote}
              onNoteSelect={handleNoteSelect}
              onTogglePin={handleTogglePin}
              onDeleteNote={handleDeleteNote}
              searchTerm={searchTerm}
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            {currentNote ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {currentNote.isPinned && (
                        <i className="ri-pushpin-fill text-blue-500"></i>
                      )}
                      {currentNote.isPrivate && (
                        <i className="ri-lock-fill text-yellow-500"></i>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(currentNote.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={() => setIsEditing(false)} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveNote} variant="primary" size="sm">
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)} 
                        variant="primary" 
                        size="sm"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        value={currentNote.title}
                        onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                        placeholder="Note title..."
                        className="text-2xl font-bold border-none p-0 focus:ring-0"
                      />
                      <textarea
                        value={currentNote.content}
                        onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder="Start writing your note..."
                        className="w-full h-96 p-0 border-none resize-none focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 bg-transparent"
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        {currentNote.title || 'Untitled'}
                      </h1>
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {currentNote.content || 'No content'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <i className="ri-file-text-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Select a note to view
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a note from the sidebar or create a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

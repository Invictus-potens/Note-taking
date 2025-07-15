
'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { NotesService, FoldersService, TagsService } from '../lib/supabaseServices';
import { Note } from '../lib/database';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Notes/Sidebar';
import NotesList from '../components/Notes/NotesList';
import AuthModal from '../components/Auth/AuthModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';



interface AppUser {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const appUser = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || ''
        };
        setUser(appUser);
        setSupabaseUser(session.user);
        loadUserData(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        const appUser = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || ''
        };
        setUser(appUser);
        setSupabaseUser(session.user);
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setSupabaseUser(null);
        setNotes([]);
        setFolders([]);
        setTags([]);
      }
      setIsLoading(false);
    });

    // Check for dark mode preference
    const savedTheme = localStorage.getItem('notesapp_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setIsSyncing(true);
      
      // Load notes with real-time updates
      const unsubscribe = NotesService.subscribeToNotes(userId, (notes) => {
        setNotes(notes);
      });

      // Load folders and tags
      const [userFolders, userTags] = await Promise.all([
        FoldersService.getFolders(userId),
        TagsService.getTags(userId)
      ]);

      // Add default folders if none exist
      if (userFolders.length === 0) {
        await Promise.all([
          FoldersService.addFolder('Personal', userId),
          FoldersService.addFolder('Work', userId),
          FoldersService.addFolder('Projects', userId)
        ]);
        const newFolders = await FoldersService.getFolders(userId);
        setFolders(newFolders.map(f => ({ id: f.id, name: f.name, count: 0 })));
      } else {
        setFolders(userFolders.map(f => ({ id: f.id, name: f.name, count: 0 })));
      }

      setTags(userTags.map(t => ({ id: t.id, name: t.name, count: 0 })));

      return unsubscribe;
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const handleNewNote = async () => {
    if (!user) return;

    try {
      setIsSyncing(true);
      const now = new Date().toISOString();
      const newNote = {
        title: '',
        content: '',
        folder: selectedFolder === 'all' ? 'personal' : selectedFolder,
        tags: [],
        is_pinned: false,
        is_private: false,
        user_id: user.id,
      };
      
      const noteId = await NotesService.addNote(newNote);
      // Fetch the full note from Supabase to get created_at and updated_at
      const { data: noteData } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (noteData) {
        setSelectedNote(noteId);
        setCurrentNote(noteData);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNoteSelect = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(noteId);
      setCurrentNote(note);
      setIsEditing(false);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    try {
      setIsSyncing(true);
      await NotesService.updateNote(noteId, { is_pinned: !note.is_pinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setIsSyncing(true);
      await NotesService.deleteNote(noteId);
      if (selectedNote === noteId) {
        setSelectedNote('');
        setCurrentNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote) return;

    try {
      setIsSyncing(true);
      await NotesService.updateNote(currentNote.id, {
        title: currentNote.title,
        content: currentNote.content,
        folder: currentNote.folder,
        tags: currentNote.tags,
        is_pinned: currentNote.is_pinned,
        is_private: currentNote.is_private
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading your notes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onToggleTheme={handleToggleTheme} 
          isDark={isDark} 
        />
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-file-text-line text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-pacifico">
              NotesApp
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your secure, organized, and intelligent note-taking companion. Capture ideas, organize thoughts, and boost your productivity with real-time cloud sync.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setShowAuthModal(true)} 
                variant="primary" 
                className="w-full"
              >
                Get Started
              </Button>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <i className="ri-shield-check-line mr-1"></i>
                  Secure
                </div>
                <div className="flex items-center">
                  <i className="ri-cloud-line mr-1"></i>
                  Cloud Sync
                </div>
                <div className="flex items-center">
                  <i className="ri-smartphone-line mr-1"></i>
                  Mobile Ready
                </div>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onToggleTheme={handleToggleTheme} 
        isDark={isDark} 
      />
      
      {isSyncing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-blue-600 dark:text-blue-400">
            <i className="ri-cloud-line animate-pulse mr-2"></i>
            Syncing with cloud...
          </div>
        </div>
      )}
      
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

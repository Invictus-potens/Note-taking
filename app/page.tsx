
'use client';

import { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../lib/authContext';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Notes/Sidebar';
import NotesList from '../components/Notes/NotesList';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AIAssistant from '../components/AI/AIAssistant';
import QuillEditor from '../components/ui/QuillEditor';
import DragDropWrapper from '../components/ui/DragDropWrapper';
import ClientOnly from '../components/ui/ClientOnly';
import Toast from '../components/ui/Toast';
import DragDropHint from '../components/ui/DragDropHint';
import CalendarModal from '../components/Calendar/CalendarModal';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { setDocumentAttribute, setLocalStorage } from '../lib/clientUtils';

// Import types for drag and drop
import type { DropResult } from 'react-beautiful-dnd';

// Dynamic import for Droppable
const Droppable = dynamic(() => import('react-beautiful-dnd').then(mod => ({ default: mod.Droppable })), {
  ssr: false
});

// Dynamic import for Draggable
const Draggable = dynamic(() => import('react-beautiful-dnd').then(mod => ({ default: mod.Draggable })), {
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

interface Folder {
  id: string;
  name: string;
  count: number;
}

interface Tag {
  id: string;
  name: string;
  count: number;
  color?: string;
}

function NotesApp() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // Handle authentication errors from URL parameters
  useEffect(() => {
    const handleAuthErrors = () => {
      // Check for error parameters in URL hash
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const error = params.get('error');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');
        
        if (error === 'access_denied' && errorCode === 'otp_expired') {
          // Clear the error from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Show user-friendly error message
          setToast({
            message: 'O link de confirmação expirou. Por favor, solicite um novo link de confirmação.',
            type: 'error'
          });
        }
      }

      // Check for auth_error query parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth_error') === 'true') {
        // Clear the error from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show user-friendly error message
        setToast({
          message: 'Erro na autenticação. Por favor, tente novamente.',
          type: 'error'
        });
      }
    };

    handleAuthErrors();
  }, []);

  const [isDark, setIsDark] = useState(true); // Default to dark theme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  // Dual note viewing state
  const [isSplitView, setIsSplitView] = useState(false);
  const [selectedNote2, setSelectedNote2] = useState<string>('');
  const [currentNote2, setCurrentNote2] = useState<Note | null>(null);
  const [isEditing2, setIsEditing2] = useState(false);

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6'); // Default blue color
  const [modalError, setModalError] = useState('');

  // Predefined colors for tags
  const tagColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#84cc16', // lime
  ];

  const [notes, setNotes] = useState<Note[]>([]);
  // Remove hardcoded folders/tags from state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Fetch notes, folders, and tags from Supabase on load
  useEffect(() => {
    if (!user) return;
    
    const migrateTagData = async () => {
      // Check if any notes have tag IDs instead of tag names and migrate them
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('id, tags')
        .eq('user_id', user.id);
      
      if (notesError) {
        console.error('Error fetching notes for migration:', notesError);
        return;
      }
      
      // Get all tags to create a mapping from ID to name
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (tagsError) {
        console.error('Error fetching tags for migration:', tagsError);
        return;
      }
      
      const tagIdToName = new Map(tagsData?.map(tag => [tag.id, tag.name]) || []);
      
      // Update notes that have tag IDs instead of tag names
      for (const note of notesData || []) {
        if (note.tags && Array.isArray(note.tags)) {
          const updatedTags = note.tags.map(tag => {
            if (tagIdToName.has(tag)) {
              return tagIdToName.get(tag);
            }
            return tag;
          }).filter(Boolean);
          
          if (JSON.stringify(updatedTags) !== JSON.stringify(note.tags)) {
            await supabase
              .from('notes')
              .update({ tags: updatedTags })
              .eq('id', note.id);
          }
        }
      }
    };

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
    
    // Run migration first, then fetch data
    migrateTagData().then(() => {
      fetchNotes();
      fetchFolders();
      fetchTags();
    });
    
    setIsDark(true);
    setDocumentAttribute('data-theme', 'dark');
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
      // Scroll to the new note after a short delay to ensure it's rendered
      setTimeout(() => scrollToNote(data[0].id), 100);
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
    if (isSplitView) {
      // In split view mode
      if (noteId === selectedNote) {
        // Clicking on the first selected note - do nothing
        return;
      } else if (noteId === selectedNote2) {
        // Clicking on the second selected note - do nothing
        return;
      } else {
        // Clicking on a new note - replace the second note
        setSelectedNote2(noteId);
        const note = notes.find(n => n.id === noteId);
        setCurrentNote2(note || null);
        setIsEditing2(false);
      }
    } else {
      // Normal single note selection
      setSelectedNote(noteId);
      const note = notes.find(n => n.id === noteId);
      setCurrentNote(note || null);
      setIsEditing(false);
    }
  };

  const handleNoteSelect2 = (noteId: string) => {
    setSelectedNote2(noteId);
    const note = notes.find(n => n.id === noteId);
    setCurrentNote2(note || null);
    setIsEditing2(false);
  };

  const handleCancelEdit = () => {
    if (currentNote) {
      const originalNote = notes.find(n => n.id === currentNote.id);
      setCurrentNote(originalNote || null);
    }
    setIsEditing(false);
  };

  const handleCancelEdit2 = () => {
    if (currentNote2) {
      const originalNote = notes.find(n => n.id === currentNote2.id);
      setCurrentNote2(originalNote || null);
    }
    setIsEditing2(false);
  };

  const handleSaveNote2 = async () => {
    if (!currentNote2 || !user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: currentNote2.title,
          content: currentNote2.content,
          tags: currentNote2.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentNote2.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Error updating note:', error);
        setToast({ message: 'Erro ao salvar nota', type: 'error' });
        return;
      }

      if (data) {
        setNotes(prev => prev.map(note => 
          note.id === currentNote2.id ? { ...note, ...data[0] } : note
        ));
        setCurrentNote2(data[0]);
        setIsEditing2(false);
        setToast({ message: 'Nota salva com sucesso', type: 'success' });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setToast({ message: 'Erro ao salvar nota', type: 'error' });
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
      setModalError('Erro ao criar pasta');
    }
  };

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
      .insert([{ user_id: user.id, name: newTagName.trim(), color: newTagColor }])
      .select();
    if (!error && data && data[0]) {
      setTags(prev => [...prev, data[0]]);
      setNewTagName('');
      setNewTagColor('#3b82f6'); // Reset color to default
      setModalError('');
      setShowTagModal(false);
    } else {
      setModalError('Erro ao criar etiqueta');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    
    // First, move all notes from this folder to 'personal'
    const { error: updateError } = await supabase
      .from('notes')
      .update({ folder: 'personal' })
      .eq('folder', folderId)
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Error updating notes:', updateError);
      return;
    }
    
    // Then delete the folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', user.id);
    
    if (!deleteError) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      // Update notes in state
      setNotes(prev => prev.map(note => 
        note.folder === folderId ? { ...note, folder: 'personal' } : note
      ));
    }
  };

  const handleTagSelect = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setSelectedTags(prev => 
        prev.includes(tag.name) 
          ? prev.filter(t => t !== tag.name)
          : [...prev, tag.name]
      );
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return;
    
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    // Get all notes that contain this tag
    const { data: notesToUpdate, error: fetchError } = await supabase
      .from('notes')
      .select('id, tags')
      .eq('user_id', user.id)
      .contains('tags', [tag.name]);
    
    if (fetchError) {
      console.error('Error fetching notes:', fetchError);
      return;
    }
    
    // Update each note to remove the tag
    for (const note of notesToUpdate || []) {
      const updatedTags = note.tags.filter((t: string) => t !== tag.name);
      const { error: updateError } = await supabase
        .from('notes')
        .update({ tags: updatedTags })
        .eq('id', note.id)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating note:', updateError);
      }
    }
    
    // Delete the tag
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', user.id);
    
    if (!deleteError) {
      setTags(prev => prev.filter(t => t.id !== tagId));
      // Update notes in state
      setNotes(prev => prev.map(note => ({
        ...note,
        tags: note.tags.filter(t => t !== tag.name)
      })));
    }
  };

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
      setDocumentAttribute('data-theme', 'dark');
      setLocalStorage('notesapp_theme', 'dark');
    } else {
      setDocumentAttribute('data-theme', 'light');
      setLocalStorage('notesapp_theme', 'light');
    }
  };

  const handleToggleSplitView = () => {
    if (isSplitView) {
      // Exit split view - keep only the first note
      setIsSplitView(false);
      setSelectedNote2('');
      setCurrentNote2(null);
      setIsEditing2(false);
    } else {
      // Enter split view
      setIsSplitView(true);
    }
  };

  const handleSwapNotes = () => {
    if (!isSplitView || !currentNote || !currentNote2) return;
    
    // Swap the notes
    const tempNote = currentNote;
    const tempNoteId = selectedNote;
    const tempEditing = isEditing;
    
    setCurrentNote(currentNote2);
    setSelectedNote(selectedNote2);
    setIsEditing(isEditing2);
    
    setCurrentNote2(tempNote);
    setSelectedNote2(tempNoteId);
    setIsEditing2(tempEditing);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Scroll functions
  const handleScroll = () => {
    if (notesContainerRef.current) {
      const { scrollTop } = notesContainerRef.current;
      setShowScrollTop(scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    if (notesContainerRef.current) {
      notesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToNote = (noteId: string) => {
    if (notesContainerRef.current) {
      const noteElement = notesContainerRef.current.querySelector(`[data-note-id="${noteId}"]`);
      if (noteElement) {
        noteElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  const handleAddAIToNote = (content: string) => {
    if (!currentNote) {
      // Create a new note with the AI response
      handleNewNote();
      // The new note will be created and set as currentNote
      // We'll add the content after the note is created
      setTimeout(() => {
        const newNote = notes.find(note => note.id === selectedNote);
        if (newNote) {
          setCurrentNote({
            ...newNote,
            content: content,
            title: 'AI Response'
          });
        }
      }, 200);
    } else {
      // Add to existing note
      setCurrentNote({
        ...currentNote,
        content: currentNote.content + '\n\n' + content
      });
      setIsEditing(true);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Do nothing if dropped outside a droppable area
    if (!destination) {
      return;
    }

    // Do nothing if dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const noteId = draggableId;

    try {
      // Handle reordering within the notes list
      if (destination.droppableId === 'notes-list') {
        // Reorder notes within the same list
        const allFilteredNotes = [...pinnedNotes, ...unpinnedNotes];
        const [removed] = allFilteredNotes.splice(source.index, 1);
        allFilteredNotes.splice(destination.index, 0, removed);

        // Update the notes order in state
        setNotes(prev => {
          const noteMap = new Map(prev.map(note => [note.id, note]));
          const reorderedNotes = allFilteredNotes
            .map(note => noteMap.get(note.id))
            .filter((note): note is Note => note !== undefined);
          
          // Add any notes that weren't in the filtered list back to the end
          const remainingNotes = prev.filter(note => !noteMap.has(note.id));
          return [...reorderedNotes, ...remainingNotes];
        });

        setToast({ message: 'Note order updated', type: 'success' });
        return;
      }

      // Handle moving notes to folders
      if (destination.droppableId === 'all-notes') {
        // Move note to "All Notes" (personal folder)
        const { data, error } = await supabase
          .from('notes')
          .update({ folder: 'personal' })
          .eq('id', noteId)
          .eq('user_id', user?.id)
          .select();

        if (error) {
          console.error('Error moving note to All Notes:', error);
          setToast({ message: 'Failed to move note', type: 'error' });
          return;
        }

        if (data) {
          setNotes(prev =>
            prev.map(note =>
              note.id === noteId ? { ...note, folder: 'personal' } : note
            )
          );
          setToast({ message: 'Note moved to All Notes', type: 'success' });
        }
      } else if (destination.droppableId.startsWith('folder-')) {
        // Move note to specific folder
        const folderId = destination.droppableId.replace('folder-', '');
        
        const { data, error } = await supabase
          .from('notes')
          .update({ folder: folderId })
          .eq('id', noteId)
          .eq('user_id', user?.id)
          .select();

        if (error) {
          console.error('Error moving note to folder:', error);
          setToast({ message: 'Failed to move note', type: 'error' });
          return;
        }

        if (data) {
          const folderName = folders.find(f => f.id === folderId)?.name || 'Unknown Folder';
          setNotes(prev =>
            prev.map(note =>
              note.id === noteId ? { ...note, folder: folderId } : note
            )
          );
          setToast({ message: `Note moved to ${folderName}`, type: 'success' });
        }
      }
    } catch (error) {
      console.error('Error during drag and drop operation:', error);
    }
  };

  // Filter notes based on selected folder and tags
  const filteredNotes = notes.filter((note: Note) => {
    const folderMatch = selectedFolder === 'all' || note.folder === selectedFolder;
    const tagMatch = selectedTags.length === 0 || 
      selectedTags.some(tag => note.tags.includes(tag));
    const searchMatch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return folderMatch && tagMatch && searchMatch;
  });

  const pinnedNotes = filteredNotes.filter((note: Note) => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter((note: Note) => !note.is_pinned);

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
    <ClientOnly fallback={<div>Loading...</div>}>
      <DragDropWrapper onDragEnd={onDragEnd}>
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
            
            <Droppable droppableId="all-notes">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`sidebar-item ${snapshot.isDraggingOver ? 'bg-blue-800 border-blue-500' : ''}`}
                  onClick={() => setSelectedFolder('all')}
                >
                  <div className="sidebar-item-left">
                    <i className="ri-file-text-line minimalist-icon"></i>
                    <span>Todas as Notas</span>
                  </div>
                  <div className="badge">{notes.length}</div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            
            {foldersWithCounts.map((folder: Folder) => (
              <Droppable key={folder.id} droppableId={`folder-${folder.id}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`sidebar-item ${selectedFolder === folder.id ? 'selected' : ''} ${snapshot.isDraggingOver ? 'bg-blue-800 border-blue-500' : ''}`}
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
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
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
                className={`sidebar-item ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => handleTagSelect(tag.id)}
              >
                <div className="sidebar-item-left">
                  <i 
                    className="ri-price-tag-3-fill minimalist-icon" 
                    style={{ color: tag.color || '#3b82f6' }}
                  ></i>
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
              <div className="app-title">Scribe</div>
              <div className="top-bar-actions">
                <div className="user-info">
                  <span className="user-email">{user?.email}</span>
                </div>
                <button className="calendar-btn" onClick={() => setShowCalendarModal(true)} aria-label="Open calendar">
                  <i className="ri-calendar-line"></i>
                </button>
                <button 
                  className={`kanban-btn ${showKanban ? 'active' : ''}`} 
                  onClick={() => setShowKanban(!showKanban)} 
                  aria-label="Toggle Kanban board"
                >
                  <i className="ri-medal-line"></i>
                </button>
                <button className="theme-toggle" onClick={handleToggleTheme} aria-label="Toggle theme">
                  <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
                </button>
                
                <button className="signout-btn" onClick={handleSignOut} aria-label="Sign out">
                  <i className="ri-logout-box-line"></i>
                </button>
              </div>
            </div>

            {showKanban ? (
              <KanbanBoard 
                notes={notes}
                tags={tags}
                onNoteSelect={(noteId) => {
                  setShowKanban(false);
                  handleNoteSelect(noteId);
                }}
              />
            ) : (
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
                    <div className="drag-hint">
                      <i className="ri-drag-move-line"></i>
                      <span>Drag to reorder notes</span>
                    </div>
                  </div>

                  <Droppable droppableId="notes-list">
                    {(provided) => (
                      <div 
                        className="notes-container"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        onScroll={handleScroll}
                      >
                        {pinnedNotes.length > 0 && (
                          <div className="notes-section">
                            <div className="notes-section-title">Notas Fixadas</div>
                            {pinnedNotes.map((note: Note, index: number) => (
                              <Draggable key={note.id} draggableId={note.id} index={index}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    data-note-id={note.id}
                                    className={`note-card relative group ${
                                      selectedNote === note.id ? 'selected' : ''
                                    } ${
                                      isSplitView && selectedNote2 === note.id ? 'selected-secondary' : ''
                                    } ${snapshot.isDragging ? 'shadow-lg transform rotate-2 scale-105 z-10' : ''}`}
                                    onClick={() => handleNoteSelect(note.id)}
                                  >
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity z-10 bg-gray-100 dark:bg-gray-700 rounded"
                                    >
                                      <i className="ri-drag-move-line text-sm"></i>
                                    </div>
                                    <div className="note-header">
                                      <div className="note-title">{note.title || 'Sem título'}</div>
                                      <div className="note-date">{formatDate(note.updated_at)}</div>
                                    </div>
                                    <div 
                                      className="note-preview"
                                      dangerouslySetInnerHTML={{ __html: note.content }}
                                    />
                                    {note.tags.length > 0 && (
                                      <div className="note-tags">
                                        {note.tags.map((tagName: string) => {
                                          const tag = tags.find(t => t.name === tagName);
                                          return (
                                            <span 
                                              key={tagName} 
                                              className="tag-pill bookmark-tag"
                                              style={{ 
                                                backgroundColor: tag?.color || '#3b82f6',
                                                borderColor: tag?.color || '#3b82f6'
                                              }}
                                            >
                                              <i className="ri-price-tag-3-fill"></i>
                                              {tagName}
                                            </span>
                                          );
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
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}

                        <div className="notes-section">
                          <div className="notes-section-title">Todas as Notas</div>
                          {unpinnedNotes.map((note: Note, index: number) => (
                            <Draggable key={note.id} draggableId={note.id} index={pinnedNotes.length + index}>
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  data-note-id={note.id}
                                  className={`note-card relative group ${
                                    selectedNote === note.id ? 'selected' : ''
                                  } ${
                                    isSplitView && selectedNote2 === note.id ? 'selected-secondary' : ''
                                  } ${snapshot.isDragging ? 'shadow-lg transform rotate-2 scale-105 z-10' : ''}`}
                                  onClick={() => handleNoteSelect(note.id)}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity z-10 bg-gray-100 dark:bg-gray-700 rounded"
                                  >
                                    <i className="ri-drag-move-line text-sm"></i>
                                  </div>
                                  <div className="note-header">
                                    <div className="note-title">{note.title || 'Sem título'}</div>
                                    <div className="note-date">{formatDate(note.updated_at)}</div>
                                  </div>
                                  <div 
                                    className="note-preview"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                  />
                                  {note.tags.length > 0 && (
                                    <div className="note-tags">
                                      {note.tags.map((tagName: string) => {
                                        const tag = tags.find(t => t.name === tagName);
                                        return (
                                          <span 
                                            key={tagName} 
                                            className="tag-pill bookmark-tag"
                                            style={{ 
                                              backgroundColor: tag?.color || '#3b82f6',
                                              borderColor: tag?.color || '#3b82f6'
                                            }}
                                          >
                                            <i className="ri-price-tag-3-fill"></i>
                                            {tagName}
                                          </span>
                                        );
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
                              )}
                            </Draggable>
                          ))}
                        </div>
                        
                        {/* Scroll to Top Button */}
                        {showScrollTop && (
                          <button
                            className="scroll-to-top-btn"
                            onClick={scrollToTop}
                            aria-label="Scroll to top"
                          >
                            <i className="ri-arrow-up-line"></i>
                          </button>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Right Pane */}
                <div className={`right-pane ${isSplitView ? 'split-view' : ''}`}>
                  {isSplitView ? (
                    // Split View Layout
                    <div className="split-view-container">
                      {/* Split View Toggle */}
                      <div className="split-view-header">
                        <div className="split-view-title">Visualização Dividida</div>
                        <div className="split-view-actions">
                          {currentNote && currentNote2 && (
                            <button className="editor-btn" onClick={handleSwapNotes}>
                              <i className="ri-swap-line minimalist-icon"></i>
                              Trocar
                            </button>
                          )}
                          <button className="editor-btn" onClick={handleToggleSplitView}>
                            <i className="ri-layout-grid-line minimalist-icon"></i>
                            Sair da Divisão
                          </button>
                        </div>
                      </div>
                    
                      <div className="split-view-content">
                        {/* First Note */}
                        <div className="split-note-pane">
                          <div className="split-note-header">
                            <div className="split-note-title">Nota 1</div>
                            <div className="split-note-actions">
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
                          {currentNote ? (
                            <div className="split-note-content">
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    className="editor-input"
                                    value={currentNote.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                    placeholder="Título da nota..."
                                  />
                                  <div className="ql-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                    <QuillEditor
                                      value={currentNote.content}
                                      onChange={(content) => setCurrentNote({ ...currentNote, content })}
                                      placeholder="Comece a escrever sua nota..."
                                      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                                    />
                                  </div>
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
                                          className={`tag-pill editor-tag-btn bookmark-tag${currentNote.tags.includes(tag.name) ? ' selected' : ''}`}
                                          style={{ 
                                            backgroundColor: currentNote.tags.includes(tag.name) ? (tag.color || '#3b82f6') : 'transparent',
                                            borderColor: tag.color || '#3b82f6',
                                            color: currentNote.tags.includes(tag.name) ? 'white' : (tag.color || '#3b82f6')
                                          }}
                                          onClick={() => {
                                            if (currentNote.tags.includes(tag.name)) {
                                              setCurrentNote({
                                                ...currentNote,
                                                tags: currentNote.tags.filter(t => t !== tag.name)
                                              });
                                            } else {
                                              setCurrentNote({
                                                ...currentNote,
                                                tags: [...currentNote.tags, tag.name]
                                              });
                                            }
                                          }}
                                        >
                                          <i className="ri-price-tag-3-fill"></i>
                                          {tag.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <h1 className="editor-input">{currentNote.title || 'Sem título'}</h1>
                                  <div
                                    className="editor-textarea"
                                    style={{ flex: 1, whiteSpace: 'pre-wrap', overflowY: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: currentNote.content || 'Sem conteúdo' }}
                                  />
                                  {currentNote.tags.length > 0 && (
                                    <div className="note-tags" style={{ marginTop: '16px' }}>
                                      {currentNote.tags.map((tagName: string) => {
                                        const tag = tags.find(t => t.name === tagName);
                                        return (
                                          <span 
                                            key={tagName} 
                                            className="tag-pill bookmark-tag"
                                            style={{ 
                                              backgroundColor: tag?.color || '#3b82f6',
                                              borderColor: tag?.color || '#3b82f6'
                                            }}
                                          >
                                            <i className="ri-price-tag-3-fill"></i>
                                            {tagName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="split-note-empty">
                              <div className="empty-icon">📝</div>
                              <div className="empty-title">Selecione uma nota</div>
                            </div>
                          )}
                        </div>

                        {/* Second Note */}
                        <div className="split-note-pane">
                          <div className="split-note-header">
                            <div className="split-note-title">Nota 2</div>
                            <div className="split-note-actions">
                              {isEditing2 ? (
                                <>
                                  <button className="editor-btn" onClick={handleCancelEdit2}>
                                    Cancelar
                                  </button>
                                  <button className="editor-btn primary" onClick={handleSaveNote2}>
                                    Salvar
                                  </button>
                                </>
                              ) : (
                                <button className="editor-btn primary" onClick={() => setIsEditing2(true)}>
                                  Editar
                                </button>
                              )}
                            </div>
                          </div>
                          {currentNote2 ? (
                            <div className="split-note-content">
                              {isEditing2 ? (
                                <>
                                  <input
                                    type="text"
                                    className="editor-input"
                                    value={currentNote2.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentNote2({ ...currentNote2, title: e.target.value })}
                                    placeholder="Título da nota..."
                                  />
                                  <div className="ql-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                    <QuillEditor
                                      value={currentNote2.content}
                                      onChange={(content) => setCurrentNote2({ ...currentNote2, content })}
                                      placeholder="Comece a escrever sua nota..."
                                      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                                    />
                                  </div>
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
                                          className={`tag-pill editor-tag-btn bookmark-tag${currentNote2.tags.includes(tag.name) ? ' selected' : ''}`}
                                          style={{ 
                                            backgroundColor: currentNote2.tags.includes(tag.name) ? (tag.color || '#3b82f6') : 'transparent',
                                            borderColor: tag.color || '#3b82f6',
                                            color: currentNote2.tags.includes(tag.name) ? 'white' : (tag.color || '#3b82f6')
                                          }}
                                          onClick={() => {
                                            if (currentNote2.tags.includes(tag.name)) {
                                              setCurrentNote2({
                                                ...currentNote2,
                                                tags: currentNote2.tags.filter(t => t !== tag.name)
                                              });
                                            } else {
                                              setCurrentNote2({
                                                ...currentNote2,
                                                tags: [...currentNote2.tags, tag.name]
                                              });
                                            }
                                          }}
                                        >
                                          <i className="ri-price-tag-3-fill"></i>
                                          {tag.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <h1 className="editor-input">{currentNote2.title || 'Sem título'}</h1>
                                  <div
                                    className="editor-textarea"
                                    style={{ flex: 1, whiteSpace: 'pre-wrap', overflowY: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: currentNote2.content || 'Sem conteúdo' }}
                                  />
                                  {currentNote2.tags.length > 0 && (
                                    <div className="note-tags" style={{ marginTop: '16px' }}>
                                      {currentNote2.tags.map((tagName: string) => {
                                        const tag = tags.find(t => t.name === tagName);
                                        return (
                                          <span 
                                            key={tagName} 
                                            className="tag-pill bookmark-tag"
                                            style={{ 
                                              backgroundColor: tag?.color || '#3b82f6',
                                              borderColor: tag?.color || '#3b82f6'
                                            }}
                                          >
                                            <i className="ri-price-tag-3-fill"></i>
                                            {tagName}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="split-note-empty">
                              <div className="empty-icon">📝</div>
                              <div className="empty-title">Selecione uma nota</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Single Note Layout
                    currentNote ? (
                      <div className="note-editor">
                        <div className="editor-header">
                          <div className="editor-title">Editor de Notas</div>
                          <div className="editor-actions">
                            <button className="editor-btn" onClick={handleToggleSplitView}>
                              <i className="ri-layout-column-line minimalist-icon"></i>
                              Divisão
                            </button>
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
                              <QuillEditor
                                value={currentNote.content}
                                onChange={(content) => setCurrentNote({ ...currentNote, content })}
                                placeholder="Comece a escrever sua nota..."
                                style={{ height: '40vh', display: 'flex', flexDirection: 'column' }}
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
                                      className={`tag-pill editor-tag-btn bookmark-tag${currentNote.tags.includes(tag.name) ? ' selected' : ''}`}
                                      style={{ 
                                        backgroundColor: currentNote.tags.includes(tag.name) ? (tag.color || '#3b82f6') : 'transparent',
                                        borderColor: tag.color || '#3b82f6',
                                        color: currentNote.tags.includes(tag.name) ? 'white' : (tag.color || '#3b82f6')
                                      }}
                                      onClick={() => {
                                        if (currentNote.tags.includes(tag.name)) {
                                          setCurrentNote({
                                            ...currentNote,
                                            tags: currentNote.tags.filter(t => t !== tag.name)
                                          });
                                        } else {
                                          setCurrentNote({
                                            ...currentNote,
                                            tags: [...currentNote.tags, tag.name]
                                          });
                                        }
                                      }}
                                    >
                                      <i className="ri-price-tag-3-fill"></i>
                                      {tag.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <h1 className="editor-input">{currentNote.title || 'Sem título'}</h1>
                              <div
                                className="editor-textarea"
                                style={{ whiteSpace: 'pre-wrap', maxHeight: '40vh', overflowY: 'auto' }}
                                dangerouslySetInnerHTML={{ __html: currentNote.content || 'Sem conteúdo' }}
                              />
                              {currentNote.tags.length > 0 && (
                                <div className="note-tags" style={{ marginTop: '16px' }}>
                                  {currentNote.tags.map((tagName: string) => {
                                    const tag = tags.find(t => t.name === tagName);
                                    return (
                                      <span 
                                        key={tagName} 
                                        className="tag-pill bookmark-tag"
                                        style={{ 
                                          backgroundColor: tag?.color || '#3b82f6',
                                          borderColor: tag?.color || '#3b82f6'
                                        }}
                                      >
                                        <i className="ri-price-tag-3-fill"></i>
                                        {tagName}
                                      </span>
                                    );
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
                    )
                  )}
                </div>
              </div>
            )}
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
                />
                {modalError && <div className="modal-error">{modalError}</div>}
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
                />
                <div className="modal-color-picker">
                  <label htmlFor="newTagColor">Cor:</label>
                  <input
                    type="color"
                    id="newTagColor"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="modal-color-input"
                  />
                  <div className="color-palette">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${newTagColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                {modalError && <div className="modal-error">{modalError}</div>}
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
          </div>
        )}

        {/* AI Assistant */}
        <AIAssistant onAddToNote={handleAddAIToNote} />

        {/* Calendar Modal */}
        <CalendarModal 
          isOpen={showCalendarModal}
          onClose={useCallback(() => setShowCalendarModal(false), [])}
          isDark={isDark}
        />
      </DragDropWrapper>
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Drag & Drop Hint */}
      <DragDropHint />
    </ClientOnly>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <NotesApp />
    </ProtectedRoute>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import NotesList from '../components/Notes/NotesList';
import NoteDetail from '../components/Notes/NoteDetail';
import { supabase } from '../lib/supabase';
import { NotesService, FoldersService, TagsService } from '../lib/supabaseServices';

export default function Home() {
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadUserData(session.user.id);
      }
    });
  }, []);

  const loadUserData = async (userId: string) => {
    const [userFolders, userTags] = await Promise.all([
      FoldersService.getFolders(userId),
      TagsService.getTags(userId)
    ]);
    setFolders([{ id: 'all', name: 'All Notes', count: 0 }, ...userFolders]);
    setTags(userTags);
    NotesService.subscribeToNotes(userId, (notes) => {
      setNotes(notes);
    });
  };

  const handleAddFolder = async () => {
    if (!userId || !newFolderName.trim()) return;
    await FoldersService.addFolder(newFolderName.trim(), userId);
    setNewFolderName('');
    loadUserData(userId);
  };

  const handleAddTag = async () => {
    if (!userId || !newTagName.trim()) return;
    await TagsService.addTag(newTagName.trim(), userId);
    setNewTagName('');
    loadUserData(userId);
  };

  const handleNewNote = async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    const newNote = {
      title: 'Untitled',
      content: '',
      folder: selectedFolder === 'all' ? 'personal' : selectedFolder,
      tags: [],
      is_pinned: false,
      is_private: false,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
    const noteId = await NotesService.addNote(newNote);
    setSelectedNoteId(noteId);
  };

  const filteredNotes = notes.filter(note => {
    if (selectedFolder !== 'all' && note.folder !== selectedFolder) return false;
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const regularNotes = filteredNotes.filter(note => !note.is_pinned);
  const selectedNote = notes.find(note => note.id === selectedNoteId);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="h-14 flex items-center px-6 border-b border-gray-800 bg-gray-900 text-white justify-between">
        <span className="font-bold text-lg">NotesApp</span>
        <button className="text-xl" title="Toggle theme">
          <i className="ri-moon-line"></i>
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={folders}
          tags={tags}
          selectedFolder={selectedFolder}
          selectedTag={selectedTag}
          onFolderSelect={setSelectedFolder}
          onTagSelect={setSelectedTag}
          onNewNote={handleNewNote}
          onAddFolder={handleAddFolder}
          onAddTag={handleAddTag}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          newTagName={newTagName}
          setNewTagName={setNewTagName}
        />
        <NotesList
          notes={regularNotes}
          pinnedNotes={pinnedNotes}
          searchTerm={searchTerm}
          selectedNoteId={selectedNoteId}
          onNoteSelect={setSelectedNoteId}
          onSearch={setSearchTerm}
        />
        <div className="flex-1 flex flex-col">
          <NoteDetail note={selectedNote} />
        </div>
      </div>
    </div>
  );
}

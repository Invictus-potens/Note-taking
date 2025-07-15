
'use client';

import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import NotesList from '../components/Notes/NotesList';
import NoteDetail from '../components/Notes/NoteDetail';

// Mock data for demonstration
const mockFolders = [
  { id: 'all', name: 'All Notes', count: 2 },
  { id: 'personal', name: 'Personal', count: 0 },
  { id: 'work', name: 'Work', count: 0 },
  { id: 'projects', name: 'Projects', count: 0 },
];
const mockTags = [
  { id: 'important', name: 'important', count: 0 },
  { id: 'ideas', name: 'ideas', count: 0 },
  { id: 'todo', name: 'To-Do', count: 0 },
];
const mockNotes = [
  {
    id: '1',
    title: 'Welcome to NotesApp',
    content: 'This is your first note! You can edit, organize, and manage all your notes here.',
    tags: ['important'],
    date: 'Today',
    pinned: true,
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Remember to discuss project timeline and budget allocation.',
    tags: ['todo'],
    date: 'Today',
    pinned: false,
  },
];

export default function Home() {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');

  // Filter notes by folder/tag/search
  const filteredNotes = mockNotes.filter(note => {
    if (selectedFolder !== 'all') return false; // Demo: only show all notes
    if (selectedTag && !note.tags.includes(selectedTag)) return false;
    if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const regularNotes = filteredNotes.filter(note => !note.pinned);
  const selectedNote = mockNotes.find(note => note.id === selectedNoteId);

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
          folders={mockFolders}
          tags={mockTags}
          selectedFolder={selectedFolder}
          selectedTag={selectedTag}
          onFolderSelect={setSelectedFolder}
          onTagSelect={setSelectedTag}
          onNewNote={() => {}}
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

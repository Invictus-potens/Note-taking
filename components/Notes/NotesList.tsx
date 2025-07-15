import React from 'react';
import NoteCard from './NoteCard';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
  pinned?: boolean;
}

interface NotesListProps {
  notes: Note[];
  pinnedNotes: Note[];
  searchTerm: string;
  selectedNoteId: string;
  onNoteSelect: (id: string) => void;
  onSearch: (term: string) => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  pinnedNotes,
  searchTerm,
  selectedNoteId,
  onNoteSelect,
  onSearch,
}: NotesListProps) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="px-4 pb-2">
        {pinnedNotes.length > 0 && (
          <>
            <div className="text-xs text-gray-400 font-semibold mb-2">PINNED NOTES</div>
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                title={note.title}
                content={note.content}
                tags={note.tags}
                date={note.date}
                pinned={note.pinned}
                onClick={() => onNoteSelect(note.id)}
                selected={selectedNoteId === note.id}
              />
            ))}
          </>
        )}
        <div className="text-xs text-gray-400 font-semibold mt-4 mb-2">ALL NOTES</div>
        {notes.map(note => (
          <NoteCard
            key={note.id}
            title={note.title}
            content={note.content}
            tags={note.tags}
            date={note.date}
            pinned={note.pinned}
            onClick={() => onNoteSelect(note.id)}
            selected={selectedNoteId === note.id}
          />
        ))}
      </div>
    </div>
  );
};

export default NotesList;
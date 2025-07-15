import React from 'react';

interface NoteDetailProps {
  note?: {
    title: string;
    content: string;
    tags: string[];
    date: string;
    pinned?: boolean;
    private?: boolean;
  };
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note }) => {
  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
        <i className="ri-file-text-line text-6xl mb-4"></i>
        <h3 className="text-2xl font-semibold text-white mb-2">Select a note to view</h3>
        <p className="text-gray-400">Choose a note from the sidebar or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center mb-4 space-x-2">
        {note.pinned && <i className="ri-pushpin-fill text-blue-500"></i>}
        {note.private && <i className="ri-lock-fill text-yellow-500"></i>}
        <h1 className="text-3xl font-bold text-white flex-1">{note.title || 'Untitled'}</h1>
        <span className="text-xs text-gray-500 whitespace-nowrap">{note.date}</span>
      </div>
      <div className="prose prose-invert max-w-none mb-4">
        <p className="text-gray-300 whitespace-pre-wrap">{note.content || 'No content'}</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {note.tags.map(tag => (
          <span key={tag} className="bg-gray-700 text-xs text-gray-300 px-2 py-0.5 rounded-full">#{tag}</span>
        ))}
      </div>
    </div>
  );
};

export default NoteDetail; 
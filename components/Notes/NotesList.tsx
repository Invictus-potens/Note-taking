'use client';

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

interface NotesListProps {
  notes: Note[];
  selectedNote?: string;
  onNoteSelect: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  searchTerm: string;
}

export default function NotesList({ 
  notes, 
  selectedNote, 
  onNoteSelect, 
  onTogglePin, 
  onDeleteNote,
  searchTerm 
}: NotesListProps) {
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const regularNotes = filteredNotes.filter(note => !note.isPinned);

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

  const renderNote = (note: Note) => (
    <div
      key={note.id}
      onClick={() => onNoteSelect(note.id)}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        selectedNote === note.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {note.isPinned && (
            <i className="ri-pushpin-fill text-blue-500 text-sm"></i>
          )}
          {note.isPrivate && (
            <i className="ri-lock-fill text-yellow-500 text-sm"></i>
          )}
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {note.title || 'Untitled'}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500 cursor-pointer"
          >
            <i className={`${note.isPinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'} text-sm`}></i>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"
          >
            <i className="ri-delete-bin-line text-sm"></i>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
        {note.content || 'No content'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {pinnedNotes.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Pinned Notes
            </h4>
          </div>
          <div className="group">
            {pinnedNotes.map(renderNote)}
          </div>
        </div>
      )}

      {regularNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Todas as Notas
              </h4>
            </div>
          )}
          <div className="group">
            {regularNotes.map(renderNote)}
          </div>
        </div>
      )}

      {filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
          <i className="ri-file-text-line text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {searchTerm 
              ? 'Try adjusting your search terms or create a new note.'
              : 'Create your first note to get started with organizing your thoughts.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
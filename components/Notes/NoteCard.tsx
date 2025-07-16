import React from 'react';

interface NoteCardProps {
  title: string;
  content: string;
  tags: string[];
  date: string;
  pinned?: boolean;
  onClick: () => void;
  selected?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  title,
  content,
  tags,
  date,
  pinned = false,
  onClick,
  selected = false,
}) => {
  return (
    <div
      className={`rounded-lg p-4 mb-2 cursor-pointer shadow-sm border transition-all ${selected ? 'bg-blue-100 border-blue-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
      onClick={onClick}
    >
      <div className="flex items-center mb-1">
        {pinned && <i className="ri-pushpin-fill text-blue-500 mr-2"></i>}
        <span className="font-semibold text-white text-base flex-1 truncate">{title}</span>
      </div>
      <div className="text-gray-400 text-sm mb-2 truncate">
        {content}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <span key={tag} className="bg-gray-700 text-xs text-gray-300 px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{date}</span>
      </div>
    </div>
  );
};

export default NoteCard; 
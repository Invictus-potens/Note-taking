import React from 'react';
import Button from '../ui/Button';

interface Folder {
  id: string;
  name: string;
  count: number;
}

interface Tag {
  id: string;
  name: string;
  count: number;
}

interface SidebarProps {
  folders: Folder[];
  tags: Tag[];
  selectedFolder: string;
  selectedTag: string;
  onFolderSelect: (id: string) => void;
  onTagSelect: (id: string) => void;
  onNewNote: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  tags,
  selectedFolder,
  selectedTag,
  onFolderSelect,
  onTagSelect,
  onNewNote,
}) => {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
      <div className="p-4">
        <Button onClick={onNewNote} variant="primary" className="w-full mb-4">
          + New Note
        </Button>
      </div>
      <div className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">FOLDERS</span>
          <button className="text-gray-400 hover:text-white text-lg">+</button>
        </div>
        <ul className="mb-6 space-y-1">
          {folders.map(folder => (
            <li key={folder.id}>
              <button
                className={`flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-sm ${selectedFolder === folder.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
                onClick={() => onFolderSelect(folder.id)}
              >
                <span className="flex-1 text-left">{folder.name}</span>
                <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{folder.count}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">TAGS</span>
          <button className="text-gray-400 hover:text-white text-lg">+</button>
        </div>
        <ul className="space-y-1">
          {tags.map(tag => (
            <li key={tag.id}>
              <button
                className={`flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-sm ${selectedTag === tag.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
                onClick={() => onTagSelect(tag.id)}
              >
                <span className="flex-1 text-left"># {tag.name}</span>
                <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full">{tag.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar; 
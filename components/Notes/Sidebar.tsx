import React, { useState } from 'react';
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
  onAddFolder: () => void;
  onAddTag: () => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  newTagName: string;
  setNewTagName: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  tags,
  selectedFolder,
  selectedTag,
  onFolderSelect,
  onTagSelect,
  onNewNote,
  onAddFolder,
  onAddTag,
  newFolderName,
  setNewFolderName,
  newTagName,
  setNewTagName,
}) => {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
      <div className="p-4">
        <Button onClick={onNewNote} className="w-full mb-4">
          + New Note
        </Button>
      </div>
      <div className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400">FOLDERS</span>
          <button className="text-gray-400 hover:text-white text-lg" onClick={() => setShowNewFolder(v => !v)}>+</button>
        </div>
        {showNewFolder && (
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm"
            />
            <button
              className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
              onClick={onAddFolder}
            >
              Add
            </button>
          </div>
        )}
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
          <button className="text-gray-400 hover:text-white text-lg" onClick={() => setShowNewTag(v => !v)}>+</button>
        </div>
        {showNewTag && (
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm"
            />
            <button
              className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
              onClick={onAddTag}
            >
              Add
            </button>
          </div>
        )}
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
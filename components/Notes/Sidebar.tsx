
'use client';

import { useState } from 'react';
import Button from '../ui/Button';

interface SidebarProps {
  folders: Array<{id: string; name: string; count: number}>;
  tags: Array<{id: string; name: string; count: number}>;
  selectedFolder?: string;
  selectedTag?: string;
  onFolderSelect: (folderId: string) => void;
  onTagSelect: (tagId: string) => void;
  onNewNote: () => void;
}

export default function Sidebar({ 
  folders, 
  tags, 
  selectedFolder, 
  selectedTag, 
  onFolderSelect, 
  onTagSelect, 
  onNewNote 
}: SidebarProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Add folder creation logic here
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      // Add tag creation logic here
      setNewTagName('');
      setShowNewTag(false);
    }
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button onClick={onNewNote} variant="primary" className="w-full">
          <i className="ri-add-line mr-2"></i>
          New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Folders
              </h3>
              <button
                onClick={() => setShowNewFolder(true)}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-add-line text-sm"></i>
              </button>
            </div>

            {showNewFolder && (
              <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full p-1 text-sm border-none outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolder(false);
                  }}
                  autoFocus
                />
                <div className="flex justify-end space-x-1 mt-2">
                  <button
                    onClick={() => setShowNewFolder(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => onFolderSelect('all')}
                className={`w-full flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedFolder === 'all' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <i className="ri-file-list-3-line mr-2"></i>
                  <span className="text-sm">All Notes</span>
                </div>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {folders.reduce((sum, f) => sum + f.count, 0)}
                </span>
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderSelect(folder.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <i className="ri-folder-3-line mr-2"></i>
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Tags
              </h3>
              <button
                onClick={() => setShowNewTag(true)}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-add-line text-sm"></i>
              </button>
            </div>

            {showNewTag && (
              <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="w-full p-1 text-sm border-none outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    if (e.key === 'Escape') setShowNewTag(false);
                  }}
                  autoFocus
                />
                <div className="flex justify-end space-x-1 mt-2">
                  <button
                    onClick={() => setShowNewTag(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTag}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onTagSelect(tag.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTag === tag.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <i className="ri-price-tag-3-line mr-2"></i>
                    <span className="text-sm">#{tag.name}</span>
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

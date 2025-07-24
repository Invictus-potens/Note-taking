
'use client';

import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import CollaborationModal from '../Kanban/CollaborationModal';
// import { useCollaboration } from '../../lib/useCollaboration';

interface HeaderProps {
  onToggleTheme?: () => void;
  isDark?: boolean;
  currentBoardId?: string;
  showKanbanControls?: boolean;
}

export default function Header({ 
  onToggleTheme, 
  isDark, 
  currentBoardId,
  showKanbanControls = false 
}: HeaderProps) {
  const router = useRouter();
  // const [showCollaboration, setShowCollaboration] = useState(false);
  
  // Temporarily disable collaboration hook to test
  // const permissions = { canInviteUsers: false };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-pacifico">
              Scribe
            </h1>
            
            {/* Collaboration Button - Commented out for single user */}
            {/* {showKanbanControls && currentBoardId && permissions?.canInviteUsers && (
              <div className="flex items-center space-x-2 ml-6">
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <button
                  onClick={() => setShowCollaboration(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Manage collaboration"
                >
                  <Users className="w-4 h-4" />
                  <span>Collaborate</span>
                </button>
              </div>
            )} */}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Collaboration Modal - Commented out for single user */}
      {/* {showCollaboration && currentBoardId && (
        <CollaborationModal
          boardId={currentBoardId}
          isOpen={showCollaboration}
          onClose={() => setShowCollaboration(false)}
          isDark={isDark}
        />
      )} */}
    </>
  );
}


'use client';

import { useState } from 'react';
import { Sun, Moon, Users, Kanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CollaborationModal from '../Kanban/CollaborationModal';
import BoardSelector from '../Kanban/BoardSelector';
import { useCollaboration } from '../../lib/useCollaboration';

interface HeaderProps {
  onToggleTheme?: () => void;
  isDark?: boolean;
  currentBoardId?: string;
  onBoardSelect?: (boardId: string) => void;
  showKanbanControls?: boolean;
}

export default function Header({ 
  onToggleTheme, 
  isDark, 
  currentBoardId, 
  onBoardSelect,
  showKanbanControls = false 
}: HeaderProps) {
  const router = useRouter();
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  
  const { permissions } = useCollaboration(currentBoardId);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-pacifico">
              Scribe
            </h1>
            
            {/* Kanban Controls - Only show when in Kanban view */}
            {showKanbanControls && (
              <div className="flex items-center space-x-2 ml-6">
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                {/* Board Selector Button */}
                <button
                  onClick={() => setShowBoardSelector(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Select board"
                >
                  <Kanban className="w-4 h-4" />
                  <span>Boards</span>
                </button>
                
                {/* Collaboration Button - Only show if user has permission */}
                {permissions?.canInviteUsers && (
                  <button
                    onClick={() => setShowCollaboration(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Manage collaboration"
                  >
                    <Users className="w-4 h-4" />
                    <span>Collaborate</span>
                  </button>
                )}
              </div>
            )}
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

      {/* Collaboration Modal */}
      {showCollaboration && currentBoardId && (
        <CollaborationModal
          boardId={currentBoardId}
          isOpen={showCollaboration}
          onClose={() => setShowCollaboration(false)}
          isDark={isDark}
        />
      )}

      {/* Board Selector Modal */}
      {showBoardSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md mx-4`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Select Board
                </h2>
                <button
                  onClick={() => setShowBoardSelector(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  aria-label="Close board selector"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <BoardSelector
                selectedBoardId={currentBoardId}
                onBoardSelect={(boardId) => {
                  onBoardSelect?.(boardId);
                  setShowBoardSelector(false);
                }}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

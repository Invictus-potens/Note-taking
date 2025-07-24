'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';
import BoardSelector from './BoardSelector';

interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface KanbanMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardId?: string;
  onBoardSelect: (boardId: string) => void;
  isDark?: boolean;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const KanbanMenu: React.FC<KanbanMenuProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  onBoardSelect,
  isDark = true,
  triggerRef
}) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user's boards
  const fetchBoards = async () => {
    if (!user) return;

    try {
      // Fetch boards where user is owner or member
      const { data, error } = await supabase
        .from('kanban_boards')
        .select(`
          *,
          kanban_board_members!inner(user_id)
        `)
        .or(`owner_id.eq.${user.id},kanban_board_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching boards:', error);
        return;
      }

      const boardsData = data || [];
      setBoards(boardsData);
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchBoards();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="kanban-menu"
      >
        <div className="kanban-menu-header">
          <h3 className="kanban-menu-title">
            Kanban Boards
          </h3>
          <button
            onClick={onClose}
            className="kanban-menu-close"
            aria-label="Close menu"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="kanban-menu-content">
          {/* Current Board Info */}
          {currentBoardId && (
            <div className="kanban-current-board">
              <div className="kanban-current-board-label">
                Current Board:
              </div>
              <div className="kanban-current-board-name">
                {boards.find(b => b.id === currentBoardId)?.name || 'Loading...'}
              </div>
            </div>
          )}

          {/* Boards List */}
          <div className="kanban-boards-list">
            {boards.slice(0, 3).map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  onBoardSelect(board.id);
                  onClose();
                }}
                className={`kanban-board-item ${currentBoardId === board.id ? 'active' : ''}`}
              >
                <div className="kanban-board-name">{board.name}</div>
                {board.description && (
                  <div className="kanban-board-description">
                    {board.description}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="kanban-menu-actions">
            <button
              onClick={() => setShowBoardSelector(true)}
              className="kanban-manage-btn"
            >
              <i className="ri-add-line"></i>
              <span>Manage Boards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Board Selector Modal */}
      {showBoardSelector && (
        <div className="kanban-menu-container">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md mx-4`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Manage Boards
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
                  onBoardSelect(boardId);
                  setShowBoardSelector(false);
                  onClose();
                }}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default KanbanMenu; 
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
  onBackToNotes: () => void;
  isDark?: boolean;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const KanbanMenu: React.FC<KanbanMenuProps> = ({
  isOpen,
  onClose,
  currentBoardId,
  onBoardSelect,
  onBackToNotes,
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
      // Fetch boards where user is owner (single user mode)
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('owner_id', user.id)
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
              onClick={() => {
                onBackToNotes();
                onClose();
              }}
              className="kanban-back-btn"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Voltar para Notas</span>
            </button>
            
            <button
              onClick={() => setShowBoardSelector(true)}
              className="kanban-manage-btn"
            >
              <i className="ri-add-line"></i>
              <span>Novo Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Board Selector Modal */}
      {showBoardSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`kanban-modal ${isDark ? 'kanban-modal-dark' : 'kanban-modal-light'}`}>
            <div className="kanban-modal-content">
              <div className="kanban-modal-header">
                <h2 className="kanban-modal-title">
                  Gerenciar Boards
                </h2>
                <button
                  onClick={() => setShowBoardSelector(false)}
                  className="kanban-modal-close"
                  aria-label="Close board selector"
                >
                  <i className="ri-close-line"></i>
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
      )}
    </>
  );
};

export default KanbanMenu; 
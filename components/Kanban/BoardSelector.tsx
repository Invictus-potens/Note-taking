'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';
import { useCollaboration } from '../../lib/useCollaboration';
import { KanbanBoard } from '../../types/collaboration';

interface BoardSelectorProps {
  selectedBoardId?: string;
  onBoardSelect: (boardId: string) => void;
  isDark?: boolean;
}

const BoardSelector: React.FC<BoardSelectorProps> = ({
  selectedBoardId,
  onBoardSelect,
  isDark = true
}) => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });

  const { createBoard } = useCollaboration();

  // Fetch user's boards
  const fetchBoards = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch boards where user is owner or member
      const { data, error } = await supabase
        .from('kanban_boards')
        .select(`
          *,
          kanban_board_members!inner(user_id)
        `)
        .or(`owner_id.eq.${user.id},kanban_board_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBoards(data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new board
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      const newBoard = await createBoard(createForm);
      setBoards(prev => [newBoard, ...prev]);
      onBoardSelect(newBoard.id);
      setCreateForm({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [user]);

  if (loading) {
    return (
      <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Select Board
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <i className="ri-add-line mr-1"></i>
          New Board
        </button>
      </div>

      <div className="space-y-2">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onBoardSelect(board.id)}
            className={`w-full p-3 text-left rounded-lg border transition-colors ${
              selectedBoardId === board.id
                ? `${isDark ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-50 border-blue-300 text-blue-900'}`
                : `${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-900'}`
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{board.name}</h4>
                {board.description && (
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {board.description}
                  </p>
                )}
              </div>
              {board.owner_id === user?.id && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isDark ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  Owner
                </span>
              )}
            </div>
          </button>
        ))}

        {boards.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="ri-kanban-board-line text-4xl mb-2"></i>
            <p>No boards yet</p>
            <p className="text-sm">Create your first board to get started</p>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create New Board
            </h3>
            
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Board Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter board name"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (Optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter board description"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Board
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardSelector; 
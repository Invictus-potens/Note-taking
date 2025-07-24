'use client';

import React, { useState } from 'react';
import { useCollaboration } from '../../lib/useCollaboration';
import { InviteUserData } from '../../types/collaboration';

interface CollaborationModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  boardId,
  isOpen,
  onClose,
  isDark = true
}) => {
  const {
    board,
    members,
    invitations,
    currentUserRole,
    permissions,
    inviteUser,
    removeMember,
    updateMemberRole,
    loading,
    error
  } = useCollaboration(boardId);

  const [inviteForm, setInviteForm] = useState<InviteUserData>({
    email: '',
    role: 'editor',
    message: ''
  });
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;

    try {
      setInviting(true);
      await inviteUser(inviteForm);
      setInviteForm({ email: '', role: 'editor', message: '' });
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(memberId);
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(memberId, newRole);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Collaboration Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Close collaboration settings"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Board Info */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Board Information
              </h3>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Name:</strong> {board?.name}</p>
                <p><strong>Description:</strong> {board?.description || 'No description'}</p>
                <p><strong>Your Role:</strong> <span className="capitalize">{currentUserRole}</span></p>
              </div>
            </div>

            {/* Invite Users */}
            {permissions.canInviteUsers && (
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Invite Users
                </h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      aria-label="Select user role"
                    >
                      <option value="viewer">Viewer - Can only view the board</option>
                      <option value="editor">Editor - Can add and edit cards</option>
                      <option value="admin">Admin - Can manage board and members</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Message (Optional)
                    </label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Add a personal message to the invitation"
                      rows={3}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </button>
                </form>
              </div>
            )}

            {/* Current Members */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Current Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {member.user?.full_name || member.user?.email}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {member.user?.email}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {permissions.canManageMembers ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className={`px-3 py-1 border rounded text-sm ${
                            isDark 
                              ? 'bg-gray-500 border-gray-400 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          aria-label={`Update role for ${member.user?.full_name || member.user?.email}`}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          member.role === 'admin' ? 'bg-red-100 text-red-800' :
                          member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      )}
                      
                      {permissions.canManageMembers && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Remove member"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Pending Invitations ({invitations.length})
                </h3>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {invitation.email}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Invited by {invitation.invited_by_user?.full_name || invitation.invited_by_user?.email}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          invitation.role === 'admin' ? 'bg-red-100 text-red-800' :
                          invitation.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.role}
                        </span>
                        
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationModal; 
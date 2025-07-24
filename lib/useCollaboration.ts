import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './authContext';
import {
  KanbanBoard,
  KanbanBoardMember,
  KanbanBoardInvitation,
  CollaborationPermissions,
  InviteUserData,
  BoardCollaborationState
} from '../types/collaboration';

export const useCollaboration = (boardId?: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<BoardCollaborationState>({
    board: null,
    members: [],
    invitations: [],
    currentUserRole: null,
    permissions: {
      canView: false,
      canEdit: false,
      canAddCards: false,
      canEditCards: false,
      canDeleteCards: false,
      canAddColumns: false,
      canEditColumns: false,
      canDeleteColumns: false,
      canManageMembers: false,
      canInviteUsers: false,
      canDeleteBoard: false,
    },
    loading: true,
    error: null,
  });

  // Calculate permissions based on user role
  const calculatePermissions = useCallback((role: string | null): CollaborationPermissions => {
    const permissions: CollaborationPermissions = {
      canView: false,
      canEdit: false,
      canAddCards: false,
      canEditCards: false,
      canDeleteCards: false,
      canAddColumns: false,
      canEditColumns: false,
      canDeleteColumns: false,
      canManageMembers: false,
      canInviteUsers: false,
      canDeleteBoard: false,
    };

    if (!role) return permissions;

    switch (role) {
      case 'owner':
        permissions.canView = true;
        permissions.canEdit = true;
        permissions.canAddCards = true;
        permissions.canEditCards = true;
        permissions.canDeleteCards = true;
        permissions.canAddColumns = true;
        permissions.canEditColumns = true;
        permissions.canDeleteColumns = true;
        permissions.canManageMembers = true;
        permissions.canInviteUsers = true;
        permissions.canDeleteBoard = true;
        break;
      case 'admin':
        permissions.canView = true;
        permissions.canEdit = true;
        permissions.canAddCards = true;
        permissions.canEditCards = true;
        permissions.canDeleteCards = true;
        permissions.canAddColumns = true;
        permissions.canEditColumns = true;
        permissions.canDeleteColumns = true;
        permissions.canManageMembers = true;
        permissions.canInviteUsers = true;
        permissions.canDeleteBoard = false;
        break;
      case 'editor':
        permissions.canView = true;
        permissions.canEdit = true;
        permissions.canAddCards = true;
        permissions.canEditCards = true;
        permissions.canDeleteCards = true;
        permissions.canAddColumns = false;
        permissions.canEditColumns = false;
        permissions.canDeleteColumns = false;
        permissions.canManageMembers = false;
        permissions.canInviteUsers = false;
        permissions.canDeleteBoard = false;
        break;
      case 'viewer':
        permissions.canView = true;
        permissions.canEdit = false;
        permissions.canAddCards = false;
        permissions.canEditCards = false;
        permissions.canDeleteCards = false;
        permissions.canAddColumns = false;
        permissions.canEditColumns = false;
        permissions.canDeleteColumns = false;
        permissions.canManageMembers = false;
        permissions.canInviteUsers = false;
        permissions.canDeleteBoard = false;
        break;
    }

    return permissions;
  }, []);

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    if (!boardId || !user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch board
      const { data: board, error: boardError } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('kanban_board_members')
        .select(`
          *,
          user:users!kanban_board_members_user_id_fkey(id, email, full_name),
          invited_by_user:users!kanban_board_members_invited_by_fkey(id, email, full_name)
        `)
        .eq('board_id', boardId);

      if (membersError) throw membersError;

      // Fetch invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('kanban_board_invitations')
        .select(`
          *,
          invited_by_user:users!kanban_board_invitations_invited_by_fkey(id, email, full_name)
        `)
        .eq('board_id', boardId)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      // Find current user's role
      const currentMember = members?.find(m => m.user_id === user.id);
      const currentUserRole = currentMember?.role || (board.owner_id === user.id ? 'owner' : null);

      // Calculate permissions
      const permissions = calculatePermissions(currentUserRole);

      setState({
        board,
        members: members || [],
        invitations: invitations || [],
        currentUserRole,
        permissions,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching board data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch board data',
      }));
    }
  }, [boardId, user, calculatePermissions]);

  // Invite user to board
  const inviteUser = useCallback(async (inviteData: InviteUserData) => {
    if (!boardId || !user || !state.permissions.canInviteUsers) {
      throw new Error('You do not have permission to invite users');
    }

    try {
      // Generate invitation token
      const token = crypto.randomUUID();

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('kanban_board_invitations')
        .insert({
          board_id: boardId,
          email: inviteData.email,
          role: inviteData.role,
          invited_by: user.id,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email here
      console.log('Invitation created:', invitation);

      // Refresh board data
      await fetchBoard();

      return invitation;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }, [boardId, user, state.permissions.canInviteUsers, fetchBoard]);

  // Accept invitation
  const acceptInvitation = useCallback(async (token: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('kanban_board_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (invitationError) throw invitationError;

      if (!invitation) throw new Error('Invalid or expired invitation');

      // Check if invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('kanban_board_members')
        .insert({
          board_id: invitation.board_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('kanban_board_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }, [user]);

  // Remove member
  const removeMember = useCallback(async (memberId: string) => {
    if (!state.permissions.canManageMembers) {
      throw new Error('You do not have permission to remove members');
    }

    try {
      const { error } = await supabase
        .from('kanban_board_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchBoard();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }, [state.permissions.canManageMembers, fetchBoard]);

  // Update member role
  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    if (!state.permissions.canManageMembers) {
      throw new Error('You do not have permission to update member roles');
    }

    try {
      const { error } = await supabase
        .from('kanban_board_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      await fetchBoard();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }, [state.permissions.canManageMembers, fetchBoard]);

  // Create new board
  const createBoard = useCallback(async (boardData: { name: string; description?: string }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: board, error } = await supabase
        .from('kanban_boards')
        .insert({
          ...boardData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return board;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }, [user]);

  // Load board data on mount
  useEffect(() => {
    if (boardId) {
      fetchBoard();
    }
  }, [boardId, fetchBoard]);

  return {
    ...state,
    inviteUser,
    acceptInvitation,
    removeMember,
    updateMemberRole,
    createBoard,
    refreshBoard: fetchBoard,
  };
}; 
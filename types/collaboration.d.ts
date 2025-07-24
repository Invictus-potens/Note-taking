export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'declined';
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  invited_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface KanbanBoardInvitation {
  id: string;
  board_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  expires_at?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface CollaborationPermissions {
  canView: boolean;
  canEdit: boolean;
  canAddCards: boolean;
  canEditCards: boolean;
  canDeleteCards: boolean;
  canAddColumns: boolean;
  canEditColumns: boolean;
  canDeleteColumns: boolean;
  canManageMembers: boolean;
  canInviteUsers: boolean;
  canDeleteBoard: boolean;
}

export interface InviteUserData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  message?: string;
}

export interface BoardCollaborationState {
  board: KanbanBoard | null;
  members: KanbanBoardMember[];
  invitations: KanbanBoardInvitation[];
  currentUserRole: 'owner' | 'admin' | 'editor' | 'viewer' | null;
  permissions: CollaborationPermissions;
  loading: boolean;
  error: string | null;
} 
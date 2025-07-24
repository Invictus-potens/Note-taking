-- Kanban Boards table (for collaboration)
create table public.kanban_boards (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  owner_id uuid not null,
  is_public boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint kanban_boards_pkey primary key (id),
  constraint kanban_boards_owner_id_fkey foreign key (owner_id) references auth.users (id) on delete cascade
);

-- Kanban Board Members table (collaborators)
create table public.kanban_board_members (
  id uuid not null default gen_random_uuid (),
  board_id uuid not null,
  user_id uuid not null,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  invited_by uuid not null,
  invited_at timestamp with time zone null default now(),
  accepted_at timestamp with time zone null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  constraint kanban_board_members_pkey primary key (id),
  constraint kanban_board_members_board_id_fkey foreign key (board_id) references public.kanban_boards (id) on delete cascade,
  constraint kanban_board_members_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint kanban_board_members_invited_by_fkey foreign key (invited_by) references auth.users (id) on delete cascade,
  constraint kanban_board_members_unique unique (board_id, user_id)
);

-- Board Invitations table (for pending invites)
create table public.kanban_board_invitations (
  id uuid not null default gen_random_uuid (),
  board_id uuid not null,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  invited_by uuid not null,
  invited_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  constraint kanban_board_invitations_pkey primary key (id),
  constraint kanban_board_invitations_board_id_fkey foreign key (board_id) references public.kanban_boards (id) on delete cascade,
  constraint kanban_board_invitations_invited_by_fkey foreign key (invited_by) references auth.users (id) on delete cascade
);

-- Add board_id columns to existing tables
alter table public.kanban_columns add column board_id uuid;
alter table public.kanban_cards add column board_id uuid;

-- Add foreign key constraints
alter table public.kanban_columns add constraint kanban_columns_board_id_fkey foreign key (board_id) references public.kanban_boards (id) on delete cascade;
alter table public.kanban_cards add constraint kanban_cards_board_id_fkey foreign key (board_id) references public.kanban_boards (id) on delete cascade; 
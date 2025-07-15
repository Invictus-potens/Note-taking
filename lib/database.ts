import { supabase } from './supabase';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_private: boolean;
  user_id: string;
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

// Database schema setup
export const setupDatabase = async () => {
  // Create tables if they don't exist
  // Note: In Supabase, you typically create tables through the dashboard or migrations
  // This is just for reference of the schema structure
  
  const tables = {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    notes: `
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT,
        folder TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        is_pinned BOOLEAN DEFAULT FALSE,
        is_private BOOLEAN DEFAULT FALSE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    folders: `
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    tags: `
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  };

  console.log('Database schema reference created. Please create tables in Supabase dashboard.');
  return tables;
}; 
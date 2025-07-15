import { supabase } from './supabase';
import { Note, Folder, Tag } from './database';

export const NotesService = {
  async getNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    return data || [];
  },

  async addNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding note:', error);
      throw error;
    }

    return data.id;
  },

  async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  subscribeToNotes(userId: string, callback: (notes: Note[]) => void) {
    const subscription = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const notes = await this.getNotes(userId);
          callback(notes);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};

export const FoldersService = {
  async getFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return data || [];
  },

  async addFolder(name: string, userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('folders')
      .insert([{ name, user_id: userId }])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding folder:', error);
      throw error;
    }

    return data.id;
  },

  async deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }
};

export const TagsService = {
  async getTags(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }

    return data || [];
  },

  async addTag(name: string, userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, user_id: userId }])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding tag:', error);
      throw error;
    }

    return data.id;
  },

  async deleteTag(tagId: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }
}; 

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isPrivate: boolean;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export const NotesService = {
  async getNotes(userId: string): Promise<Note[]> {
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  },

  async addNote(note: Omit<Note, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteNote(noteId: string): Promise<void> {
    await deleteDoc(doc(db, 'notes', noteId));
  },

  subscribeToNotes(userId: string, callback: (notes: Note[]) => void) {
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Note));
      callback(notes);
    });
  }
};

export const FoldersService = {
  async getFolders(userId: string): Promise<Folder[]> {
    const q = query(
      collection(db, 'folders'),
      where('userId', '==', userId),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Folder));
  },

  async addFolder(name: string, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'folders'), {
      name,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async deleteFolder(folderId: string): Promise<void> {
    await deleteDoc(doc(db, 'folders', folderId));
  }
};

export const TagsService = {
  async getTags(userId: string): Promise<Tag[]> {
    const q = query(
      collection(db, 'tags'),
      where('userId', '==', userId),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Tag));
  },

  async addTag(name: string, userId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'tags'), {
      name,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async deleteTag(tagId: string): Promise<void> {
    await deleteDoc(doc(db, 'tags', tagId));
  }
};

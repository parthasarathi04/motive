import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Relationship } from '../types';

const COLLECTION = 'relationships';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalRelationships = (userId: string): Relationship[] => {
  const data = localStorage.getItem(`motive_relationships_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalRelationships = (userId: string, relationships: Relationship[]) => {
  localStorage.setItem(`motive_relationships_${userId}`, JSON.stringify(relationships));
};

export const RelationshipRepository = {
  async getRelationships(userId: string): Promise<Relationship[]> {
    if (isLocalMode()) {
      return getLocalRelationships(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship));
    } catch (e) {
      console.warn('Firestore getRelationships failed, falling back to local', e);
      return getLocalRelationships(userId);
    }
  },

  subscribeRelationships(userId: string, onUpdate: (relationships: Relationship[]) => void): () => void {
    if (isLocalMode()) {
      const update = () => {
        onUpdate(getLocalRelationships(userId));
      };
      update();
      window.addEventListener('storage', update);
      window.addEventListener('motive_relationships_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_relationships_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const relationships = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship));
        onUpdate(relationships);
      }, (err) => {
        console.warn('Firestore relationships snapshot failed, falling back to local', err);
        onUpdate(getLocalRelationships(userId));
      });
    } catch (e) {
      console.warn('Firestore relationships subscription failed', e);
      return () => {};
    }
  },

  async createRelationship(userId: string, goalId: string, commitmentId: string, confidence: number, source: 'USER' | 'AI' | 'IMPORTED', reason: string): Promise<Relationship> {
    const id = doc(collection(db, COLLECTION)).id;
    const newRel: Relationship = {
      id,
      userId,
      goalId,
      commitmentId,
      confidence,
      source,
      reason
    };

    if (isLocalMode()) {
      const rels = getLocalRelationships(userId);
      rels.push(newRel);
      saveLocalRelationships(userId, rels);
      window.dispatchEvent(new Event('motive_relationships_updated'));
      return newRel;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newRel);
      return newRel;
    } catch (e) {
      console.error('Firestore createRelationship failed, fallback to local', e);
      const rels = getLocalRelationships(userId);
      rels.push(newRel);
      saveLocalRelationships(userId, rels);
      window.dispatchEvent(new Event('motive_relationships_updated'));
      return newRel;
    }
  },

  async deleteRelationship(userId: string, id: string): Promise<void> {
    if (isLocalMode()) {
      const rels = getLocalRelationships(userId);
      const filtered = rels.filter(r => r.id !== id);
      saveLocalRelationships(userId, filtered);
      window.dispatchEvent(new Event('motive_relationships_updated'));
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (e) {
      console.error('Firestore deleteRelationship failed, fallback to local', e);
      const rels = getLocalRelationships(userId);
      const filtered = rels.filter(r => r.id !== id);
      saveLocalRelationships(userId, filtered);
      window.dispatchEvent(new Event('motive_relationships_updated'));
    }
  }
};

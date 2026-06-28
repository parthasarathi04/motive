import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Artifact } from '../types';

const COLLECTION = 'artifacts';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalArtifacts = (userId: string): Artifact[] => {
  const data = localStorage.getItem(`motive_artifacts_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalArtifacts = (userId: string, artifacts: Artifact[]) => {
  localStorage.setItem(`motive_artifacts_${userId}`, JSON.stringify(artifacts));
};

export const ArtifactRepository = {
  async getArtifacts(userId: string): Promise<Artifact[]> {
    if (isLocalMode()) {
      return getLocalArtifacts(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('receivedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artifact));
    } catch (e) {
      console.warn('Firestore getArtifacts failed, falling back to local', e);
      return getLocalArtifacts(userId);
    }
  },

  subscribeArtifacts(userId: string, onUpdate: (artifacts: Artifact[]) => void): () => void {
    if (isLocalMode()) {
      const update = () => {
        onUpdate(getLocalArtifacts(userId));
      };
      update();
      window.addEventListener('storage', update);
      window.addEventListener('motive_artifacts_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_artifacts_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('receivedAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const artifacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artifact));
        onUpdate(artifacts);
      }, (err) => {
        console.warn('Firestore artifacts snapshot failed, falling back to local', err);
        onUpdate(getLocalArtifacts(userId));
      });
    } catch (e) {
      console.warn('Firestore artifacts subscription failed', e);
      return () => {};
    }
  },

  async createArtifact(artifact: Omit<Artifact, 'id'>): Promise<Artifact> {
    const id = doc(collection(db, COLLECTION)).id;
    const newArt: Artifact = {
      ...artifact,
      id,
    };

    if (isLocalMode()) {
      const arts = getLocalArtifacts(artifact.userId);
      arts.unshift(newArt);
      saveLocalArtifacts(artifact.userId, arts);
      window.dispatchEvent(new Event('motive_artifacts_updated'));
      return newArt;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newArt);
      return newArt;
    } catch (e) {
      console.error('Firestore createArtifact failed, fallback to local', e);
      const arts = getLocalArtifacts(artifact.userId);
      arts.unshift(newArt);
      saveLocalArtifacts(artifact.userId, arts);
      window.dispatchEvent(new Event('motive_artifacts_updated'));
      return newArt;
    }
  },

  async updateArtifact(userId: string, id: string, updates: Partial<Artifact>): Promise<void> {
    if (isLocalMode()) {
      const arts = getLocalArtifacts(userId);
      const index = arts.findIndex(a => a.id === id);
      if (index !== -1) {
        arts[index] = { ...arts[index], ...updates };
        saveLocalArtifacts(userId, arts);
        window.dispatchEvent(new Event('motive_artifacts_updated'));
      }
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION, id), updates);
    } catch (e) {
      console.error('Firestore updateArtifact failed, fallback to local', e);
      const arts = getLocalArtifacts(userId);
      const index = arts.findIndex(a => a.id === id);
      if (index !== -1) {
        arts[index] = { ...arts[index], ...updates };
        saveLocalArtifacts(userId, arts);
        window.dispatchEvent(new Event('motive_artifacts_updated'));
      }
    }
  }
};

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TimelineEntry } from '../types';

const COLLECTION = 'timeline';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalTimeline = (userId: string): TimelineEntry[] => {
  const data = localStorage.getItem(`motive_timeline_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalTimeline = (userId: string, timeline: TimelineEntry[]) => {
  localStorage.setItem(`motive_timeline_${userId}`, JSON.stringify(timeline));
};

export const TimelineRepository = {
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    if (isLocalMode()) {
      return getLocalTimeline(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEntry));
    } catch (e) {
      console.warn('Firestore getTimeline failed, falling back to local', e);
      return getLocalTimeline(userId);
    }
  },

  subscribeTimeline(userId: string, onUpdate: (timeline: TimelineEntry[]) => void): () => void {
    if (isLocalMode()) {
      const update = () => {
        onUpdate(getLocalTimeline(userId));
      };
      update();
      window.addEventListener('storage', update);
      window.addEventListener('motive_timeline_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_timeline_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const timeline = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEntry));
        onUpdate(timeline);
      }, (err) => {
        console.warn('Firestore timeline snapshot failed, falling back to local', err);
        onUpdate(getLocalTimeline(userId));
      });
    } catch (e) {
      console.warn('Firestore timeline subscription failed', e);
      return () => {};
    }
  },

  async createTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'createdAt'>): Promise<TimelineEntry> {
    const id = doc(collection(db, COLLECTION)).id;
    const now = new Date().toISOString();
    const newEntry: TimelineEntry = {
      ...entry,
      id,
      createdAt: now,
    };

    if (isLocalMode()) {
      const timeline = getLocalTimeline(entry.userId);
      timeline.unshift(newEntry);
      saveLocalTimeline(entry.userId, timeline);
      window.dispatchEvent(new Event('motive_timeline_updated'));
      return newEntry;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newEntry);
      return newEntry;
    } catch (e) {
      console.error('Firestore createTimelineEntry failed, fallback to local', e);
      const timeline = getLocalTimeline(entry.userId);
      timeline.unshift(newEntry);
      saveLocalTimeline(entry.userId, timeline);
      window.dispatchEvent(new Event('motive_timeline_updated'));
      return newEntry;
    }
  }
};

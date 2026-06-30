import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const config = {
  apiKey: (metaEnv.VITE_FIREBASE_API_KEY as string) || firebaseConfig?.apiKey || "mock-api-key",
  authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig?.authDomain || "mock-auth-domain.firebaseapp.com",
  projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig?.projectId || "mock-project-id",
  storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig?.storageBucket || "mock-storage-bucket.appspot.com",
  messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig?.messagingSenderId || "mock-sender-id",
  appId: (metaEnv.VITE_FIREBASE_APP_ID as string) || firebaseConfig?.appId || "mock-app-id",
};

const isConfigValid = !!(config.apiKey && config.apiKey !== "mock-api-key" && config.projectId && config.projectId !== "mock-project-id");

const app = getApps().length === 0 ? initializeApp(config) : getApp();
const databaseId = (metaEnv.VITE_FIREBASE_DATABASE_ID as string) || firebaseConfig?.firestoreDatabaseId;

let db: Firestore;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  }, databaseId);
} catch (e) {
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth, isConfigValid };

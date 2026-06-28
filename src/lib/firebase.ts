import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';

// Ensure we have a valid config
const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

const config = isConfigValid ? {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
} : {
  apiKey: "mock-api-key",
  authDomain: "mock-auth-domain.firebaseapp.com",
  projectId: "mock-project-id",
  storageBucket: "mock-storage-bucket.appspot.com",
  messagingSenderId: "mock-sender-id",
  appId: "mock-app-id"
};

const app = getApps().length === 0 ? initializeApp(config) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, isConfigValid };

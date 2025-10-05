import Constants from 'expo-constants';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

function getConfigFromExtra() {
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const cfg = extra?.firebase;
  if (!cfg) {
    throw new Error('Firebase config is missing. Set expo.extra.firebase in app.json');
  }
  return cfg as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export function ensureFirebaseInitialized(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  const config = getConfigFromExtra();
  firebaseApp = initializeApp(config);
  authInstance = getAuth(firebaseApp);
  firestoreInstance = getFirestore(firebaseApp);
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) ensureFirebaseInitialized();
  return authInstance as Auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) ensureFirebaseInitialized();
  return firestoreInstance as Firestore;
}



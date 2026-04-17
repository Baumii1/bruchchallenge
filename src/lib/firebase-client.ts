import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let cachedApp: FirebaseApp | null | undefined;
let cachedAuth: Auth | null | undefined;
let cachedDb: Firestore | null | undefined;

export const isFirebaseConfigured = (): boolean => hasFirebaseConfig;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (cachedApp !== undefined) {
    return cachedApp;
  }

  if (!hasFirebaseConfig) {
    cachedApp = null;
    return cachedApp;
  }

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
};

export const getFirebaseAuthClient = (): Auth | null => {
  if (cachedAuth !== undefined) {
    return cachedAuth;
  }

  const app = getFirebaseApp();
  cachedAuth = app ? getAuth(app) : null;
  return cachedAuth;
};

export const getFirebaseDb = (): Firestore | null => {
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  const app = getFirebaseApp();
  if (!app) {
    cachedDb = null;
    return cachedDb;
  }

  try {
    cachedDb = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    });
  } catch {
    cachedDb = getFirestore(app);
  }

  return cachedDb;
};

export const getConfiguredAdminEmails = (): string[] => {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) {
    return false;
  }

  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
};

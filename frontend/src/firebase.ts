/**
 * Shared Firebase Configuration
 * This ensures all components use the same Firebase app instance
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'fake-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'oceanpearl-ops',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-southeast1');

// Connect to emulators ONLY in local development (not in production builds)
// import.meta.env.DEV is true only during `vite dev`, not `vite build`
if (import.meta.env.DEV) {
  const isManusProxy = window.location.hostname.includes('manus.computer');

  if (isManusProxy) {
    // When accessed via manus.computer proxy, use the public proxy URLs for emulators
    const proxyBase = window.location.hostname.replace('5174-', '');
    const authUrl = `https://9099-${proxyBase}`;
    const firestoreHost = `8080-${proxyBase}`;
    const functionsHost = `5001-${proxyBase}`;

    console.log('Connecting to Firebase Emulators via Manus proxy...');
    connectAuthEmulator(auth, authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreHost, 443);
    connectFunctionsEmulator(functions, functionsHost, 443);
  } else {
    // Local development: use localhost
    console.log('Connecting to Firebase Emulators (localhost)...');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
}

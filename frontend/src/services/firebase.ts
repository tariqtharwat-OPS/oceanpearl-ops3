import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
    apiKey: 'AIzaSyBmHSr7huWpMZa9RnKNBgV6fnXltmvsxcc',
    authDomain: 'oceanpearl-ops.firebaseapp.com',
    projectId: 'oceanpearl-ops',
    storageBucket: 'oceanpearl-ops.firebasestorage.app',
    messagingSenderId: '784571080866',
    appId: '1:784571080866:web:61bacaf38ea90f81d1f7fb',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-southeast1');

// Emulator setup for development (optional)
const useEmulator = import.meta.env.MODE === 'development'; // Set to true to use emulator

if (useEmulator) {
    try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (error) {
        // Emulator already connected
    }
} else {
    // Only enable persistence safely without conflict, typically run outside, but OK
}

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
    }
});

export default app;

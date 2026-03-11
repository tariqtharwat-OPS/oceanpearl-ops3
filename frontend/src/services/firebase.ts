/**
 * services/firebase.ts — Re-exports from the canonical root firebase.ts
 *
 * IMPORTANT: Do NOT add initializeApp() here.
 * The actual Firebase app initialization lives in src/firebase.ts.
 * Having two initializeApp() calls causes a "duplicate-app" crash.
 */
export { app, auth, db, functions } from '../firebase';
export { app as default } from '../firebase';

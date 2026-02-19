import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export const authService = {
    login: async (email: string, password: string): Promise<AuthUser> => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Initialize user profile in Firestore after successful login
        try {
            const initializeUserProfile = httpsCallable(functions, 'initializeUserProfile');
            await initializeUserProfile({});
        } catch (error) {
            console.error('Error initializing user profile:', error);
            // Don't fail the login if profile initialization fails
        }

        return {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
        };
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
    },

    getCurrentUser: (): Promise<AuthUser | null> => {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (user) {
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                    });
                } else {
                    resolve(null);
                }
            });
        });
    },

    onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
        return onAuthStateChanged(auth, (user) => {
            if (user) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                });
            } else {
                callback(null);
            }
        });
    },
};

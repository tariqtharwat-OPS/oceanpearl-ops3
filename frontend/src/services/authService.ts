import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export const authService = {
    login: async (email: string, password: string): Promise<AuthUser> => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Profile initialization is handled by AuthContext via firestoreService

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

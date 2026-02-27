import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../services/authService';
import { authService } from '../services/authService';
import type { UserProfile } from '../services/firestoreService';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
    user: AuthUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    login: typeof authService.login;
    logout: typeof authService.logout;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
            setUser(authUser);

            if (authUser) {
                try {
                    const profile = await firestoreService.getUserProfile(authUser.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userProfile,
        loading,
        isAdmin: ['admin', 'ceo', 'ADMIN', 'CEO'].includes(userProfile?.role || ''),
        login: authService.login,
        logout: authService.logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

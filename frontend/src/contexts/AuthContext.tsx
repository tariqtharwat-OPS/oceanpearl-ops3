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
    login: (email: string, password: string) => Promise<AuthUser>;
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

    // Enhanced login: signs in AND immediately fetches the profile.
    // This avoids a race condition where onAuthStateChanged fires after the
    // RoleBasedRouter renders, causing a redirect back to /login.
    const login = async (email: string, password: string): Promise<AuthUser> => {
        setLoading(true);
        const authUser = await authService.login(email, password);
        setUser(authUser);
        try {
            const profile = await firestoreService.getUserProfile(authUser.uid);
            setUserProfile(profile);
        } catch (error) {
            console.error('Error fetching user profile after login:', error);
            setUserProfile(null);
        }
        setLoading(false);
        return authUser;
    };

    const value = {
        user,
        userProfile,
        loading,
        isAdmin: ['admin', 'ceo', 'ADMIN', 'CEO'].includes(userProfile?.role || ''),
        login,
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

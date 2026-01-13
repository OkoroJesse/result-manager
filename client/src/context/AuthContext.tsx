import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRoleResolver } from '../hooks/useRoleResolver';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: string | null;
    profilePicture: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    loading: boolean;
    profileError: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string | null>(null);
    const [lastName, setLastName] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    const { resolveRole } = useRoleResolver();

    useEffect(() => {
        // Did Mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSessionChange(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSessionChange(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSessionChange = async (currentSession: Session | null) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
            setLoading(true);
            const profile = await resolveRole(currentSession.user.id);
            if (profile) {
                setRole(profile.role);
                setProfilePicture(profile.profilePictureUrl || null);
                setFirstName(profile.firstName || null);
                setLastName(profile.lastName || null);
                setIsActive(profile.isActive);
                setProfileError(null);
            } else {
                setRole(null);
                setProfilePicture(null);
                setFirstName(null);
                setLastName(null);
                setIsActive(false);
                setProfileError('Account profile missing or inactive');
            }
            setLoading(false);
        } else {
            setRole(null);
            setProfilePicture(null);
            setIsActive(false);
            setProfileError(null);
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }

        // 1. Clear all state
        setRole(null);
        setProfilePicture(null);
        setFirstName(null);
        setLastName(null);
        setSession(null);
        setUser(null);
        setIsActive(false);
        setProfileError(null);

        // 2. Force a full browser reload to clear any memory/component state
        // This is the most reliable way to prevent cross-session caching in complex apps
        window.location.href = '/login';
    };

    const value = {
        session,
        user,
        role,
        profilePicture,
        firstName,
        lastName,
        isActive,
        loading,
        profileError,
        signOut
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

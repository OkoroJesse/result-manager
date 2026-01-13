import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';

export interface UserProfile {
    id: string;
    role: string;
    isActive: boolean;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
}

export function useRoleResolver() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resolveRole = useCallback(async (userId: string): Promise<UserProfile | null> => {
        setLoading(true);
        setError(null);

        try {
            // Fetch profile from backend to bypass client-side RLS restrictions
            const response = await api.get('/auth/me');
            const data = response.data;

            if (!data || !data.user) {
                // Determine failure mode: session expired or system error
                throw new Error('Authenticated user session could not be verified.');
            }

            // Map backend response to UserProfile interface
            // Backend returns: { user: SupabaseUser, role: string }
            // Note: The /auth/me endpoint in auth.routes.ts populates (req as any).role from the DB

            return {
                id: data.user.id,
                role: data.role || 'student', // Fallback to student if role is missing
                isActive: true, // Backend middleware ensures active status for authenticated users
                email: data.user.email,
                firstName: data.user.user_metadata?.first_name, // Try metadata fallback
                lastName: data.user.user_metadata?.last_name,
                profilePictureUrl: null // Profile picture logic can be added later if needed
            };

        } catch (err: any) {
            console.error('Role resolution failed:', err);
            // If backend fails, we might want to try a fallback or just error out. 
            // For now, let's allow the error to propagate so the AuthContext handles it.
            setError(err.message || 'An unexpected authentication error occurred.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        resolveRole,
        loading,
        error
    };
}

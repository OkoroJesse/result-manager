import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * PostLoginResolver handles redirection after the user is authenticated 
 * and their role is resolved.
 */
export function PostLoginResolver() {
    const { role, loading, isActive, profileError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;

        if (profileError || !isActive) {
            navigate('/unauthorized');
            return;
        }

        if (role === 'admin') {
            navigate('/');
        } else if (role === 'teacher') {
            navigate('/');
        } else if (role === 'student') {
            // Students are directed to their specific results page
            // Assuming we'll fetch student ID or display a generic student dashboard
            navigate('/results');
        } else if (role) {
            // Default fallback
            navigate('/');
        }
    }, [role, loading, isActive, profileError, navigate]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <div className="mt-8 text-center">
                <h2 className="text-xl font-bold text-slate-900">Finalizing Sign In</h2>
                <p className="mt-2 text-slate-500">Redirecting you to your workspace...</p>
            </div>
        </div>
    );
}

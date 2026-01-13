import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
    const { session, loading, isActive, profileError } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                <p className="mt-4 text-sm font-medium text-slate-600">Syncing with school records...</p>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role resolution found an error (e.g., profile missing) or inactive
    if (profileError || !isActive) {
        return <Navigate to="/unauthorized" state={{ error: profileError || 'Account is inactive' }} replace />;
    }

    return <Outlet />;
}

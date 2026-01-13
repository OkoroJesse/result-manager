import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleRouteProps {
    allowedRoles: string[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
    const { role, loading, isActive, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="mt-4 text-sm text-slate-500 font-medium">Verifying access level...</p>
            </div>
        );
    }

    if (!role || !allowedRoles.includes(role) || !isActive) {
        console.warn(`[RoleRoute] Access Denied. User: ${user?.email}, Role: ${role}, Active: ${isActive}, Required: ${allowedRoles.join('|')}, Path: ${location.pathname}`);
        return <Navigate to="/unauthorized" state={{ type: 'insufficient_permissions' }} replace />;
    }

    return <Outlet />;
}

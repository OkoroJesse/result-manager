import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Core';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Unauthorized() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    // Get error info from navigation state
    const errorType = location.state?.type;
    const errorMessage = location.state?.error;

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-t-4 border-t-red-500 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Access Denied</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-slate-600">
                            {errorType === 'insufficient_permissions'
                                ? "Your account doesn't have permission to view this page."
                                : errorMessage || "We couldn't verify your account permissions or your account may be inactive."}
                        </p>
                        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-500 break-all">
                            Logged in as: <span className="font-medium text-slate-700">{user?.email || 'Unknown User'}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-slate-200 text-slate-700"
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                            }}
                        >
                            Sign out and try again
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 mb-2">Need help? Contact the school administrator</p>
                        <a
                            href="mailto:admin@school.com"
                            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                            <Mail className="mr-2 h-4 w-4" /> admin@school.com
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

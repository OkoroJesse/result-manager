import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent, Alert } from '../../components/ui/Core';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Loader2, ShieldAlert, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { session, loading: authLoading, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // If already logged in AND role is resolved, redirect away from login
    useEffect(() => {
        if (!authLoading && session && role) {
            const from = (location.state as any)?.from?.pathname || "/";
            navigate(from, { replace: true });
        }
    }, [session, authLoading, role, navigate, location]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSigningIn(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setSigningIn(false);
            }
        } catch (err: any) {
            setError('System connection protocol failed. Please re-authenticate.');
            setSigningIn(false);
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2 bg-slate-50/50">
            {/* Right: Branding (Top on Mobile) */}
            <div className="order-1 lg:order-2 flex flex-col items-center justify-center relative bg-white py-8 px-6 lg:p-8 h-auto lg:h-full border-b border-slate-100 lg:border-none shadow-sm lg:shadow-none z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white z-0" />

                <div className="z-10 w-full max-w-sm text-center space-y-4 lg:space-y-6">
                    {/* Logo Section */}
                    <div className="flex items-center justify-center gap-2 lg:mb-4">
                        <div className="h-8 w-8 lg:h-10 lg:w-10 bg-[#0284c7] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3">
                            <GraduationCap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <h1 className="text-xl lg:text-2xl font-black text-slate-900 italic tracking-tight">
                            Bright Smile Academy
                        </h1>
                    </div>

                    <div className="space-y-2 lg:space-y-3">
                        <h2 className="hidden lg:block text-3xl font-black text-slate-900 leading-tight">
                            Precision in <br />
                            <span className="text-[#0284c7] italic">Academic Records</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-[10px] lg:text-sm leading-relaxed max-w-xs mx-auto">
                            The intelligent school management portal.
                        </p>
                    </div>

                    {/* Features & Illustration - Desktop Only */}
                    <div className="hidden lg:block space-y-6">
                        <div className="space-y-2 pt-1">
                            {[
                                'Real-time Result Compilation',
                                'Automated Report Generation',
                                'Official Academic Registry'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-500/10" />
                                    <span className="text-xs font-bold text-slate-600">{feature}</span>
                                </div>
                            ))}
                        </div>
                        <div className="relative mt-8 w-full flex justify-center">
                            <div className="relative z-10 p-3 bg-white rounded-xl shadow-xl shadow-slate-200/50 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="/login_students.png"
                                    alt="Students on Pencil"
                                    className="w-72 h-auto object-cover rounded-lg"
                                />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Left: Login Form (Bottom on Mobile) */}
            <div className="order-2 lg:order-1 flex-1 flex items-center justify-center p-4 bg-slate-50/50 lg:h-full overflow-hidden">
                <Card className="w-full max-w-[320px] sm:max-w-[360px] shadow-xl border-none bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 scale-90 sm:scale-100 origin-center">
                    <CardContent className="space-y-5 sm:space-y-6 pt-2">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Welcome Back</h2>
                            <p className="text-slate-500 font-medium text-[10px] sm:text-xs">Please enter your credentials.</p>
                        </div>

                        {error && (
                            <Alert variant="error" className="py-2 px-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3" />
                                    <span>{error}</span>
                                </div>
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-10 bg-slate-100 border-2 border-transparent rounded-lg pl-10 pr-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all placeholder:text-slate-400"
                                        placeholder="teacher@resultly.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                                    Security Credentials
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-10 bg-slate-100 border-2 border-transparent rounded-lg pl-10 pr-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all placeholder:text-slate-400"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={signingIn || authLoading}
                                className="w-full h-10 text-xs font-black tracking-wide uppercase bg-[#0284c7] hover:bg-[#0369a1] shadow-xl shadow-[#0284c7]/20 rounded-lg mt-2"
                            >
                                {signingIn || authLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>CONNECTING...</span>
                                    </div>
                                ) : (
                                    "LOGIN TO PLATFORM"
                                )}
                            </Button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] select-none">
                                SECURE ACADEMIC GATEWAY © 2026
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

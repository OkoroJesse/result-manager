import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    FileText,
    Settings,
    LogOut,
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    to?: string;
    icon: any;
    label: string;
    subLinks?: { to: string; label: string }[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { signOut, role } = useAuth();
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const toggleSection = (label: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const adminLinks: NavItem[] = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/students', icon: Users, label: 'Students' },
        { to: '/teachers', icon: GraduationCap, label: 'Teachers' },

        {
            label: 'Academics', icon: BookOpen, subLinks: [
                { to: '/academic/classes', label: 'Classes' },
                { to: '/academic/subjects', label: 'Subjects' },
                { to: '/academic/subjects/assign', label: 'Class Subjects' },
                { to: '/academic/promotions', label: 'Promotions' },
            ]
        },

        {
            label: 'Sessions & Terms', icon: BookOpen, subLinks: [
                { to: '/academic/sessions', label: 'Academic Sessions' },
                { to: '/academic/terms', label: 'Terms' },
            ]
        },

        {
            label: 'Results', icon: FileText, subLinks: [
                { to: '/results/approval', label: 'Approve Results' },
                { to: '/results/report-cards', label: 'Report Cards' },
            ]
        },

        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const teacherLinks: NavItem[] = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/results', icon: FileText, label: 'Enter Results' },
    ];

    const links = role === 'admin' ? adminLinks : teacherLinks;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Content */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-card transition-all duration-500 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col shadow-2xl md:shadow-none",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-8 flex-shrink-0 border-b border-border bg-secondary/10">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-text-primary">
                            Bright<span className="text-primary tracking-tighter italic mr-1">Smile</span>
                        </h1>
                    </div>
                    <button onClick={onClose} className="md:hidden p-2 rounded-xl text-text-muted hover:bg-secondary/80 transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5 px-4 py-8 overflow-y-auto scrollbar-hide">
                    {links.map((link) => (
                        <div key={link.label}>
                            {link.to ? (
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 group",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "text-text-muted hover:bg-secondary hover:text-primary"
                                        )
                                    }
                                >
                                    <link.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110")} />
                                    {link.label}
                                </NavLink>
                            ) : (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => toggleSection(link.label)}
                                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.25em] mt-8 first:mt-0 hover:bg-secondary/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <link.icon className="h-4 w-4 opacity-70 group-hover:text-primary transition-colors" />
                                            {link.label}
                                        </div>
                                        {expandedSections[link.label] ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedSections[link.label] && (
                                        <div className="ml-5 space-y-1 border-l-2 border-border pl-4 mr-2">
                                            {link.subLinks?.map((sub) => (
                                                <NavLink
                                                    key={sub.to}
                                                    to={sub.to}
                                                    className={({ isActive }) =>
                                                        cn(
                                                            "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-all group",
                                                            isActive
                                                                ? "text-primary bg-primary/10 border border-primary/20"
                                                                : "text-text-muted hover:text-primary hover:bg-secondary/80"
                                                        )
                                                    }
                                                >
                                                    {sub.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 group text-text-muted hover:bg-red-500/10 hover:text-red-500 mt-4"
                    >
                        <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        Sign Out
                    </button>
                </nav>

            </aside>
        </>
    );
}

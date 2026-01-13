import { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Menu, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, role, signOut, profilePicture, firstName, lastName } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.user-dropdown')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDisplayName = () => {
        if (firstName && lastName) return `${firstName} ${lastName}`;
        if (role === 'admin') return 'Admin User';
        if (role === 'teacher') return 'Teacher';
        if (role === 'student') return 'Student';
        return user?.email?.split('@')[0] || 'User';
    };

    return (
        <header className="sticky top-0 z-[60] flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-8 shadow-soft transition-all duration-300">
            <div className="flex items-center gap-6">
                <button
                    onClick={onMenuClick}
                    className="rounded-xl p-2.5 text-text-muted hover:bg-secondary/80 md:hidden transition-all active:scale-95"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Search Bar */}
                <div className="relative hidden md:block group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="search"
                        placeholder="Search dashboard..."
                        className="h-10 w-64 lg:w-96 rounded-xl border border-border bg-secondary/50 pl-11 text-sm font-medium focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl text-text-muted hover:bg-secondary/80 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-border"
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button className="relative rounded-xl p-2.5 text-text-muted hover:bg-secondary/80 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-border">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-card"></span>
                </button>

                <div className="w-px h-8 bg-border hidden md:block mx-1" />

                <div className="relative user-dropdown">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 rounded-xl border border-transparent hover:border-border hover:bg-secondary/30 p-1.5 pr-4 transition-all focus:outline-none active:scale-95 group"
                    >
                        {profilePicture ? (
                            <img
                                src={profilePicture}
                                alt="Profile"
                                className="h-9 w-9 rounded-xl object-cover border border-border bg-card shadow-soft"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-soft group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <User size={20} fontStyle="bold" />
                            </div>
                        )}

                        <div className="hidden md:flex flex-col items-start translate-y-[-1px]">
                            <span className="text-sm font-black text-text-primary leading-tight">{getDisplayName()}</span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{role}</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-3 w-72 rounded-main border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right overflow-hidden p-2">
                            <div className="p-4 rounded-xl bg-secondary/30 mb-2">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Authenticated as</p>
                                <p className="text-sm font-bold text-text-primary truncate">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    alert('Settings module is currently being optimized.');
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-text-muted hover:bg-secondary/80 hover:text-primary transition-all mb-1"
                            >
                                <User size={18} /> Account Settings
                            </button>

                            <div className="h-px bg-border my-2 mx-2" />

                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    signOut();
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={18} /> Secure Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

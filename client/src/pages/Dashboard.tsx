import { useEffect, useState } from 'react';
import {
    Users, GraduationCap, BookOpen, UserCheck, Loader2,
    FileEdit, Send, CheckCircle, AlertCircle,
    ShieldAlert, Clock
} from 'lucide-react';
import { KPICard } from '../components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent, Alert } from '../components/ui/Core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../services/api';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeSession: any;
    activeTerm: any;
    workflow: {
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
    };
    performance: Array<{
        className: string;
        average: number;
        passRate: number;
        totalResults: number;
    }>;
    teacherActivity: Array<{
        name: string;
        assignmentCount: number;
        resultsEntered: number;
        pendingApproval: number;
        lastActivity: string | null;
    }>;
    alerts: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
    }>;
}

// Simple global cache for instant-load on return navigation
let globalCachedStats: DashboardStats | null = null;

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(globalCachedStats);
    const [loading, setLoading] = useState(!globalCachedStats);
    useTheme();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats/dashboard');
                setStats(res.data);
                globalCachedStats = res.data;
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-lg font-black tracking-tight text-text-primary uppercase">Synchronizing High-Level Metrics</p>
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase opacity-60">Production Environment Secure</p>
                </div>
            </div>
        );
    }

    const kpiData = [
        { title: 'Registered Students', value: stats?.totalStudents ?? 0, icon: Users, trend: { value: 12, label: 'month' } },
        { title: 'Academic Teachers', value: stats?.totalTeachers ?? 0, icon: GraduationCap, subValue: 'Active assignments' },
        { title: 'Active Classrooms', value: stats?.totalClasses ?? 0, icon: BookOpen, trend: { value: 5, label: 'session' } },
        {
            title: 'Current Lifecycle',
            value: stats?.activeSession?.name || 'In-between',
            icon: UserCheck,
            subValue: stats?.activeTerm?.name || 'Inactive Period'
        },
    ];

    const workflowData = [
        { title: 'Draft Results', value: stats?.workflow.draft ?? 0, icon: FileEdit, color: 'text-text-muted', bg: 'bg-secondary/40' },
        { title: 'Pending Review', value: stats?.workflow.submitted ?? 0, icon: Send, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: 'Results Approved', value: stats?.workflow.approved ?? 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'Correction Needed', value: stats?.workflow.rejected ?? 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    return (
        <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-8">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary">
                        System <span className="text-primary italic">Overview</span>
                    </h2>
                    <p className="text-sm text-text-muted font-bold mt-1 uppercase tracking-wider">
                        Strategic oversight for <span className="text-primary">{stats?.activeSession?.name || 'System Setup'}</span> • {stats?.activeTerm?.name || 'Cycle Pending'}
                    </p>
                </div>
            </header>

            {/* Operational Alerts - Relocated to Top */}
            {(stats?.alerts && stats.alerts.length > 0) && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted px-2">Critical Notifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats.alerts.map((alert, i) => (
                            <Alert key={i} variant={alert.type === 'error' ? 'error' : 'warning'} className="shadow-soft hover:translate-x-1 transition-transform cursor-default">
                                <div className="flex items-center gap-3">
                                    {alert.type === 'error' ? <ShieldAlert size={18} /> : <AlertCircle size={18} />}
                                    <span className="tracking-tight">{alert.message}</span>
                                </div>
                            </Alert>
                        ))}
                    </div>
                </div>
            )}

            {/* Top KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiData.map((kpi) => (
                    <KPICard key={kpi.title} {...kpi} className="border-border/50" />
                ))}
            </div>

            {/* Quality Workflow Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {workflowData.map((item) => (
                    <div key={item.title} className={cn("p-6 rounded-main border border-border/50 flex items-center justify-between shadow-soft hover:shadow-lg transition-all duration-300 group cursor-default bg-card", item.bg)}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted group-hover:text-text-primary transition-colors">{item.title}</p>
                            <p className={cn("text-3xl font-black tracking-tighter", item.color)}>{item.value}</p>
                        </div>
                        <div className={cn("p-3 rounded-xl bg-card border border-border shadow-soft group-hover:scale-110 transition-transform duration-300", item.color)}>
                            <item.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Analytics Segment */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Active Performance Chart */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/50">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
                                    Academic Performance Matrix
                                </CardTitle>
                                <p className="text-[10px] text-text-muted font-bold mt-0.5">Cross-class score distribution</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                                    Peak: {stats?.performance[0]?.className || 'N/A'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.performance || []}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
                                                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                                        <XAxis
                                            dataKey="className"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: 900, fill: 'var(--text-muted)' }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-muted)' }}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-subtle)',
                                                background: 'var(--bg-card)',
                                                boxShadow: 'var(--shadow-soft)',
                                                padding: '12px 16px'
                                            }}
                                            itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                            labelStyle={{ fontWeight: 900, color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
                                        />
                                        <Bar dataKey="average" radius={[8, 8, 0, 0]} barSize={45}>
                                            {(stats?.performance || []).map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={entry.average > 60 ? 'url(#barGradient)' : 'var(--bg-secondary)'}
                                                    className="transition-all duration-500"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Engagement Column */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="h-full border-primary/10">
                        <CardHeader className="py-4 px-6 border-b border-border/50 bg-secondary/10">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <Clock size={14} />
                                </div>
                                Teacher Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                {(stats?.teacherActivity || []).map((teacher, i) => (
                                    <div key={i} className="py-2 px-3 rounded-lg hover:bg-secondary/50 transition-all duration-300 group border border-transparent hover:border-border flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-black text-text-primary group-hover:text-primary transition-colors">{teacher.name}</p>
                                            <p className="text-[9px] font-bold text-text-muted opacity-70 uppercase tracking-wider">
                                                {teacher.assignmentCount} Depts • {teacher.lastActivity ? new Date(teacher.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No Activity'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-text-primary tabular-nums tracking-tighter">{teacher.resultsEntered} Logged</p>
                                            {teacher.pendingApproval > 0 && (
                                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mt-0.5 animate-pulse">{teacher.pendingApproval} Pnd</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!stats?.teacherActivity || stats.teacherActivity.length === 0) && (
                                    <div className="py-20 text-center space-y-3 opacity-40">
                                        <div className="mx-auto h-12 w-12 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center">
                                            <Users size={20} className="text-text-muted" />
                                        </div>
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest leading-loose">No instructor data<br />captured for this cycle</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Strategic Success Metrics */}
            <div className="grid md:grid-cols-3 gap-8">
                {(stats?.performance || []).slice(0, 3).map((item, i) => (
                    <Card key={i} className="hover:border-primary/20 transition-all group overflow-hidden">
                        <CardContent className="p-7">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-text-primary">{item.className}</p>
                                    <p className="text-3xl font-black text-text-primary tracking-tighter">
                                        {item.passRate}%
                                    </p>
                                    <p className="text-[10px] font-bold text-text-muted opacity-60 uppercase tracking-widest leading-none mt-1">Efficiency threshold</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-6">
                                <div className="h-[100px] w-[100px] flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Pass', value: item.passRate },
                                                    { name: 'Pending', value: 100 - item.passRate },
                                                ]}
                                                innerRadius={30}
                                                outerRadius={45}
                                                paddingAngle={5}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={450}
                                                stroke="none"
                                            >
                                                <Cell fill={i === 0 ? 'var(--primary)' : i === 1 ? '#f59e0b' : '#6366f1'} />
                                                <Cell fill="var(--secondary)" opacity={0.3} />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: i === 0 ? 'var(--primary)' : i === 1 ? '#f59e0b' : '#6366f1' }} />
                                        <p className="text-[10px] font-black text-text-primary uppercase tracking-wider whitespace-nowrap">{item.passRate}% Pass</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-secondary opacity-50" />
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider whitespace-nowrap">{100 - item.passRate}% Fail/Pnd</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

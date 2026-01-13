import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../services/api';
import {
    ArrowRight,
    History,
    Users,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface PromotionHistory {
    id: string;
    session_from_id: string;
    session_to_id: string;
    class_from_id: string;
    class_to_id: string;
    student_count: number;
    created_at: string;
    session_from: { name: string };
    session_to: { name: string };
    class_from: { name: string };
    class_to: { name: string };
    admin: { first_name: string, last_name: string };
}

interface Session { id: string; name: string; is_active: boolean }
interface ClassItem { id: string; name: string }

export default function Promotions() {
    const [history, setHistory] = useState<PromotionHistory[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        sessionFrom: '',
        classFrom: '',
        sessionTo: '',
        classTo: '',
        status: 'promoted' as 'promoted' | 'repeated'
    });

    const [studentCount, setStudentCount] = useState<number | null>(null);
    const [fetchingCount, setFetchingCount] = useState(false);

    useEffect(() => {
        fetchMetadata();
        fetchHistory();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                api.get('/academic/sessions'),
                api.get('/academic/classes')
            ]);
            setSessions(sRes.data);
            setClasses(cRes.data);

            const active = sRes.data.find((s: Session) => s.is_active);
            if (active) setForm(prev => ({ ...prev, sessionFrom: active.id }));
        } catch (error) {
            console.error('Failed to fetch metadata');
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('/academic/promotions/history');
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Effect to fetch student count when source class changes
    useEffect(() => {
        if (form.classFrom && form.sessionFrom) {
            fetchStudentCount();
        } else {
            setStudentCount(null);
        }
    }, [form.classFrom, form.sessionFrom]);

    const fetchStudentCount = async () => {
        setFetchingCount(true);
        try {
            const res = await api.get(`/students?classId=${form.classFrom}`);
            // Filter by session if applicable (students table holds current class, 
            // but we might want to check if they have results in sessionFrom to be sure)
            setStudentCount(res.data.length);
        } catch (error) {
            setStudentCount(0);
        } finally {
            setFetchingCount(false);
        }
    };

    const handlePromote = async () => {
        if (!form.sessionTo || !form.classTo) {
            alert('Please select target session and class.');
            return;
        }

        if (form.sessionFrom === form.sessionTo && form.classFrom === form.classTo) {
            alert('Source and Target cannot be identical.');
            return;
        }

        const confirmMsg = `Are you sure? This will BATCH PROMOTE ${studentCount} students from ${classes.find(c => c.id === form.classFrom)?.name
            } to ${classes.find(c => c.id === form.classTo)?.name
            } for the ${sessions.find(s => s.id === form.sessionTo)?.name
            } session. This action is recorded in the audit log.`;

        if (!confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            const res = await api.post('/academic/promotions/batch', {
                sessionFromId: form.sessionFrom,
                sessionToId: form.sessionTo,
                classFromId: form.classFrom,
                classToId: form.classTo,
                status: form.status
            });

            alert(`Promotion successful! Processed: ${res.data.success} students.`);
            fetchHistory();
            setForm(prev => ({ ...prev, classFrom: '', classTo: '' }));
            setStudentCount(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Promotion failed');
        } finally {
            setSubmitting(false);
        }
    };

    const historyColumns = [
        {
            header: 'Date',
            cell: (row: PromotionHistory) => (
                <span className="text-xs font-medium text-slate-500">
                    {format(new Date(row.created_at), 'MMM d, yyyy HH:mm')}
                </span>
            )
        },
        {
            header: 'Transition',
            cell: (row: PromotionHistory) => (
                <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.session_from.name}</span>
                        <span className="font-bold text-slate-900">{row.class_from.name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{row.session_to.name}</span>
                        <span className="font-bold text-primary-900">{row.class_to.name}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Impact',
            cell: (row: PromotionHistory) => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700">{row.student_count} Students</span>
                </div>
            )
        },
        {
            header: 'Executed By',
            cell: (row: PromotionHistory) => (
                <div className="flex flex-col group">
                    <span className="text-sm font-bold text-slate-700">{row.admin.first_name} {row.admin.last_name}</span>
                    <span className="text-[10px] text-slate-400 italic">Admin Role</span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Promotion Center</h2>
                <p className="text-slate-500 font-medium">Manage batch student transitions between academic years and classes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-12">
                    <Card className="border-none shadow-xl bg-gradient-to-br from-white via-white to-primary-50/10 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-primary-600" />
                                Create New Promotion Batch
                            </CardTitle>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 shadow-sm animate-pulse">
                                Production Safe Mode
                            </span>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                                {/* Vertical Divider for Desktop */}
                                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2" />

                                {/* Source Configuration */}
                                <div className="space-y-6 relative group">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-slate-400 transition-colors rounded-full" />
                                    <div>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-slate-400" /> SOURCE (CURRENT STATE)
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">From Session</label>
                                                <select
                                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                                    value={form.sessionFrom}
                                                    onChange={e => setForm({ ...form, sessionFrom: e.target.value })}
                                                >
                                                    <option value="">Select Session</option>
                                                    {sessions.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name} {s.is_active ? '✨ (Current)' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">From Class</label>
                                                <select
                                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                                    value={form.classFrom}
                                                    onChange={e => setForm({ ...form, classFrom: e.target.value })}
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Count Card */}
                                    {fetchingCount ? (
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
                                            <span className="text-xs font-bold text-slate-400 uppercase">Scanning Class Registry...</span>
                                        </div>
                                    ) : studentCount !== null ? (
                                        <div className="bg-primary-50/50 rounded-2xl p-6 border border-primary-100 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-md border border-primary-100">
                                                    <Users className="h-6 w-6 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black text-primary-900">{studentCount}</p>
                                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Identified Students to Move</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="h-6 w-6 text-primary-500" />
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                                            <Users className="h-6 w-6 text-slate-300 mb-2" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug">Select Session & Class<br />to calculate batch size</p>
                                        </div>
                                    )}
                                </div>

                                {/* Target Configuration */}
                                <div className="space-y-6 relative group">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary-200 group-hover:bg-primary-400 transition-colors rounded-full" />
                                    <div>
                                        <h3 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" /> TARGET (NEW STATE)
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">To Session</label>
                                                <select
                                                    className="w-full h-11 rounded-xl border border-primary-200 bg-white px-4 py-2 font-bold text-primary-900 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                                    value={form.sessionTo}
                                                    onChange={e => setForm({ ...form, sessionTo: e.target.value })}
                                                >
                                                    <option value="">Select Session</option>
                                                    {sessions.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">To Class</label>
                                                <select
                                                    className="w-full h-11 rounded-xl border border-primary-200 bg-white px-4 py-2 font-bold text-primary-900 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                                    value={form.classTo}
                                                    onChange={e => setForm({ ...form, classTo: e.target.value })}
                                                >
                                                    <option value="">Select Class</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <ChevronRight className="h-24 w-24 rotate-12" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-2">Final Review</p>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-1 bg-primary-500 flex-1 rounded-full" />
                                                <span className="text-xs font-bold text-slate-300">Ready for Execution</span>
                                                <div className="h-1 bg-primary-500 flex-1 rounded-full" />
                                            </div>
                                            <Button
                                                onClick={handlePromote}
                                                disabled={submitting || !studentCount}
                                                className="w-full h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-900/40 border-none disabled:bg-slate-800 disabled:text-slate-600"
                                            >
                                                {submitting ? (
                                                    <div className="flex items-center gap-3">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span>Processing Batch...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span>Execute Promotion Batch</span>
                                                        <ArrowRight className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="warning" className="mt-12">
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Data Preservation Warning</h4>
                                    <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                                        This system enforces **Zero-Data-Loss**. Promoting students will update their current class identity but will *archive* their previous participation in Session History. All historical results remain locked and linked to the class snapshot at the time of entry.
                                    </p>
                                </div>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                <div className="lg:col-span-12">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-white border-b py-5 px-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                                <History className="h-5 w-5 text-slate-400" />
                                Academic Transition Logs
                            </CardTitle>
                            <span className="text-xs font-bold text-slate-400">Total Entries: {history.length}</span>
                        </CardHeader>
                        <DataTable
                            columns={historyColumns}
                            data={history}
                            isLoading={loadingHistory}
                            className="border-none"
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}

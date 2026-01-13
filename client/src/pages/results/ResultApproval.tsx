import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/Core';
import { CheckCircle2, XCircle, Loader2, Calendar, FileText, User } from 'lucide-react';
import api from '../../services/api';

interface ResultGroup {
    class_id: string;
    class_name: string;
    subject_id: string;
    subject_name: string;
    teacher_name: string;
    count: number;
    results: any[];
}

export default function ResultApproval() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [terms, setTerms] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    const [groups, setGroups] = useState<ResultGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadContext();
    }, []);

    const loadContext = async () => {
        try {
            const [sessRes, termRes] = await Promise.all([
                api.get('/academic/sessions'),
                api.get('/academic/terms')
            ]);
            setSessions(sessRes.data);
            setTerms(termRes.data);

            const activeSess = sessRes.data.find((s: any) => s.is_active);
            if (activeSess) setSelectedSession(activeSess.id);

            const activeTerm = termRes.data.find((t: any) => t.is_active);
            if (activeTerm) setSelectedTerm(activeTerm.id);
        } catch (error) {
            console.error('Failed to load context');
        }
    };

    useEffect(() => {
        if (selectedSession && selectedTerm) {
            fetchSubmitted();
        }
    }, [selectedSession, selectedTerm]);

    const fetchSubmitted = async () => {
        setLoading(true);
        try {
            const res = await api.get('/results/submitted', {
                params: { session_id: selectedSession, term_id: selectedTerm }
            });

            // Group by Class + Subject
            const raw = res.data;
            const map = new Map<string, ResultGroup>();

            raw.forEach((r: any) => {
                const key = `${r.class_id}-${r.subject_id}`;
                if (!map.has(key)) {
                    map.set(key, {
                        class_id: r.class_id,
                        class_name: r.classes.name,
                        subject_id: r.subject_id,
                        subject_name: r.subjects.name,
                        teacher_name: r.teachers ? `${r.teachers.users.first_name} ${r.teachers.users.last_name}` : 'Unknown',
                        count: 0,
                        results: []
                    });
                }
                const group = map.get(key)!;
                group.count++;
                group.results.push(r.id);
            });

            setGroups(Array.from(map.values()));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (groupKey: string, resultIds: string[]) => {
        if (!confirm('Approve these results? They will become immutable for teachers and visible to students.')) return;
        setProcessing(groupKey);
        try {
            await api.post('/results/approve', { result_ids: resultIds });
            fetchSubmitted();
        } catch (error) {
            alert('Approval failed');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (groupKey: string, resultIds: string[]) => {
        if (!confirm('Reject these results? They will be returned to the teacher as drafts.')) return;
        setProcessing(groupKey);
        try {
            await api.post('/results/reject', { result_ids: resultIds });
            fetchSubmitted();
        } catch (error) {
            alert('Rejection failed');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Result Approval Board</h2>
                    <p className="text-sm text-slate-500">Review and verify submitted academic results</p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-primary-50/30">
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Academic Session
                        </label>
                        <select
                            className="h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm"
                            value={selectedSession}
                            onChange={e => setSelectedSession(e.target.value)}
                        >
                            <option value="">-- Choose Session --</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Term Context
                        </label>
                        <select
                            className="h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm"
                            value={selectedTerm}
                            onChange={e => setSelectedTerm(e.target.value)}
                        >
                            <option value="">-- Choose Term --</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name} {t.is_active ? '(Active)' : ''}</option>)}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
                </div>
            ) : groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((g) => {
                        const key = `${g.class_id}-${g.subject_id}`;
                        const isThisProcessing = processing === key;

                        return (
                            <Card key={key} className="border-none shadow-md hover:shadow-lg transition-all group overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">{g.class_name}</CardTitle>
                                        <p className="text-xs font-bold text-primary-600">{g.subject_name}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                                        {g.count}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <User className="h-3.5 w-3.5" />
                                        <span>Entered by: <span className="text-slate-900">{g.teacher_name}</span></span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            className="h-10 font-bold"
                                            onClick={() => handleReject(key, g.results)}
                                            disabled={!!processing}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-10 bg-green-600 hover:bg-green-700 font-bold"
                                            onClick={() => handleApprove(key, g.results)}
                                            disabled={!!processing}
                                        >
                                            {isThisProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                            Approve
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No pending submissions for this context</p>
                </div>
            )}
        </div>
    );
}

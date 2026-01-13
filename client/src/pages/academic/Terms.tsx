import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../services/api';
import { CheckCircle2, Plus, Trash2, ArrowRight, AlertCircle, Loader2, Calendar, LayoutGrid, Edit2, Lock, ShieldOff } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface Term {
    id: string;
    name: string;
    order: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    status: 'draft' | 'active' | 'closed';
    session_id: string;
}

interface Session {
    id: string;
    name: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
}

export default function Terms() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Form Modal
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        order: 1,
        start_date: '',
        end_date: '',
        status: 'draft' as any
    });

    const activeSession = sessions.find(s => s.id === selectedSession);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchTerms(selectedSession);
        } else {
            setTerms([]);
        }
    }, [selectedSession]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/academic/sessions');
            setSessions(res.data);
            const active = res.data.find((s: Session) => s.is_active);
            if (active) setSelectedSession(active.id);
            else if (res.data.length > 0) setSelectedSession(res.data[0].id);
        } catch (error) {
            console.error('Failed to fetch sessions');
        }
    };

    const fetchTerms = async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/academic/terms?sessionId=${sessionId}`);
            setTerms(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditId(null);
        setFormData({
            name: '',
            order: terms.length + 1,
            start_date: '',
            end_date: '',
            status: 'draft'
        });
        setFormError(null);
        setShowForm(true);
    };

    const handleOpenEdit = (term: Term) => {
        setEditId(term.id);
        setFormData({
            name: term.name,
            order: term.order,
            start_date: term.start_date,
            end_date: term.end_date,
            status: term.status
        });
        setFormError(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession) return;
        setFormError(null);
        setSubmitting(true);
        try {
            if (editId) {
                await api.put(`/academic/terms/${editId}`, { ...formData, session_id: selectedSession });
            } else {
                await api.post('/academic/terms', { ...formData, session_id: selectedSession });
            }
            setShowForm(false);
            fetchTerms(selectedSession);
        } catch (error: any) {
            setFormError(error.response?.data?.error || 'Failed to save term');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async (id: string, name: string) => {
        if (!activeSession?.is_active) {
            alert('Cannot activate term: The parent session must be active first.');
            return;
        }
        if (!confirm(`Set "${name}" as the ACTIVE term for the institution? This will deactivate other terms and update the dashboard.`)) return;
        try {
            await api.patch(`/academic/terms/${id}/activate`);
            fetchTerms(selectedSession);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to activate term');
        }
    };

    const handleClose = async (id: string, name: string) => {
        const confirmMsg = `WARNING: Are you sure you want to CLOSE "${name}"?\n\nThis action is PERMANENT. All results for this term will become IMMUTABLE and cannot be edited by anyone (including admins) to preserve report card integrity.`;
        if (!confirm(confirmMsg)) return;

        try {
            await api.patch(`/academic/terms/${id}/close`);
            fetchTerms(selectedSession);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to close term');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will permanently delete the term. If results are linked, deletion will be blocked.')) return;
        try {
            await api.delete(`/academic/terms/${id}`);
            fetchTerms(selectedSession);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Delete failed');
        }
    };

    const formatDateSafe = (dateStr: string) => {
        if (!dateStr) return <span className="text-slate-400 italic font-normal">Not Set</span>;
        const d = new Date(dateStr);
        return isValid(d) ? format(d, 'MMM d, yyyy') : <span className="text-red-400">Invalid Date</span>;
    };

    const columns = [
        {
            header: 'Term Identity',
            cell: (row: Term) => (
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 text-slate-500 p-2 rounded-lg font-bold text-xs min-w-[32px] text-center">
                        #{row.order}
                    </div>
                    <div>
                        <span className="font-bold text-slate-900 block">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Internal ID: {row.id.substring(0, 8)}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Timeline',
            cell: (row: Term) => (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDateSafe(row.start_date)}</span>
                    <ArrowRight className="h-3 w-3 text-slate-300 mx-1" />
                    <span>{formatDateSafe(row.end_date)}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row: Term) => (
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border w-fit ${row.is_active
                        ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm'
                        : row.status === 'closed'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                        {row.status === 'closed' ? (
                            <Lock className="h-3 w-3" />
                        ) : (
                            <span className={`h-1.5 w-1.5 rounded-full ${row.is_active ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                        )}
                        {row.status === 'closed' ? 'CLOSED' : row.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 ${row.status === 'active' ? 'text-green-600' : row.status === 'closed' ? 'text-red-500' : 'text-slate-400'
                        }`}>
                        Phase: {row.status}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            cell: (row: Term) => (
                <div className="flex gap-2">
                    {row.status !== 'closed' && (
                        <>
                            {!row.is_active && (
                                <Button size="sm" variant="secondary" onClick={() => handleActivate(row.id, row.name)} className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 h-8">
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                                </Button>
                            )}
                            <Button size="sm" variant="secondary" onClick={() => handleClose(row.id, row.name)} className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-8">
                                <ShieldOff className="h-4 w-4 mr-2" /> Close
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)} className="h-8 w-8 p-0">
                                <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                    {row.status === 'closed' && (
                        <div className="h-8 flex items-center px-3 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            Immutable Record
                        </div>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} className="h-8 w-8 p-0">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Terms</h2>
                    <p className="text-sm text-slate-500">Define and manage divisional periods for {activeSession?.name || 'Academic Sessions'}</p>
                </div>
                {selectedSession && (
                    <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add New Term
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm bg-primary-50/20">
                <CardContent className="pt-6">
                    <div className="max-w-md space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Targeted Session Context
                        </label>
                        <select
                            className="h-12 w-full rounded-xl border border-primary-200 bg-white px-4 py-2 text-base font-bold text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
                            value={selectedSession}
                            onChange={e => setSelectedSession(e.target.value)}
                        >
                            <option value="">-- Choose Session --</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name} {s.is_active ? '🌟 (Live)' : ''}</option>
                            ))}
                        </select>
                        {activeSession && (
                            <p className="text-[10px] text-primary-600 font-bold px-1 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                SESSION BOUNDARY: {formatDateSafe(activeSession.start_date)} — {formatDateSafe(activeSession.end_date)}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedSession ? (
                <Card className="border-none shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="bg-white border-b px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                            <LayoutGrid className="h-5 w-5 text-primary-600" />
                            Registered Terms
                        </CardTitle>
                        <div className="flex">
                            {activeSession?.is_active ? (
                                <span className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5 shadow-sm">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> SESSION IS CURRENTLY ACTIVE
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200">
                                    SESSION INACTIVE
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <div className="p-0">
                        <DataTable columns={columns} data={terms} isLoading={loading} />
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <p className="text-slate-500 font-bold">Select an academic session to view divisional terms</p>
                    <p className="text-slate-400 text-xs mt-1">Transactions and records are scoped per term.</p>
                </div>
            )}

            {/* Form Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">
                        {editId ? `Edit ${formData.name}` : `Define New Term for ${activeSession?.name}`}
                    </DialogTitle>
                </DialogHeader>
                <DialogContent className="sm:max-w-[440px] w-full max-h-[95vh] overflow-y-auto">
                    <form id="term-form" onSubmit={handleSubmit} className="space-y-4 py-1">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in zoom-in-95">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="font-medium">{formError}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Display Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. First Term, Harmattan Semester..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Sequence Order <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Initial Status</label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    disabled={!!editId && formData.status === 'active'} // Protect active status manually
                                >
                                    <option value="draft">Draft (Planning)</option>
                                    <option value="active">Active (current)</option>
                                    <option value="closed">Closed (Archived)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary-500" /> Start Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-primary-500" /> End Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-primary-50/50 rounded-xl border border-primary-100/50">
                            <p className="text-[10px] text-primary-700 font-bold italic leading-relaxed">
                                ℹ️ PRODUCTION RULE: Term duration must fall within the selected session range:
                                <span className="underline ml-1">
                                    {activeSession ? `${formatDateSafe(activeSession.start_date)} to ${formatDateSafe(activeSession.end_date)}` : 'N/A'}
                                </span>
                            </p>
                        </div>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-slate-50/50 px-6 py-3 rounded-b-xl border-t mt-2 justify-center sm:justify-end">
                    <Button variant="secondary" onClick={() => setShowForm(false)} className="rounded-xl px-6 font-bold">Cancel</Button>
                    <Button type="submit" form="term-form" disabled={submitting} className="rounded-xl px-8 bg-primary-600 hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/20 whitespace-nowrap min-w-fit">
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {editId ? 'Apply Changes' : 'Confirm & Save'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

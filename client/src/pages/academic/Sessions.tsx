import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import api from '../../services/api';
import { Plus, CheckCircle2, Calendar, Trash2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Modal
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/academic/sessions');
            setSessions(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            await api.post('/academic/sessions', formData);
            setShowForm(false);
            setFormData({ name: '', start_date: '', end_date: '' });
            fetchSessions();
        } catch (error: any) {
            setFormError(error.response?.data?.error || 'Failed to create session');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to activate the ${name} session? This will deactivate all other sessions and terms.`)) return;
        try {
            await api.patch(`/academic/sessions/${id}/activate`);
            fetchSessions();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to activate session');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This cannot be undone and will fail if data is linked to this session.')) return;
        try {
            await api.delete(`/academic/sessions/${id}`);
            fetchSessions();
        } catch (error) {
            alert('Failed to delete session');
        }
    };

    const columns = [
        {
            header: 'Session Name',
            cell: (row: Session) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${row.is_active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Calendar className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900">{row.name}</span>
                </div>
            )
        },
        {
            header: 'Duration',
            cell: (row: Session) => (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <span>{format(new Date(row.start_date), 'MMM d, yyyy')}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span>{format(new Date(row.end_date), 'MMM d, yyyy')}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row: Session) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${row.is_active
                    ? 'bg-green-50 text-green-700 border-green-100 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${row.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    {row.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: (row: Session) => (
                <div className="flex gap-2">
                    {!row.is_active && (
                        <Button size="sm" variant="secondary" onClick={() => handleActivate(row.id, row.name)} className="hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                        </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Academic Sessions</h2>
                    <p className="text-sm text-slate-500">Define and manage institutional academic periods</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> New Session
                </Button>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                        <Calendar className="h-5 w-5 text-primary-600" /> Session Register
                    </CardTitle>
                </CardHeader>
                <div className="p-0">
                    <DataTable columns={columns} data={sessions} isLoading={loading} />
                </div>
            </Card>

            {/* Form Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">
                        Create Academic Session
                    </DialogTitle>
                </DialogHeader>
                <DialogContent className="sm:max-w-[420px]">
                    <form id="session-form" onSubmit={handleCreate} className="space-y-4 py-1">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="h-4 w-4" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Session Name <span className="text-red-500">*</span></label>
                            <input
                                required
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none h-10"
                                placeholder="e.g. 2024/2025"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Start Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none h-10"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">End Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none h-10"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            Transactional Rule: Activating this session later will deactivate all others.
                        </p>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-slate-50/50 px-6 py-3 rounded-b-xl border-t">
                    <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" form="session-form" disabled={submitting}>
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        Create Session
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

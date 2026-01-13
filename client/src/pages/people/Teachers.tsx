import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import { Plus, BookOpen, AlertCircle, Loader2, Search, Filter, Users, UserMinus, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { DataTable } from '../../components/ui/DataTable';

interface TeacherItem {
    id: string;
    staff_id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    status: 'active' | 'inactive';
    assignment_count: number;
    auth_user_id?: string;
}

export default function Teachers() {
    const [teachers, setTeachers] = useState<TeacherItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        status: 'active',
        search: ''
    });

    // Create Modal
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        staff_id: '',
        phone: ''
    });

    // Assign Modal
    const [showAssign, setShowAssign] = useState<TeacherItem | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assignForm, setAssignForm] = useState({ class_id: '', subject_id: '' });
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, [filters.status]);

    useEffect(() => {
        if (showAssign) {
            api.get('/academic/classes').then(res => setClasses(res.data)).catch(console.error);
        }
    }, [showAssign]);

    useEffect(() => {
        if (assignForm.class_id) {
            api.get(`/academic/classes/${assignForm.class_id}/subjects`)
                .then(res => setSubjects(res.data))
                .catch(console.error);
        } else {
            setSubjects([]);
        }
    }, [assignForm.class_id]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            const res = await api.get(`/teachers?${params.toString()}`);
            setTeachers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTeachers();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            await api.post('/teachers', createForm);
            setShowCreate(false);
            setCreateForm({ first_name: '', last_name: '', email: '', staff_id: '', phone: '' });
            fetchTeachers();
        } catch (error: any) {
            setFormError(error.response?.data?.error || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAssign || !assignForm.class_id || !assignForm.subject_id) return;
        setAssigning(true);
        try {
            await api.post(`/teachers/${showAssign.id}/assign`, assignForm);
            setShowAssign(null);
            setAssignForm({ class_id: '', subject_id: '' });
            fetchTeachers();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Assignment failed');
        } finally {
            setAssigning(false);
        }
    };

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to deactivate ${name}? This will block their login access.`)) return;
        try {
            await api.delete(`/teachers/${id}`);
            fetchTeachers();
        } catch (error) {
            console.error(error);
            alert('Deactivation failed');
        }
    };

    const columns = [
        {
            header: 'Staff ID',
            cell: (row: TeacherItem) => (
                <span className="font-mono text-xs font-bold text-slate-500">
                    {row.staff_id || 'N/A'}
                </span>
            )
        },
        {
            header: 'Full Name',
            cell: (row: TeacherItem) => (
                <div className="flex flex-col">
                    <span className="font-bold text-text-primary">{row.last_name}, {row.first_name}</span>
                    <span className="text-xs text-text-muted font-medium">{row.email}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row: TeacherItem) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${row.status === 'active'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {row.status.toUpperCase()}
                </span>
            )
        },
        {
            header: 'Assigned',
            cell: (row: TeacherItem) => (
                <div className="flex items-center gap-1.5 text-text-muted">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-bold text-text-primary">{row.assignment_count}</span>
                    <span className="text-xs text-text-muted italic">Classes</span>
                </div>
            )
        },
        {
            header: 'Auth',
            cell: (row: TeacherItem) => (
                row.auth_user_id ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        <ShieldCheck className="h-3 w-3" /> Linked
                    </span>
                ) : (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 italic">
                        Unlinked
                    </span>
                )
            )
        },
        {
            header: 'Actions',
            cell: (row: TeacherItem) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowAssign(row)} title="Assign Subject">
                        <BookOpen className="h-4 w-4" />
                    </Button>
                    {row.status === 'active' && (
                        <Button variant="danger" size="sm" onClick={() => handleDeactivate(row.id, `${row.first_name} ${row.last_name}`)} title="Deactivate">
                            <UserMinus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary">Teacher Hub</h2>
                    <p className="text-sm font-bold text-text-muted uppercase tracking-wider opacity-70">Manage teacher profiles and system assignments</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto shadow-xl">
                    <Plus className="mr-2 h-5 w-5" /> Register New Teacher
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-end">
                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-1.5 px-1">
                                <Search className="h-3 w-3" /> Search Teacher Registry
                            </label>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by Name, Staff ID, or Email..."
                                    className="h-12 flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-0"
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                />
                                <Button type="submit" variant="secondary" className="h-12 px-6 shrink-0">
                                    <Search className="h-4 w-4 sm:hidden" />
                                    <span className="hidden sm:inline">Initialize Search</span>
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Filter className="h-3 w-3" /> Status
                            </label>
                            <select
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="">All Staff</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" /> Teacher Directory
                    </CardTitle>
                </CardHeader>
                <div className="p-0">
                    <DataTable columns={columns} data={teachers} isLoading={loading} />
                </div>
            </Card>

            {/* Register Teacher Modal */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">Register New Teacher</DialogTitle>
                </DialogHeader>
                <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
                    <form id="teacher-form" onSubmit={handleCreate} className="space-y-4 py-2">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="h-4 w-4" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary">First Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    value={createForm.first_name}
                                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    value={createForm.last_name}
                                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Email Address <span className="text-red-500">*</span></label>
                            <input
                                required type="email"
                                className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                                placeholder="teacher@school.com"
                                value={createForm.email}
                                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary">Staff ID</label>
                                <input
                                    className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    placeholder="TCH-001"
                                    value={createForm.staff_id}
                                    onChange={e => setCreateForm({ ...createForm, staff_id: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary">Phone Number</label>
                                <input
                                    className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                                    value={createForm.phone}
                                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-secondary/40 px-6 py-4 rounded-b-xl border-t border-border">
                    <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button type="submit" form="teacher-form" disabled={submitting} className="shadow-xl px-8">
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {submitting ? 'Registering...' : 'Authorize Teacher Registry'}
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Assign Subject Modal */}
            <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">
                        Assign Subjects for {showAssign?.last_name}
                    </DialogTitle>
                </DialogHeader>
                <DialogContent>
                    <form id="assign-form" onSubmit={handleAssign} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Class Selection</label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                value={assignForm.class_id}
                                onChange={e => setAssignForm({ ...assignForm, class_id: e.target.value, subject_id: '' })}
                            >
                                <option value="">Select a class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Subject Selection</label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                value={assignForm.subject_id}
                                onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                                disabled={!assignForm.class_id}
                            >
                                <option value="">Select a subject...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                        </div>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-slate-50/50 px-6 py-4 rounded-b-xl border-t">
                    <Button variant="secondary" onClick={() => setShowAssign(null)}>Cancel</Button>
                    <Button type="submit" form="assign-form" disabled={assigning || !assignForm.subject_id}>
                        {assigning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        Assign to Teacher
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

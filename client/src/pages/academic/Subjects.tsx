import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import { Plus, Edit2, Archive, BookOpen, Layers, Search, Filter, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface SubjectItem {
    id: string;
    name: string;
    code: string;
    category: 'primary' | 'secondary';
    status: 'active' | 'inactive';
}

export default function Subjects() {
    const [data, setData] = useState<SubjectItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'primary' as 'primary' | 'secondary',
        status: 'active' as 'active' | 'inactive'
    });

    const [filters, setFilters] = useState({
        category: '',
        search: ''
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/academic/subjects');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/academic/subjects/${editingId}`, formData);
            } else {
                await api.post('/academic/subjects', formData);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', code: '', category: 'primary', status: 'active' });
            fetchSubjects();
        } catch (error: any) {
            setFormError(error.response?.data?.error || 'Failed to save subject');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (subject: SubjectItem) => {
        setFormData({
            name: subject.name,
            code: subject.code || '',
            category: subject.category,
            status: subject.status
        });
        setEditingId(subject.id);
        setShowForm(true);
    };

    const toggleStatus = async (subject: SubjectItem) => {
        const newStatus = subject.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/academic/subjects/${subject.id}`, { status: newStatus });
            fetchSubjects();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const filteredData = data.filter(item => {
        const matchesCategory = !filters.category || item.category === filters.category;
        const matchesSearch = !filters.search ||
            item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.code?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const columns = [
        {
            header: 'Subject Name',
            cell: (row: SubjectItem) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{row.name}</span>
                    {row.code && <span className="text-xs font-mono text-slate-400 font-bold uppercase">{row.code}</span>}
                </div>
            )
        },
        {
            header: 'Category',
            cell: (row: SubjectItem) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${row.category === 'primary'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                    <Layers className="h-3 w-3" />
                    {row.category}
                </span>
            )
        },
        {
            header: 'Status',
            cell: (row: SubjectItem) => (
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
            header: 'Actions',
            cell: (row: SubjectItem) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(row)} title="Edit">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={row.status === 'active' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => toggleStatus(row)}
                        title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                        <Archive className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Subjects Library</h2>
                    <p className="text-sm text-slate-500">Manage the central directory of subjects for the institution</p>
                </div>
                <Button onClick={() => { setEditingId(null); setFormData({ name: '', code: '', category: 'primary', status: 'active' }); setShowForm(true); }} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> New Subject
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-end">
                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Search className="h-3 w-3" /> Search Library
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search by Name or Code..."
                                    className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 min-w-0"
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                />
                                <Button type="button" variant="secondary" className="h-10 px-4 shrink-0" onClick={fetchSubjects}>
                                    <Search className="h-4 w-4 sm:hidden" />
                                    <span className="hidden sm:inline">Search</span>
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Filter className="h-3 w-3" /> Category
                            </label>
                            <select
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                value={filters.category}
                                onChange={e => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">All Categories</option>
                                <option value="primary">Primary</option>
                                <option value="secondary">Secondary</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                        <BookOpen className="h-5 w-5 text-primary-600" /> Institution Subjects
                    </CardTitle>
                </CardHeader>
                <div className="p-0">
                    <DataTable columns={columns} data={filteredData} isLoading={loading} />
                </div>
            </Card>

            {/* Subject Form Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">
                        {editingId ? 'Edit Subject Definition' : 'Define New Subject'}
                    </DialogTitle>
                </DialogHeader>
                <DialogContent className="sm:max-w-[425px]">
                    <form id="subject-form" onSubmit={handleSubmit} className="space-y-4 py-1">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="h-4 w-4" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Subject Name <span className="text-red-500">*</span></label>
                            <input
                                required
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                placeholder="e.g. Mathematics"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Short Code</label>
                                <input
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                    placeholder="e.g. MTH"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="primary">Primary</option>
                                    <option value="secondary">Secondary</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-slate-50/50 px-6 py-4 rounded-b-xl border-t">
                    <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" form="subject-form" disabled={submitting}>
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {editingId ? 'Update Definition' : 'Save to Library'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

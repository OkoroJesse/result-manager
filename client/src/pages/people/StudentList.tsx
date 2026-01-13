import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import StudentForm from './StudentForm';
import api from '../../services/api';
import { Plus, Edit, UserX, Search, GraduationCap, Users, FileText } from 'lucide-react';

interface StudentItem {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    gender: string;
    status: 'active' | 'graduated' | 'withdrawn';
    class_id: string;
    classes?: { name: string };
}

export default function StudentList() {
    const navigate = useNavigate();
    const [data, setData] = useState<StudentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<any[]>([]);

    // Filter & Search State
    const [filters, setFilters] = useState({
        class_id: '',
        status: 'active',
        search: ''
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.class_id) params.append('class_id', filters.class_id);
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const res = await api.get(`/people/students?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/academic/classes');
            setClasses(res.data);
        } catch (err) {
            console.error('Failed to fetch classes', err);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [filters.class_id, filters.status]); // Debounced search handled manually or as needed

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStudents();
    };

    const handleCreate = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student: StudentItem) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to mark ${name} as withdrawn? Their historical records will be preserved.`)) return;
        try {
            await api.delete(`/people/students/${id}`);
            fetchStudents();
        } catch (error) {
            console.error(error);
            alert('Failed to deactivate student');
        }
    };

    const columns = [
        { header: 'Admission No', accessorKey: 'admission_number' as keyof StudentItem },
        {
            header: 'Full Name',
            cell: (row: StudentItem) => (
                <div className="font-bold text-text-primary">
                    {row.last_name}, {row.first_name}
                </div>
            )
        },
        {
            header: 'Class',
            cell: (row: StudentItem) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                    {row.classes?.name || 'Unassigned'}
                </span>
            )
        },
        {
            header: 'Status',
            cell: (row: StudentItem) => {
                const statusStyles = {
                    active: 'bg-green-500/10 text-green-600 border-green-500/20',
                    graduated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    withdrawn: 'bg-red-500/10 text-red-600 border-red-500/20'
                };
                return (
                    <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyles[row.status]}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            cell: (row: StudentItem) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="primary"
                        className="shadow-md"
                        onClick={() => navigate(`/report-card/${row.id}`)}
                        title="View Report Card"
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(row)} title="Edit">
                        <Edit className="h-4 w-4" />
                    </Button>
                    {row.status !== 'withdrawn' && (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeactivate(row.id, `${row.first_name} ${row.last_name}`)}
                            title="Deactivate / Withdraw"
                        >
                            <UserX className="h-4 w-4" />
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
                    <h2 className="text-3xl font-black tracking-tight text-text-primary">Student Registry</h2>
                    <p className="text-sm font-bold text-text-muted uppercase tracking-wider opacity-70">Manage enrollment, records and performance status</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto shadow-xl">
                    <Plus className="mr-2 h-5 w-5" /> Enroll New Student
                </Button>
            </div>

            {/* Filters & Search */}
            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:items-end">
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-1.5 px-1">
                                <Search className="h-3 w-3" /> Search Academic Records
                            </label>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Name or Admission No..."
                                    className="h-12 flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-bold focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-0"
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                />
                                <Button type="submit" variant="secondary" className="h-12 px-6 shrink-0">
                                    <Search className="h-4 w-4 sm:hidden" />
                                    <span className="hidden sm:inline">Execute Search</span>
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-1.5 px-1">
                                <GraduationCap className="h-3 w-3" /> Filter by Class
                            </label>
                            <select
                                className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-bold focus:border-primary focus:bg-card focus:outline-none transition-all"
                                value={filters.class_id}
                                onChange={e => setFilters({ ...filters, class_id: e.target.value })}
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Users className="h-3 w-3" /> Status
                            </label>
                            <select
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="graduated">Graduated</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="">All Statuses</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b px-6 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" /> Member Directory
                    </CardTitle>
                </CardHeader>
                <div className="p-0">
                    <DataTable
                        columns={columns}
                        data={data}
                        isLoading={loading}
                    />
                </div>
            </Card>

            <StudentForm
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={fetchStudents}
                studentToEdit={editingStudent}
            />
        </div>
    );
}

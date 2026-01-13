import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import { Plus, Trash2, BookOpen, AlertCircle, Loader2, CheckCircle2, XCircle, GraduationCap } from 'lucide-react';
import api from '../../services/api';

interface ClassItem {
    id: string;
    name: string;
}

interface SubjectItem {
    id: string;
    name: string;
    code: string;
    category: string;
    status: string;
}

interface AssignedSubject extends SubjectItem {
    assignment_id: string;
    is_compulsory: boolean;
}

export default function ClassSubjects() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
    const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Assign Modal
    const [showAssign, setShowAssign] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [assignForm, setAssignForm] = useState({
        subject_id: '',
        is_compulsory: true
    });

    useEffect(() => {
        api.get('/academic/classes').then(res => setClasses(res.data)).catch(console.error);
        api.get('/academic/subjects').then(res => setAllSubjects(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchClassSubjects();
        } else {
            setSubjects([]);
        }
    }, [selectedClass]);

    const fetchClassSubjects = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/academic/classes/${selectedClass}/subjects`);
            setSubjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass || !assignForm.subject_id) return;

        setFormError(null);
        setAssigning(true);
        try {
            await api.post(`/academic/classes/${selectedClass}/subjects`, assignForm);
            setShowAssign(false);
            setAssignForm({ subject_id: '', is_compulsory: true });
            fetchClassSubjects();
        } catch (error: any) {
            setFormError(error.response?.data?.error || 'Assignment failed');
        } finally {
            setAssigning(false);
        }
    };

    const handleRemove = async (assignmentId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from this class? This will not delete the subject from the library.`)) return;
        try {
            await api.delete(`/academic/class-subjects/${assignmentId}`);
            fetchClassSubjects();
        } catch (error) {
            alert('Failed to remove subject');
        }
    };

    const toggleCompulsory = async (subject: AssignedSubject) => {
        try {
            await api.patch(`/academic/class-subjects/${subject.assignment_id}`, {
                is_compulsory: !subject.is_compulsory
            });
            fetchClassSubjects();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    // Filter out subjects already assigned
    const availableSubjects = allSubjects.filter(
        s => s.status === 'active' && !subjects.find(as => as.id === s.id)
    );

    const columns = [
        {
            header: 'Mapping ID',
            cell: (row: AssignedSubject) => (
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                    {row.assignment_id.split('-')[0]}...
                </span>
            )
        },
        {
            header: 'Subject',
            cell: (row: AssignedSubject) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{row.name}</span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Code: {row.code || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Requirement',
            cell: (row: AssignedSubject) => (
                <button
                    onClick={() => toggleCompulsory(row)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 ${row.is_compulsory
                        ? 'bg-orange-50 text-orange-700 border-orange-100 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                >
                    {row.is_compulsory ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {row.is_compulsory ? 'Compulsory' : 'Elective'}
                </button>
            )
        },
        {
            header: 'Actions',
            cell: (row: AssignedSubject) => (
                <Button variant="danger" size="sm" onClick={() => handleRemove(row.assignment_id, row.name)} title="Remove from Class">
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Class Subject Mapping</h2>
                    <p className="text-sm text-slate-500">Define and manage the curriculum for each academic level</p>
                </div>
                {selectedClass && (
                    <Button onClick={() => setShowAssign(true)} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 shadow-md">
                        <Plus className="mr-2 h-4 w-4" /> Assign Library Subject
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm bg-primary-50/30">
                <CardContent className="pt-6">
                    <div className="max-w-md space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <GraduationCap className="h-3 w-3" /> Active Class Context
                        </label>
                        <select
                            className="h-12 w-full rounded-xl border border-primary-200 bg-white px-4 py-2 text-base font-bold text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 shadow-sm transition-all"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            <option value="">-- Choose a Class to Manage --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {selectedClass ? (
                <Card className="border-none shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="bg-white border-b px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                            <BookOpen className="h-5 w-5 text-primary-600" />
                            {classes.find(c => c.id === selectedClass)?.name} Curriculum
                        </CardTitle>
                        <div className="flex">
                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">
                                {subjects.length} Subjects Linked
                            </span>
                        </div>
                    </CardHeader>
                    <div className="p-0">
                        <DataTable columns={columns} data={subjects} isLoading={loading} />
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <p className="text-slate-500 font-medium">Please select a class to view and manage its subjects</p>
                </div>
            )}

            {/* Assign Modal */}
            <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 border-none">
                        Add Subject to {classes.find(c => c.id === selectedClass)?.name}
                    </DialogTitle>
                </DialogHeader>
                <DialogContent className="sm:max-w-[425px]">
                    <form id="assign-form" onSubmit={handleAssign} className="space-y-4 py-1">
                        {formError && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                                <AlertCircle className="h-4 w-4" />
                                <span>{formError}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Select Library Subject <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none h-10"
                                value={assignForm.subject_id}
                                onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                            >
                                <option value="">-- Select from Library --</option>
                                {availableSubjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 font-medium italic">
                                Only active subjects not already assigned will appear here.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <input
                                type="checkbox"
                                id="is_compulsory"
                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                checked={assignForm.is_compulsory}
                                onChange={e => setAssignForm({ ...assignForm, is_compulsory: e.target.checked })}
                            />
                            <div className="space-y-0.5 pointer-events-none">
                                <label htmlFor="is_compulsory" className="text-sm font-bold text-slate-800">Compulsory Subject</label>
                                <p className="text-xs text-slate-500">Uncheck if this is an elective or optional subject</p>
                            </div>
                        </div>
                    </form>
                </DialogContent>
                <DialogFooter className="bg-slate-50/50 px-6 py-3 rounded-b-xl border-t justify-center sm:justify-end">
                    <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
                    <Button type="submit" form="assign-form" disabled={assigning || !assignForm.subject_id} className="whitespace-nowrap min-w-fit">
                        {assigning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        Link Subject
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    );
}

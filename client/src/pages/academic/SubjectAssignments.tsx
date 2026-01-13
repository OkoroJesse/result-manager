
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/Core';
import { Save, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface Subject {
    id: string;
    name: string;
    level: string;
}

interface ClassItem {
    id: string;
    name: string;
    level: string;
}

export default function SubjectAssignments() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedClass, setSelectedClass] = useState('');

    // State for assignments
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContext();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchAssignments(selectedClass);
        } else {
            setAssignedIds(new Set());
        }
    }, [selectedClass]);

    const fetchContext = async () => {
        try {
            const [clsRes, subRes] = await Promise.all([
                api.get('/academic/classes'),
                api.get('/academic/subjects')
            ]);
            setClasses(clsRes.data);
            setSubjects(subRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAssignments = async (classId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/academic/classes/${classId}/subjects`);
            const ids = new Set(res.data.map((s: Subject) => s.id));
            setAssignedIds(ids as Set<string>);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignment = (subjectId: string) => {
        const newSet = new Set(assignedIds);
        if (newSet.has(subjectId)) {
            newSet.delete(subjectId);
        } else {
            newSet.add(subjectId);
        }
        setAssignedIds(newSet);
    };

    const handleSave = async () => {
        if (!selectedClass) return;
        setSaving(true);
        try {
            await api.post(`/academic/classes/${selectedClass}/subjects`, {
                subjectIds: Array.from(assignedIds)
            });
            alert('Assignments updated successfully');
        } catch (error) {
            alert('Failed to update assignments');
        } finally {
            setSaving(false);
        }
    };

    // Filter subjects by the level of the selected class (optional but helpful)
    const selectedClassDetails = classes.find(c => c.id === selectedClass);
    // Rough mapping for display filtering if needed, 
    // but user might want to assign any subject to any class, so we show all sorted by level.
    const groupedSubjects = subjects.reduce((acc, subject) => {
        const lvl = subject.level;
        if (!acc[lvl]) acc[lvl] = [];
        acc[lvl].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Class Assignments</h2>
                <Button onClick={() => selectedClass && fetchAssignments(selectedClass)} disabled={!selectedClass || loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Class</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        className="w-full max-w-md rounded border p-2 text-sm bg-white"
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                    >
                        <option value="">-- Choose a Class --</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name} ({cls.level})</option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {selectedClass && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Manage Subjects for <span className="text-primary-600">{selectedClassDetails?.name}</span></CardTitle>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {['PRIMARY', 'JSS', 'SSS'].map(level => (
                                groupedSubjects[level]?.length > 0 && (
                                    <div key={level} className="space-y-3">
                                        <h3 className="font-semibold text-slate-500 border-b pb-1">{level} Subjects</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {groupedSubjects[level].map(subj => (
                                                <div
                                                    key={subj.id}
                                                    className={`
                                                        flex items-center p-3 rounded border cursor-pointer transition-colors
                                                        ${assignedIds.has(subj.id) ? 'bg-primary-50 border-primary-200' : 'bg-white hover:bg-slate-50'}
                                                    `}
                                                    onClick={() => toggleAssignment(subj.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mr-3 h-4 w-4 rounded border-gray-300 text-primary-600"
                                                        checked={assignedIds.has(subj.id)}
                                                        onChange={() => { }} // handled by div click
                                                    />
                                                    <span className="text-sm font-medium">{subj.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/Core';
import { Save, Send, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Student {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    users?: {
        first_name: string;
        last_name: string;
    } | null;
}

interface ScoreEntry {
    student_id: string;
    name: string;
    score_ca: number;
    score_test: number;
    score_exam: number;
    total_score: number;
    grade: string;
    remark: string;
    status: 'draft' | 'submitted' | 'approved';
}

interface GradingScale {
    min_score: number;
    max_score: number;
    grade: string;
    remark: string;
}

export default function ResultEntry() {
    const { user, role } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [gradingScale, setGradingScale] = useState<GradingScale[]>([]);

    const [activeSession, setActiveSession] = useState<any>(null);
    const [activeTerm, setActiveTerm] = useState<any>(null);
    const [contextError, setContextError] = useState<string | null>(null);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        loadContext();
    }, [user?.id, role]);

    const loadContext = async () => {
        try {
            setContextError(null);

            // PRODUCTION-CRITICAL: Fetch Active Session/Term - REQUIRED
            const [sessRes, termRes] = await Promise.all([
                api.get('/academic/sessions/active'),
                api.get('/academic/terms/active'),
            ]);

            if (!sessRes.data) {
                throw new Error('No active academic session. Contact administrator to activate a session.');
            }
            if (!termRes.data) {
                throw new Error('No active term. Contact administrator to activate a term.');
            }

            setActiveSession(sessRes.data);
            setActiveTerm(termRes.data);

            // Fetch grading scales
            const scaleRes = await api.get('/results/grading-scales').catch(() => ({ data: [] }));
            setGradingScale(scaleRes.data.length > 0 ? scaleRes.data : [
                { min_score: 75, max_score: 100, grade: 'A1', remark: 'EXCELLENT' },
                { min_score: 70, max_score: 74, grade: 'B2', remark: 'VERY GOOD' },
                { min_score: 65, max_score: 69, grade: 'B3', remark: 'GOOD' },
                { min_score: 60, max_score: 64, grade: 'C4', remark: 'CREDIT' },
                { min_score: 55, max_score: 59, grade: 'C5', remark: 'CREDIT' },
                { min_score: 50, max_score: 54, grade: 'C6', remark: 'CREDIT' },
                { min_score: 45, max_score: 49, grade: 'D7', remark: 'PASS' },
                { min_score: 40, max_score: 44, grade: 'E8', remark: 'PASS' },
                { min_score: 0, max_score: 39, grade: 'F9', remark: 'FAIL' },
            ]);

            // PRODUCTION-CRITICAL: Fetch Teacher Assignments - STRICT
            const meRes = await api.get('/teachers/me');
            if (!meRes?.data) {
                throw new Error('Teacher profile not found. Contact administrator.');
            }

            const assignments = meRes.data.assignments || [];
            if (assignments.length === 0) {
                throw new Error('No class assignments found for current session. Contact administrator.');
            }

            // Extract unique classes from ACTIVE assignments only
            const classMap = new Map();
            assignments.forEach((a: any) => {
                // Backend already filters by active session and is_active=true
                if (a.classes) {
                    classMap.set(a.classes.id, a.classes);
                }
            });

            if (classMap.size === 0) {
                throw new Error('No active class assignments for current session.');
            }

            setClasses(Array.from(classMap.values()));

        } catch (error: any) {
            console.error('[ResultEntry.loadContext]', error);
            setContextError(error.message || 'Failed to load results context');
            setClasses([]);
            setSubjects([]);
            setActiveSession(null);
            setActiveTerm(null);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedClass]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get(`/academic/classes/${selectedClass}/subjects`);
            // If Teacher, only show assigned subjects
            const meRes = await api.get('/teachers/me').catch(() => null);
            if (meRes?.data) {
                const assignedSubjIds = meRes.data.assignments
                    .filter((a: any) => a.class_id === selectedClass)
                    .map((a: any) => (a.subjects.id));
                setSubjects(res.data.filter((s: any) => assignedSubjIds.includes(s.id)));
            } else {
                setSubjects(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedClass && selectedSubject && activeSession && activeTerm) {
            fetchScores();
        } else {
            setScores([]);
        }
    }, [selectedClass, selectedSubject]);

    const fetchScores = async () => {
        setLoading(true);
        setIsLocked(false);
        try {
            // PRODUCTION-CRITICAL: Get ACTIVE students only
            const studentsRes = await api.get(`/people/students`, {
                params: {
                    class_id: selectedClass,
                    status: 'active'
                }
            });

            const classStudents = studentsRes.data;

            if (!classStudents || classStudents.length === 0) {
                setScores([]);
                setLoading(false);
                alert('No active students enrolled in this class');
                return;
            }

            // 2. Get Results
            const res = await api.get('/results', {
                params: {
                    session_id: activeSession.id,
                    term_id: activeTerm.id,
                    class_id: selectedClass,
                    subject_id: selectedSubject
                }
            });
            const results = res.data;

            const merged = classStudents.map((s: Student) => {
                const r = results.find((res: any) => res.student_id === s.id);
                if (r && (r.status === 'submitted' || r.status === 'approved')) {
                    setIsLocked(true);
                }

                const score_ca = r?.score_ca || 0;
                const score_test = r?.score_test || 0;
                const score_exam = r?.score_exam || 0;
                const total = score_ca + score_test + score_exam;
                const grading = gradingScale.find(g => total >= g.min_score && total <= g.max_score);

                const studentName = s.users
                    ? `${s.users.first_name} ${s.users.last_name}`
                    : `${s.first_name} ${s.last_name}`;

                return {
                    student_id: s.id,
                    name: studentName,
                    score_ca,
                    score_test,
                    score_exam,
                    total_score: total,
                    grade: grading?.grade || 'F9',
                    remark: grading?.remark || 'FAIL',
                    status: r?.status || 'draft'
                };
            });

            setScores(merged);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (sid: string, field: 'score_ca' | 'score_test' | 'score_exam', val: string) => {
        if (isLocked) return;
        const num = Math.max(0, Math.min(field === 'score_ca' || field === 'score_exam' ? 40 : 20, Number(val)));

        setScores(prev => prev.map(s => {
            if (s.student_id === sid) {
                const updated = { ...s, [field]: num };
                updated.total_score = updated.score_ca + updated.score_test + updated.score_exam;
                const grading = gradingScale.find(g => updated.total_score >= g.min_score && updated.total_score <= g.max_score);
                updated.grade = grading?.grade || 'F9';
                updated.remark = grading?.remark || 'FAIL';
                return updated;
            }
            return s;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = scores.map(s => api.post('/results', {
                student_id: s.student_id,
                class_id: selectedClass,
                subject_id: selectedSubject,
                session_id: activeSession.id,
                term_id: activeTerm.id,
                score_ca: s.score_ca,
                score_test: s.score_test,
                score_exam: s.score_exam
            }));
            await Promise.all(promises);
            alert('Draft saved successfully!');
            fetchScores();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!confirm('Submit results for approval? This will lock entries from further editing.')) return;
        setSubmitting(true);
        try {
            // PRODUCTION-CRITICAL: Get teacher ID for ownership validation
            const meRes = await api.get('/teachers/me');
            if (!meRes?.data?.id) {
                throw new Error('Teacher ID not found');
            }

            await api.post('/results/submit', {
                session_id: activeSession.id,
                term_id: activeTerm.id,
                class_id: selectedClass,
                subject_id: selectedSubject,
                teacher_id: meRes.data.id  // REQUIRED for backend validation
            });
            alert('Results submitted successfully and locked for editing!');
            setIsLocked(true);
            fetchScores();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (contextError) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-10 bg-red-50/50 rounded-2xl border border-red-100">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h3 className="text-xl font-bold text-red-900">Academic Context Restricted</h3>
                <p className="text-red-700 max-w-md">{contextError}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Result Entry Ledger</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600" />
                        {activeSession?.name} • {activeTerm?.name}
                    </p>
                </div>
                {selectedSubject && (
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleSave}
                            disabled={loading || saving || submitting || isLocked}
                            className="bg-white"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Draft
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || saving || submitting || isLocked}
                            className="shadow-md"
                        >
                            {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit for Approval
                        </Button>
                    </div>
                )}
            </div>

            <Card className="border-none shadow-sm bg-slate-50/50">
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Class</label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            <option value="">-- Choose Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Subject</label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            disabled={!selectedClass}
                        >
                            <option value="">-- Choose Subject --</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {selectedClass && selectedSubject ? (
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-white border-b px-6 py-4 flex justify-between items-center">
                        <CardTitle className="text-lg font-bold text-slate-800">Student Score Sheet</CardTitle>
                        {isLocked && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold">
                                <Lock className="h-3 w-3" /> ENTRIES LOCKED (SUBMITTED/APPROVED)
                            </div>
                        )}
                    </CardHeader>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Student Name</th>
                                    <th className="px-6 py-4 text-center w-28">CA (40)</th>
                                    <th className="px-6 py-4 text-center w-28">TEST (20)</th>
                                    <th className="px-6 py-4 text-center w-28">EXAM (40)</th>
                                    <th className="px-6 py-4 text-center w-20">Total</th>
                                    <th className="px-6 py-4 text-center w-20">Grade</th>
                                    <th className="px-6 py-4 text-center w-32">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scores.map(s => (
                                    <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                disabled={isLocked}
                                                className="w-full text-center h-9 rounded-md border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                                                value={s.score_ca}
                                                onChange={e => handleScoreChange(s.student_id, 'score_ca', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                disabled={isLocked}
                                                className="w-full text-center h-9 rounded-md border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                                                value={s.score_test}
                                                onChange={e => handleScoreChange(s.student_id, 'score_test', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                disabled={isLocked}
                                                className="w-full text-center h-9 rounded-md border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 disabled:bg-slate-50 disabled:text-slate-400 font-medium"
                                                value={s.score_exam}
                                                onChange={e => handleScoreChange(s.student_id, 'score_exam', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-600">{s.total_score}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-black text-base ${s.grade.startsWith('A') || s.grade.startsWith('B') ? 'text-green-600' :
                                                s.grade.startsWith('F') ? 'text-red-500' : 'text-primary-600'
                                                }`}>
                                                {s.grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-400">
                                            {s.remark}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                    <Loader2 className={`h-8 w-8 mb-4 ${loading ? 'animate-spin' : ''}`} />
                    <p className="font-medium">{loading ? 'Loading Ledger...' : 'Select Class and Subject to load Score Sheet'}</p>
                </div>
            )}
        </div>
    );
}

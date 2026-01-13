import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '../../components/ui/Core';
import { Printer, ArrowLeft, Loader2, FileSearch, ShieldCheck, Search } from 'lucide-react';
import api from '../../services/api';
import { ReportCardTemplate } from '../../components/reports/ReportCardTemplate';

export default function StudentReport() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [sessions, setSessions] = useState<any[]>([]);
    const [terms, setTerms] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    // Student Selection State (for when studentId is missing)
    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if (!studentId && studentSearch.length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const res = await api.get(`/people/students?search=${studentSearch}&status=active`);
                    setSearchResults(res.data);
                } catch (err) {
                    console.error('Search failed', err);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [studentSearch, studentId]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [sRes, tRes] = await Promise.all([
                    api.get('/academic/sessions'),
                    api.get('/academic/terms')
                ]);
                setSessions(sRes.data);
                setTerms(tRes.data);

                // Auto-select active session/term
                const activeS = sRes.data.find((x: any) => x.is_active);
                const activeT = tRes.data.find((x: any) => x.is_active);
                if (activeS) setSelectedSession(activeS.id);
                if (activeT) setSelectedTerm(activeT.id);
            } catch (err) {
                console.error('Failed to load initial report data:', err);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (studentId && selectedSession && selectedTerm) {
            fetchReport();
        }
    }, [studentId, selectedSession, selectedTerm]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/report-cards/${studentId}`, {
                params: { session_id: selectedSession, term_id: selectedTerm }
            });
            setReportData(res.data);
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to load report';
            setError(msg);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 print:bg-white print:p-0">
            {/* 🛠️ Top Control Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 mb-8 print:hidden">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="bg-white shrink-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <h1 className="text-[11px] xs:text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2 text-right md:text-left">
                            <span className="hidden xs:inline italic text-slate-400 font-medium whitespace-nowrap">Portal /</span>
                            <span className="whitespace-nowrap">Report Explorer</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 overflow-hidden min-w-0 flex-1 sm:flex-initial">
                            <select
                                className="bg-transparent text-[10px] font-bold px-2 py-1 focus:outline-none min-w-[80px] sm:min-w-[120px] truncate"
                                value={selectedSession}
                                onChange={e => setSelectedSession(e.target.value)}
                            >
                                <option value="">Session...</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <div className="w-[1px] bg-slate-300 mx-1 shrink-0" />
                            <select
                                className="bg-transparent text-[10px] font-bold px-2 py-1 focus:outline-none min-w-[70px] sm:min-w-[100px] truncate"
                                value={selectedTerm}
                                onChange={e => setSelectedTerm(e.target.value)}
                            >
                                <option value="">Term...</option>
                                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <Button
                            disabled={!reportData}
                            variant="primary"
                            size="sm"
                            onClick={() => window.print()}
                            className="shadow-sm"
                        >
                            <Printer className="mr-2 h-4 w-4" /> Print Record
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 print:p-0">
                {loading ? (
                    <Card className="border-none shadow-none bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
                            <p className="text-slate-500 font-medium animate-pulse">Compiling Academic Record...</p>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                            <FileSearch className="h-10 w-10 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">No Report Available</h2>
                        <p className="max-w-sm text-slate-500 text-sm mb-8">
                            {error.includes('No approved results')
                                ? "Results for this period have not been fully approved by the academy administration yet."
                                : error}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => navigate(-1)}>
                                Return to List
                            </Button>
                        </div>
                    </div>
                ) : studentId ? (
                    reportData ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 🛡️ Integrity Badge */}
                            <div className="flex items-center justify-center gap-2 mb-2 print:hidden">
                                <ShieldCheck className="text-green-600 w-4 h-4" />
                                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                                    Official Digital Record • Verified by Registrar
                                </span>
                            </div>

                            {/* The Actual Printable Template */}
                            <ReportCardTemplate data={reportData} />
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium italic">Preparing your academic dossier...</p>
                        </div>
                    )
                ) : (
                    <div className="max-w-2xl mx-auto py-12">
                        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                            <CardContent className="pt-8 text-center">
                                <FileSearch className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Generate Report Card</h3>
                                <p className="text-slate-500 text-sm mb-8">Select a student from the directory to examine their academic performance for the selected term.</p>

                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or admission number..."
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                    />
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-2 text-left max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {searchResults.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => navigate(`/report-card/${s.id}`)}
                                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all group"
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                        {s.last_name}, {s.first_name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black">{s.admission_number} • {s.classes?.name}</p>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600">
                                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <Button variant="secondary" className="w-full" onClick={() => navigate('/students')}>
                                        Go to Student Directory
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

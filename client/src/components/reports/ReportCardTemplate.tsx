import { MapPin, Phone, Mail, Award, TrendingUp } from 'lucide-react';

export interface ReportData {
    student: {
        name: string;
        admission_number: string;
        class: string;
        dob?: string;
        address?: string;
    };
    summary: {
        average: number;
        position: number;
        class_size: number;
        total_subjects: number;
        total_score: number;
    };
    results: Array<{
        subject_name: string;
        subject_code?: string;
        ca: number;
        test: number;
        exam: number;
        total: number;
        grade: string;
        remark?: string;
    }>;
    session: string;
    term: string;
}

interface ReportCardTemplateProps {
    data: ReportData;
}

export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
    return (
        <div className="w-full pb-10 print:pb-0">
            <div className="mx-auto w-full md:w-[210mm] min-h-0 md:min-h-[297mm] bg-white p-4 xs:p-6 sm:p-10 md:p-[15mm] shadow-xl md:shadow-2xl print:w-full print:shadow-none print:p-[10mm] border-t-[8px] md:border-t-[12px] border-primary-900 font-serif">
                {/* 🏫 School Identity */}
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start border-b-2 border-slate-900 pb-4 sm:pb-6 mb-6 sm:mb-8 gap-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-900 rounded-full flex items-center justify-center text-white shrink-0">
                            <Award className="w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tighter leading-tight">Bright Future Academy</h1>
                            <p className="text-secondary-600 font-bold italic text-xs sm:text-sm tracking-widest">Excellence • Integrity • Service</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right text-[10px] text-slate-500 font-sans space-y-1">
                        <p className="flex items-center justify-center sm:justify-end gap-1"><MapPin size={10} /> 19 Olafisoye Avenue Chikakore Kubwa Abuja</p>
                        <p className="flex items-center justify-center sm:justify-end gap-1"><Phone size={10} /> 08163321478</p>
                        <p className="flex items-center justify-center sm:justify-end gap-1"><Mail size={10} /> registrar@brightfuture.sch.ng</p>
                    </div>
                </div>

                {/* 📑 Report Identification */}
                <div className="bg-slate-900 text-white text-center py-2 mb-6 sm:mb-8 uppercase tracking-[0.1em] sm:tracking-[0.3em] font-bold text-sm sm:text-lg">
                    Official Academic Term Report
                </div>

                {/* 👤 Student Biometrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-10 text-xs sm:text-sm font-sans">
                    <div className="sm:col-span-2 space-y-2 sm:space-y-3">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-24 sm:w-32 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Student Name</span>
                            <span className="font-bold text-slate-900 uppercase">{data.student.name}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-24 sm:w-32 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Admission No</span>
                            <span className="font-bold text-slate-900">{data.student.admission_number}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-24 sm:w-32 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Class / Level</span>
                            <span className="font-bold text-slate-900">{data.student.class}</span>
                        </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-20 sm:w-24 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Session</span>
                            <span className="font-bold text-slate-900">{data.session}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-20 sm:w-24 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Term</span>
                            <span className="font-bold text-slate-900 uppercase">{data.term}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-20 sm:w-24 text-slate-500 font-semibold uppercase text-[9px] sm:text-[10px]">Printed</span>
                            <span className="font-semibold text-slate-600">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* 📊 Academic Results */}
                <div className="mb-8 sm:mb-10 font-sans overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="w-full text-[10px] sm:text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 border-y-2 border-slate-900">
                                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-black uppercase text-[9px] sm:text-[11px]">Subject Area</th>
                                    <th className="px-1 sm:px-2 py-2 sm:py-3 w-10 sm:w-16 text-center font-bold text-[8px] sm:text-[10px]">CA</th>
                                    <th className="px-1 sm:px-2 py-2 sm:py-3 w-10 sm:w-16 text-center font-bold text-[8px] sm:text-[10px]">Test</th>
                                    <th className="px-1 sm:px-2 py-2 sm:py-3 w-10 sm:w-16 text-center font-bold text-[8px] sm:text-[10px]">Exam</th>
                                    <th className="px-1 sm:px-2 py-2 sm:py-3 w-12 sm:w-20 text-center font-black text-[9px] sm:text-[11px] bg-slate-200">Total</th>
                                    <th className="px-1 sm:px-2 py-2 sm:py-3 w-10 sm:w-16 text-center font-black text-[9px] sm:text-[11px]">Grd</th>
                                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-bold text-[8px] sm:text-[10px] hidden xs:table-cell">Assessment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.results.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-slate-800">{r.subject_name}</td>
                                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-center text-slate-600 tabular-nums">{r.ca}</td>
                                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-center text-slate-600 tabular-nums">{r.test}</td>
                                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-center text-slate-600 tabular-nums">{r.exam}</td>
                                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-center font-black bg-slate-50/50 tabular-nums">{r.total}</td>
                                        <td className={`px-1 sm:px-2 py-2 sm:py-3 text-center font-black ${r.grade.startsWith('A') ? 'text-green-700' :
                                            r.grade.startsWith('F') ? 'text-red-700' : 'text-primary-700'
                                            }`}>{r.grade}</td>
                                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-[9px] uppercase font-semibold text-slate-500 italic leading-tight hidden xs:table-cell">
                                            {r.remark || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🏁 Performance Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 mb-8 sm:mb-12 font-sans">
                    <div className="border-2 border-slate-900 p-4 sm:p-6 rounded-sm bg-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <TrendingUp size={48} />
                        </div>
                        <h3 className="font-black uppercase text-[10px] sm:text-[12px] border-b border-slate-300 pb-2 sm:pb-3 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-secondary-600" /> Executive summary
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4">
                            <div className="space-y-1">
                                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-bold">Total Weighted Score</p>
                                <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-900">{data.summary.total_score}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-bold">Term Average</p>
                                <p className="text-xl sm:text-2xl font-black tabular-nums text-primary-700">{data.summary.average}%</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-200">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-bold">Subject Count</p>
                                        <p className="text-xs sm:text-base font-bold text-slate-700">{data.summary.total_subjects} Offered</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-bold">Class Standing</p>
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-lg sm:text-2xl font-black bg-slate-900 text-white px-2 py-0.5 rounded-sm">
                                                {data.summary.position}<sup>{
                                                    data.summary.position === 1 ? 'st' :
                                                        data.summary.position === 2 ? 'nd' :
                                                            data.summary.position === 3 ? 'rd' : 'th'
                                                }</sup>
                                            </span>
                                            <span className="text-[9px] sm:text-xs font-bold text-slate-400">out of {data.summary.class_size}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between gap-6">
                        <div className="border border-slate-200 p-4 rounded-sm bg-white min-h-[80px]">
                            <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 mb-2">School's Comment</h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-700 font-serif leading-relaxed italic">
                                An outstanding academic performance. The student demonstrates a high level of proficiency and
                                dedication across all disciplines. We encourage continued focus to maintain this trajectory.
                            </p>
                        </div>

                        <div className="flex justify-between items-end pb-2 gap-4">
                            <div className="text-center flex-1 border-t border-slate-900 pt-1">
                                <p className="text-[7px] sm:text-[8px] font-bold uppercase text-slate-500">Class Teacher</p>
                            </div>
                            <div className="text-center flex-1 border-t border-slate-900 pt-1">
                                <p className="text-[7px] sm:text-[8px] font-bold uppercase text-slate-500">Principal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📋 Footer */}
                <div className="text-center text-[8px] text-slate-400 border-t border-slate-100 pt-4 font-sans">
                    This is a computer-generated academic record. Validated by the Bright Future Academy Registrar.
                    Document Key: {data.student.admission_number.replace(/\//g, '')}-{data.session.replace(/-/g, '')}-TC
                </div>
            </div>
        </div>
    );
}

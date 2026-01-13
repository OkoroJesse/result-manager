import { supabase } from '../config/supabase';
import { ResultCalculator } from '../utils/resultCalculator';

export const ReportCardService = {
    async getStudentReport(studentId: string, sessionId: string, termId: string) {
        // 1. Fetch Student, Class, Session & Term Meta
        const [studentRes, sessionRes, termRes] = await Promise.all([
            supabase
                .from('students')
                .select(`
                    *,
                    class:classes(*),
                    user:users(first_name, last_name)
                `)
                .eq('id', studentId)
                .single(),
            supabase.from('sessions').select('name').eq('id', sessionId).single(),
            supabase.from('terms').select('name').eq('id', termId).single()
        ]);

        if (studentRes.error || !studentRes.data) throw new Error('Student not found');
        const student = studentRes.data;

        // 2. Fetch Student's Approved Results
        const { data: results, error: resultsError } = await supabase
            .from('results')
            .select(`
                *,
                subject:subjects(name, code, is_elective)
            `)
            .eq('student_id', studentId)
            .eq('session_id', sessionId)
            .eq('term_id', termId)
            .eq('status', 'approved'); // CRITICAL: Only Approved Results

        if (resultsError) throw new Error('Failed to fetch results');
        if (!results || results.length === 0) throw new Error('No approved results found for this period');

        // 3. Fetch Class cohort (For Position)
        // We aggregate averages for all students in the same class/session/term with approved results.
        const { data: classResults, error: classError } = await supabase
            .from('results')
            .select('student_id, total_score')
            .eq('class_id', student.class_id) // Current class
            .eq('session_id', sessionId)
            .eq('term_id', termId)
            .eq('status', 'approved');

        if (classError) throw new Error('Failed to fetch class context');

        // 4. Calculate Averages & Positions
        const studentTotals = new Map<string, number[]>();
        classResults?.forEach(r => {
            const current = studentTotals.get(r.student_id) || [];
            current.push(Number(r.total_score));
            studentTotals.set(r.student_id, current);
        });

        const studentAverages = Array.from(studentTotals.entries()).map(([sId, scores]) => ({
            id: sId,
            score: ResultCalculator.calculateAverage(scores)
        }));

        const positions = ResultCalculator.calculatePositions(studentAverages);

        // 5. Aggregate Current Student Data
        const myAverage = ResultCalculator.calculateAverage(results.map(r => Number(r.total_score)));
        const myPosition = positions.get(studentId) || 0;
        const totalStudents = studentTotals.size;

        return {
            student: {
                name: `${student.first_name || student.user?.first_name || 'Student'} ${student.last_name || student.user?.last_name || ''}`,
                admission_number: student.admission_number,
                class: student.class.name,
                dob: student.dob,
                address: student.address
            },
            summary: {
                average: myAverage,
                position: myPosition,
                class_size: totalStudents,
                total_subjects: results.length,
                total_score: results.reduce((sum, r) => sum + Number(r.total_score), 0)
            },
            results: results.map(r => ({
                id: r.id,
                subject_name: r.subject.name,
                subject_code: r.subject.code,
                ca: r.score_ca,
                test: r.score_test,
                exam: r.score_exam,
                total: r.total_score,
                grade: r.grade,
                remark: r.remark
            })),
            session: sessionRes.data?.name || 'N/A',
            term: termRes.data?.name || 'N/A'
        };
    }
};

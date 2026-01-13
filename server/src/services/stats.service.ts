import { supabase } from '../config/supabase';

export const StatsService = {
    async getDashboardStats() {
        // 1. Get Active Context
        const { data: activeSession } = await supabase
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();

        let activeTerm = null;
        if (activeSession) {
            const { data: term } = await supabase
                .from('terms')
                .select('*')
                .eq('is_active', true)
                .eq('session_id', activeSession.id)
                .maybeSingle();
            activeTerm = term;
        }

        // 2. Fetch Core Counts
        const [
            { count: studentCount },
            { count: teacherCount },
            { count: classCount }
        ] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('teachers').select('*', { count: 'exact', head: true }),
            supabase.from('classes').select('*', { count: 'exact', head: true })
        ]);

        // If no active session/term, return minimal data
        if (!activeSession || !activeTerm) {
            return {
                totalStudents: studentCount || 0,
                totalTeachers: teacherCount || 0,
                totalClasses: classCount || 0,
                activeSession: activeSession || null,
                activeTerm: activeTerm || null,
                workflow: { draft: 0, submitted: 0, approved: 0, rejected: 0 },
                performance: [],
                teacherActivity: [],
                alerts: []
            };
        }

        // 3. Workflow Stats
        // We calculate this from the results table for current session/term
        const { data: results } = await supabase
            .from('results')
            .select('status, total_score, grade, class_id, teacher_id, updated_at')
            .eq('session_id', activeSession.id)
            .eq('term_id', activeTerm.id);

        const workflow = {
            draft: results?.filter(r => r.status === 'draft').length || 0,
            submitted: results?.filter(r => r.status === 'submitted').length || 0,
            approved: results?.filter(r => r.status === 'approved').length || 0,
            rejected: results?.filter(r => r.status === 'rejected' || r.status === 'returned').length || 0
        };

        // 4. Academic Performance Analytics
        // Group results by class
        const { data: classes } = await supabase.from('classes').select('id, name');
        const performance = (classes || []).map(cls => {
            const classResults = results?.filter(r => r.class_id === cls.id) || [];
            const avg = classResults.length > 0
                ? classResults.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0) / classResults.length
                : 0;
            const passCount = classResults.filter(r => r.grade && !r.grade.startsWith('F')).length;
            const passRate = classResults.length > 0 ? (passCount / classResults.length) * 100 : 0;

            return {
                className: cls.name,
                average: Math.round(avg * 10) / 10,
                passRate: Math.round(passRate),
                totalResults: classResults.length
            };
        }).sort((a, b) => b.average - a.average);

        // 5. Teacher Activity Insights
        const { data: teachers } = await supabase
            .from('teachers')
            .select(`
                id, 
                first_name, 
                last_name,
                assignments:teacher_assignments(id, class_id, subject_id)
            `)
            .eq('status', 'active');

        const teacherActivity = (teachers || []).map(t => {
            const teacherResults = results?.filter(r => r.teacher_id === t.id) || [];
            const lastActivity = teacherResults.length > 0
                ? new Date(Math.max(...teacherResults.map(r => new Date(r.updated_at).getTime())))
                : null;

            return {
                name: `${t.first_name} ${t.last_name}`,
                assignmentCount: t.assignments?.length || 0,
                resultsEntered: teacherResults.length,
                pendingApproval: teacherResults.filter(r => r.status === 'submitted').length,
                lastActivity: lastActivity ? lastActivity.toISOString() : null
            };
        });

        // 6. System Alerts
        const alerts: { type: 'error' | 'warning' | 'info'; message: string }[] = [];

        // Classes with no results
        const emptyClasses = performance.filter(p => p.totalResults === 0);
        if (emptyClasses.length > 0) {
            alerts.push({
                type: 'warning',
                message: `${emptyClasses.length} classes have no results entered yet.`
            });
        }

        // Pending approval beyond timeframe (e.g. 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const staleResults = results?.filter(r => r.status === 'submitted' && new Date(r.updated_at) < threeDaysAgo);
        if (staleResults && staleResults.length > 0) {
            alerts.push({
                type: 'error',
                message: `${staleResults.length} results are pending approval for more than 3 days.`
            });
        }

        // Subjects without teachers (Active session only)
        const { data: unassignedSubjects } = await supabase
            .from('subjects')
            .select('id, name')
            .not('id', 'in', `(${(await supabase.from('teacher_assignments').select('subject_id').eq('academic_session_id', activeSession.id)).data?.map(a => a.subject_id).join(',') || 'NULL'})`);

        if (unassignedSubjects && unassignedSubjects.length > 0) {
            alerts.push({
                type: 'error',
                message: `${unassignedSubjects.length} subjects have no assigned teachers for this session.`
            });
        }

        return {
            totalStudents: studentCount || 0,
            totalTeachers: teacherCount || 0,
            totalClasses: classCount || 0,
            activeSession: activeSession || null,
            activeTerm: activeTerm || null,
            workflow,
            performance,
            teacherActivity,
            alerts
        };
    }
};

import { supabase } from '../config/supabase';

export const AssignmentService = {
    async checkAssignment(teacherId: string, classId: string, subjectId: string) {
        const { data, error } = await supabase
            .from('teacher_assignments')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .single();

        if (error || !data) return false;
        return true;
    },

    async assign(teacherId: string, classId: string, subjectId: string) {
        const { data, error } = await supabase
            .from('teacher_assignments')
            .insert({ teacher_id: teacherId, class_id: classId, subject_id: subjectId })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

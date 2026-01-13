import { useState, useEffect } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import api from '../../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface StudentFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    studentToEdit?: any | null;
}

export default function StudentForm({ open, onOpenChange, onSuccess, studentToEdit }: StudentFormProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingClasses, setFetchingClasses] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        admission_number: '',
        gender: '',
        class_id: '',
        dob: '',
        status: 'active'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setErrors({});
            fetchClasses();
            if (studentToEdit) {
                setFormData({
                    first_name: studentToEdit.first_name || '',
                    last_name: studentToEdit.last_name || '',
                    admission_number: studentToEdit.admission_number || '',
                    gender: studentToEdit.gender || '',
                    class_id: studentToEdit.class_id || '',
                    dob: studentToEdit.dob ? studentToEdit.dob.split('T')[0] : '',
                    status: studentToEdit.status || 'active'
                });
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    admission_number: '',
                    gender: '',
                    class_id: '',
                    dob: '',
                    status: 'active'
                });
            }
        }
    }, [open, studentToEdit]);

    const fetchClasses = async () => {
        setFetchingClasses(true);
        try {
            const res = await api.get('/academic/classes');
            setClasses(res.data);
        } catch (err) {
            console.error('Failed to fetch classes', err);
        } finally {
            setFetchingClasses(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.admission_number.trim()) newErrors.admission_number = 'Admission number is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.class_id) newErrors.class_id = 'Class selection is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setErrors({});

        try {
            if (studentToEdit) {
                // Remove admission_number from update as per requirement "Cannot change admission number after creation"
                const { admission_number, ...updates } = formData;
                await api.put(`/people/students/${studentToEdit.id}`, updates);
            } else {
                await api.post('/people/students', formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to save student record';
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = formData.first_name && formData.last_name && formData.admission_number && formData.class_id && formData.gender;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogTitle className="text-xl font-bold text-text-primary">
                    {studentToEdit ? 'Edit Student Record' : 'Enroll New Student'}
                </DialogTitle>
            </DialogHeader>
            <DialogContent className="sm:max-w-[500px]">
                <form id="student-form" onSubmit={handleSubmit} className="space-y-4 py-2">
                    {errors.form && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.form}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">First Name <span className="text-red-500">*</span></label>
                            <input
                                className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.first_name ? 'border-red-300' : 'border-border'}`}
                                value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Enter first name"
                            />
                            {errors.first_name && <p className="text-[10px] font-medium text-red-500">{errors.first_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Last Name <span className="text-red-500">*</span></label>
                            <input
                                className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.last_name ? 'border-red-300' : 'border-border'}`}
                                value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Enter last name"
                            />
                            {errors.last_name && <p className="text-[10px] font-medium text-red-500">{errors.last_name}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-primary">Admission Number <span className="text-red-500">*</span></label>
                        <input
                            className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.admission_number ? 'border-red-300' : 'border-border'} ${studentToEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                            value={formData.admission_number}
                            onChange={e => setFormData({ ...formData, admission_number: e.target.value })}
                            placeholder="e.g. ADM/2024/001"
                            disabled={!!studentToEdit}
                        />
                        {studentToEdit && <p className="text-[10px] text-text-muted italic px-1">Admission identity is immutable</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Gender <span className="text-red-500">*</span></label>
                            <select
                                className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.gender ? 'border-red-300' : 'border-border'}`}
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            {errors.gender && <p className="text-[10px] font-medium text-red-500">{errors.gender}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Date of Birth</label>
                            <input
                                type="date"
                                className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.dob ? 'border-red-300' : 'border-border'}`}
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                            />
                            {errors.dob && <p className="text-[10px] font-medium text-red-500">{errors.dob}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Class <span className="text-red-500">*</span></label>
                            <select
                                className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.class_id ? 'border-red-300' : 'border-border'}`}
                                value={formData.class_id}
                                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                disabled={fetchingClasses}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.class_id && <p className="text-[10px] font-medium text-red-500">{errors.class_id}</p>}
                        </div>
                        {studentToEdit && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-primary">Status</label>
                                <select
                                    className={`w-full h-12 rounded-xl border bg-secondary/50 px-4 py-2 text-sm font-bold transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 ${errors.status ? 'border-red-300' : 'border-border'}`}
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="withdrawn">Withdrawn</option>
                                </select>
                                {errors.status && <p className="text-[10px] font-medium text-red-500">{errors.status}</p>}
                            </div>
                        )}
                    </div>
                </form>
            </DialogContent>
            <DialogFooter className="bg-secondary/40 px-6 py-4 rounded-b-xl border-t border-border">
                <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                <Button
                    type="submit"
                    form="student-form"
                    disabled={loading || !isFormValid}
                    className="shadow-xl px-8"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (studentToEdit ? 'Finalize Updates' : 'Authorize Enrollment')}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}

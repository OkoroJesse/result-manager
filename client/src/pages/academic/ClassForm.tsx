import { useState, useEffect } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Core';
import api from '../../services/api';

interface ClassFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    classToEdit?: any | null;
}

export default function ClassForm({ open, onOpenChange, onSuccess, classToEdit }: ClassFormProps) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<{ name: string, category: string, order: string | number, is_active: boolean }>({
        name: '',
        category: 'PRI',
        order: '',
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setErrors({});
            if (classToEdit) {
                setFormData({
                    name: classToEdit.name || '',
                    category: classToEdit.category || classToEdit.level || 'PRI',
                    order: classToEdit.order ?? classToEdit.numeric_level ?? '',
                    is_active: classToEdit.is_active ?? true
                });
            } else {
                setFormData({ name: '', category: 'PRI', order: '', is_active: true });
            }
        }
    }, [open, classToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Class name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.order) newErrors.order = 'Order is required';
        else if (isNaN(Number(formData.order)) || Number(formData.order) < 1) newErrors.order = 'Must be a positive number';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setErrors({});

        try {
            const payload = {
                ...formData,
                order: Number(formData.order)
            };

            if (classToEdit) {
                await api.put(`/academic/classes/${classToEdit.id}`, payload);
            } else {
                await api.post('/academic/classes', payload);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Failed to save class';
            setErrors({ form: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{classToEdit ? 'Edit Class' : 'Create Class'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.form && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                            {errors.form}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Class Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Primary 1"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="PRI">Primary</option>
                                <option value="JSS">JSS</option>
                                <option value="SSS">SSS</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sorting Order</label>
                            <input
                                type="number"
                                placeholder="1-12"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                            />
                            {errors.order && <span className="text-xs text-red-500">{errors.order}</span>}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active Class</label>
                    </div>

                    <DialogFooter className="justify-center sm:justify-end">
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="whitespace-nowrap min-w-fit">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

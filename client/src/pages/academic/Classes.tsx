import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/Core';
import { DataTable } from '../../components/ui/DataTable';
import ClassForm from './ClassForm';
import api from '../../services/api';
import { Plus } from 'lucide-react';

interface ClassItem {
    id: string;
    name: string;
    category: 'PRI' | 'JSS' | 'SSS';
    order: number;
    is_active: boolean;
    _count?: {
        students: number;
    }
}

export default function Classes() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/academic/classes');
            // Sort by order or numeric_level (dual support)
            const sorted = (res.data as any[]).sort((a, b) => {
                const orderA = a.order ?? a.numeric_level ?? 0;
                const orderB = b.order ?? b.numeric_level ?? 0;
                return orderA - orderB;
            });
            setClasses(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/academic/classes/${id}`, { is_active: !currentStatus });
            fetchClasses();
        } catch (error) {
            alert('Failed to update class status');
        }
    };

    const columns = [
        {
            header: 'Order',
            accessorKey: 'order' as keyof ClassItem,
            cell: (row: any) => row.order ?? row.numeric_level ?? 0
        },
        { header: 'Class Name', accessorKey: 'name' as keyof ClassItem },
        {
            header: 'Category',
            accessorKey: 'category' as keyof ClassItem,
            cell: (row: any) => {
                const cat = row.category || row.level || 'N/A';
                return <span className="capitalize">{cat.toLowerCase()}</span>;
            }
        },
        {
            header: 'Status',
            cell: (row: ClassItem) => (
                row.is_active
                    ? <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Active</span>
                    : <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Inactive</span>
            )
        },
        {
            header: 'Actions',
            cell: (row: ClassItem) => (
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => {
                        setEditingClass(row);
                        setIsAddModalOpen(true);
                    }}>
                        Edit
                    </Button>
                    <Button
                        variant={row.is_active ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleDeactivate(row.id, row.is_active)}
                    >
                        {row.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Classes</h2>
                    <p className="text-slate-500 text-sm">Manage student levels and promotion order.</p>
                </div>
                <Button onClick={() => {
                    setEditingClass(null);
                    setIsAddModalOpen(true);
                }} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Academic Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={classes}
                        isLoading={loading}
                    />
                </CardContent>
            </Card>

            <ClassForm
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={fetchClasses}
                classToEdit={editingClass}
            />
        </div>
    );
}

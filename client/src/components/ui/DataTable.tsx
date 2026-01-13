import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';


interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    className?: string;
}

export function DataTable<T extends { id: string | number }>({ columns, data, onRowClick, isLoading, className }: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-text-muted bg-card rounded-main border border-border shadow-soft">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="font-bold text-sm uppercase tracking-widest">Optimizing Data View...</span>
            </div>
        );
    }

    return (
        <div className={cn("overflow-hidden rounded-main border border-border bg-card shadow-soft transition-all duration-300", className)}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-secondary/50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.15em] text-text-muted whitespace-nowrap"
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-transparent">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-16 text-center text-sm font-bold text-text-muted italic">
                                    No records found in the current context.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "transition-all duration-200 group",
                                        onRowClick ? "cursor-pointer hover:bg-primary/[0.03]" : "hover:bg-secondary/30"
                                    )}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className="whitespace-nowrap px-6 py-4 text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                                            {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from './Core';

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label?: string;
    };
    subValue?: string;
    className?: string;
}

export const KPICard = ({ title, value, icon: Icon, trend, subValue, className }: KPICardProps) => {
    return (
        <Card className={cn("relative group hover:border-primary/50 transition-all duration-500", className)}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted transition-colors group-hover:text-primary">
                        {title}
                    </span>
                    {Icon && (
                        <div className="p-2.5 rounded-xl bg-secondary/50 text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                            <Icon size={18} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-3xl font-black tracking-tight text-text-primary">
                        {value}
                    </span>

                    <div className="flex items-center gap-2">
                        {trend && (
                            <span className={cn(
                                "flex items-center text-[11px] font-black px-2 py-0.5 rounded-full",
                                trend.value >= 0
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}>
                                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                        )}
                        {subValue && (
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>

                {/* Subtle background glow on hover */}
                <div className="absolute -inset-px bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
        </Card>
    );
}

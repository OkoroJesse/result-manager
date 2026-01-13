import * as React from "react"
import { cn } from "../../lib/utils"

// BUTTON
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20',
            secondary: 'bg-secondary text-text-primary border border-border hover:bg-secondary/80 shadow-sm',
            danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
            ghost: 'bg-transparent text-text-muted hover:bg-secondary',
            outline: 'bg-transparent border border-border text-text-primary hover:bg-secondary'
        };

        const sizes = {
            sm: 'h-9 px-3 text-xs',
            md: 'h-11 px-6 py-2.5 text-sm',
            lg: 'h-14 px-10 text-base font-black uppercase tracking-widest'
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

// CARD
export const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("bg-card rounded-main border border-border shadow-soft overflow-hidden transition-all duration-300", className)}>
        {children}
    </div>
);

export const CardHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("p-6 pb-2 space-y-1", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <h3 className={cn("text-xl font-black leading-none tracking-tight text-text-primary", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);

// DIALOG
export const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in-0 duration-300">
            <div className="relative w-full max-w-lg rounded-main bg-card border border-border shadow-soft animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => onOpenChange(false)} />
        </div>
    );
};

export const DialogHeader = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("flex flex-col space-y-1.5 p-8", className)}>{children}</div>
);

export const DialogTitle = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <h3 className={cn("text-2xl font-black leading-none tracking-tight text-text-primary", className)}>{children}</h3>
);

export const DialogContent = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("p-8 pt-0", className)}>{children}</div>
);

export const DialogFooter = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("flex items-center justify-end gap-3 p-8 pt-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-main border-t border-border", className)}>{children}</div>
);

// ALERT
export const Alert = ({ className, children, variant = 'info' }: { className?: string, children: React.ReactNode, variant?: 'info' | 'warning' | 'error' }) => {
    const variants = {
        info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
        warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
        error: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20'
    };
    return (
        <div className={cn("p-5 rounded-xl border flex gap-4 text-sm font-bold animate-in slide-in-from-top-2 duration-300", variants[variant], className)}>
            {children}
        </div>
    );
};

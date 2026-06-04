import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variants = {
        primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-brand',
        secondary: 'bg-ink-100 text-ink-800 hover:bg-ink-200',
        outline: 'border border-ink-200 bg-surface text-ink-700 shadow-xs hover:border-ink-300 hover:bg-ink-50',
        ghost: 'text-ink-600 hover:bg-ink-100',
        danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
    };

    const sizes = {
        sm: 'h-9 px-3.5 text-sm gap-1.5',
        md: 'h-11 px-5 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}

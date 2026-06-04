'use client';

import { ClipboardList, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { JobStats } from '@/types';

interface StatsCardsProps {
    stats: JobStats | null;
    isLoading?: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
    const cards = [
        {
            name: 'Active jobs',
            value: stats ? stats.in_progress_count + stats.assigned_count : 0,
            icon: ClipboardList,
            tint: 'text-brand-600',
            tintBg: 'bg-brand-50',
            accent: 'bg-brand-500',
        },
        {
            name: 'Pending',
            value: stats?.unassigned_count ?? 0,
            icon: Clock,
            tint: 'text-amber-600',
            tintBg: 'bg-amber-50',
            accent: 'bg-amber-400',
        },
        {
            name: 'Emergency',
            value: stats?.emergency_count ?? 0,
            icon: AlertTriangle,
            tint: 'text-rose-600',
            tintBg: 'bg-rose-50',
            accent: 'bg-rose-500',
        },
        {
            name: 'Completed today',
            value: stats?.completed_count ?? 0,
            icon: CheckCircle,
            tint: 'text-emerald-600',
            tintBg: 'bg-emerald-50',
            accent: 'bg-emerald-500',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.name}
                    className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    {/* slim accent rail */}
                    <span className={`absolute inset-y-0 left-0 w-1 ${card.accent} opacity-80`} />
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink-500">{card.name}</p>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tintBg}`}>
                            <card.icon className={`h-[18px] w-[18px] ${card.tint}`} strokeWidth={2} />
                        </div>
                    </div>
                    <p className="tabular mt-3 text-[32px] font-semibold leading-none tracking-tight text-ink-900">
                        {isLoading ? <span className="text-ink-300">—</span> : card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

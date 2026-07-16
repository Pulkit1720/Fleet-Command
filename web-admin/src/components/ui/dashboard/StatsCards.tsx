'use client';

import { useState } from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { JobStats } from '@/types';

interface StatsCardsProps {
    stats: JobStats | null;
    isLoading?: boolean;
}

type CompletedTimeframe = 'today' | 'week' | 'month';

const COMPLETED_TIMEFRAMES: { value: CompletedTimeframe; label: string }[] = [
    { value: 'today', label: 'Completed today' },
    { value: 'week', label: 'Completed this week' },
    { value: 'month', label: 'Completed this month' },
];

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
    const [completedTimeframe, setCompletedTimeframe] = useState<CompletedTimeframe>('today');

    const completedValue = stats
        ? {
              today: stats.completed_today_count ?? 0,
              week: stats.completed_week_count ?? 0,
              month: stats.completed_month_count ?? 0,
          }[completedTimeframe]
        : 0;

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
            name: 'Completed',
            value: completedValue,
            icon: CheckCircle,
            tint: 'text-emerald-600',
            tintBg: 'bg-emerald-50',
            accent: 'bg-emerald-500',
            isCompleted: true,
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
                    <div className="flex items-center justify-between gap-2">
                        {card.isCompleted ? (
                            <select
                                value={completedTimeframe}
                                onChange={(e) =>
                                    setCompletedTimeframe(e.target.value as CompletedTimeframe)
                                }
                                aria-label="Completed jobs timeframe"
                                className="-ml-1 min-w-0 cursor-pointer rounded-md border-none bg-transparent py-0.5 pl-1 pr-5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            >
                                {COMPLETED_TIMEFRAMES.map((tf) => (
                                    <option key={tf.value} value={tf.value}>
                                        {tf.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm font-medium text-ink-500">{card.name}</p>
                        )}
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${card.tintBg}`}>
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

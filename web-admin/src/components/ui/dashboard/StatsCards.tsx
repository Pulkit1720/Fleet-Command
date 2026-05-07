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
            name: 'Active Jobs',
            value: stats ? stats.in_progress_count + stats.assigned_count : 0,
            icon: ClipboardList,
            gradient: 'from-blue-600 to-blue-500',
            iconBg: 'bg-white/20',
        },
        {
            name: 'Pending',
            value: stats?.unassigned_count ?? 0,
            icon: Clock,
            gradient: 'from-amber-500 to-orange-400',
            iconBg: 'bg-white/20',
        },
        {
            name: 'Emergency',
            value: stats?.emergency_count ?? 0,
            icon: AlertTriangle,
            gradient: 'from-red-600 to-rose-500',
            iconBg: 'bg-white/20',
        },
        {
            name: 'Completed Today',
            value: stats?.completed_count ?? 0,
            icon: CheckCircle,
            gradient: 'from-emerald-600 to-green-500',
            iconBg: 'bg-white/20',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.name}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/80">{card.name}</p>
                            <p className="mt-1 text-4xl font-bold text-white">
                                {isLoading ? '—' : card.value}
                            </p>
                        </div>
                        <div className={`rounded-xl ${card.iconBg} p-2.5`}>
                            <card.icon className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    {/* subtle shine */}
                    <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
                </div>
            ))}
        </div>
    );
}

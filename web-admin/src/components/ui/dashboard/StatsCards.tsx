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
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            name: 'Pending',
            value: stats?.unassigned_count ?? 0,
            icon: Clock,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            name: 'Emergency',
            value: stats?.emergency_count ?? 0,
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            name: 'Completed Today',
            value: stats?.completed_count ?? 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.name}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${card.bgColor}`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{card.name}</p>
                            <p className="text-2xl font-semibold text-slate-900">
                                {isLoading ? '-' : card.value}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
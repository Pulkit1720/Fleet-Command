'use client';

import { useMemo, useState } from 'react';
import { Users, Building2, CalendarDays, AlertCircle } from 'lucide-react';
import { Job } from '@/types';
import { cn, formatDate, formatJobNumber, isJobOverdue } from '@/lib/utils';

type GroupBy = 'technician' | 'client' | 'date';

const TABS: { value: GroupBy; label: string; icon: typeof Users }[] = [
    { value: 'technician', label: 'By technician', icon: Users },
    { value: 'client', label: 'By client', icon: Building2 },
    { value: 'date', label: 'By date', icon: CalendarDays },
];

interface ActiveJobsBreakdownProps {
    jobs: Job[];
    isLoading?: boolean;
}

export default function ActiveJobsBreakdown({ jobs, isLoading }: ActiveJobsBreakdownProps) {
    const [groupBy, setGroupBy] = useState<GroupBy>('technician');

    const activeJobs = useMemo(
        () => jobs.filter((job) => job.status === 'Assigned' || job.status === 'In Progress'),
        [jobs]
    );

    const groups = useMemo(() => {
        const map = new Map<string, Job[]>();
        for (const job of activeJobs) {
            let key: string;
            if (groupBy === 'technician') {
                key = job.assigned_technician?.full_name ?? 'Unassigned';
            } else if (groupBy === 'client') {
                key = job.client_name || 'Unknown client';
            } else {
                key = job.scheduled_date?.slice(0, 10) ?? 'Unscheduled';
            }
            map.set(key, [...(map.get(key) ?? []), job]);
        }

        const entries = [...map.entries()];
        if (groupBy === 'date') {
            // Chronological, with unscheduled jobs last
            entries.sort(([a], [b]) => {
                if (a === 'Unscheduled') return 1;
                if (b === 'Unscheduled') return -1;
                return a.localeCompare(b);
            });
        } else {
            entries.sort(([, a], [, b]) => b.length - a.length);
        }
        return entries;
    }, [activeJobs, groupBy]);

    return (
        <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
                    Active jobs breakdown
                </h2>
                <div className="flex gap-1 rounded-xl border border-ink-200 bg-surface p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setGroupBy(tab.value)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                                groupBy === tab.value
                                    ? 'bg-brand-600 text-white'
                                    : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-surface shadow-sm">
                {isLoading ? (
                    <div className="space-y-3 p-5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 animate-pulse rounded-xl bg-ink-100/70" />
                        ))}
                    </div>
                ) : activeJobs.length === 0 ? (
                    <p className="p-6 text-center text-sm text-ink-400">
                        No active jobs right now.
                    </p>
                ) : (
                    <div className="divide-y divide-ink-100">
                        {groups.map(([label, groupJobs]) => (
                            <div key={label} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                                <div className="flex w-44 flex-shrink-0 items-center justify-between gap-2 pt-0.5">
                                    <p className="truncate text-sm font-medium text-ink-800">
                                        {groupBy === 'date' && label !== 'Unscheduled'
                                            ? formatDate(label)
                                            : label}
                                    </p>
                                    <span className="tabular rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-medium text-ink-600">
                                        {groupJobs.length}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                                    {groupJobs.map((job) => {
                                        const overdue = isJobOverdue(job);
                                        return (
                                            <span
                                                key={job.id}
                                                title={`${job.client_name} — ${job.site_address}`}
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
                                                    overdue
                                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                        : 'border-ink-200 bg-ink-50 text-ink-600'
                                                )}
                                            >
                                                {overdue && <AlertCircle className="h-3 w-3" />}
                                                <span className="tabular">#{formatJobNumber(job.job_number)}</span>
                                                <span className="max-w-32 truncate font-normal">
                                                    {groupBy === 'client' ? job.job_type : job.client_name}
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

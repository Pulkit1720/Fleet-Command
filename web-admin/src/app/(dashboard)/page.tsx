'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList, Clock, MapPin, Plus, Settings, Users } from 'lucide-react';
import Header from '@/layout/Header';
import StatsCards from '@/components/ui/dashboard/StatsCards';
import ActiveJobsBreakdown from '@/components/ui/dashboard/ActiveJobsBreakdown';
import { getJobStats, getJobs } from '@/lib/api';
import { Job, JobStats } from '@/types';

const quickActions = [
    { href: '/create-job', label: 'Create job', icon: Plus, description: 'Add a new job to the queue' },
    { href: '/jobs', label: 'View jobs', icon: ClipboardList, description: 'Browse and manage all jobs' },
    { href: '/technicians', label: 'Technicians', icon: Users, description: 'Manage your field team' },
    { href: '/map', label: 'Live map', icon: MapPin, description: 'Track technicians in real time' },
    { href: '/settings', label: 'Settings', icon: Settings, description: 'Configure your workspace' },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<JobStats | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isJobsLoading, setIsJobsLoading] = useState(true);

    useEffect(() => {
        getJobStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setIsLoading(false));

        getJobs()
            .then((data) => setJobs(data.jobs))
            .catch(console.error)
            .finally(() => setIsJobsLoading(false));
    }, []);

    const pendingCount = stats?.unassigned_count ?? 0;

    return (
        <>
            <Header title="Dashboard" subtitle="Your fleet at a glance" />
            <div className="mx-auto max-w-7xl space-y-8 p-7">
                <StatsCards stats={stats} isLoading={isLoading} />

                {pendingCount > 0 && (
                    <Link
                        href="/jobs"
                        className="group flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-amber-900">
                                    <span className="tabular">{pendingCount}</span> pending job{pendingCount !== 1 ? 's' : ''} awaiting assignment
                                </p>
                                <p className="text-sm text-amber-700/80">
                                    Assign a technician from the job card to get them moving.
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-amber-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-amber-700" />
                    </Link>
                )}

                <ActiveJobsBreakdown jobs={jobs} isLoading={isJobsLoading} />

                <section>
                    <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
                        Quick actions
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="group flex items-center justify-between rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600 transition-colors duration-200 group-hover:bg-brand-600 group-hover:text-white">
                                        <action.icon className="h-5 w-5" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-ink-900">{action.label}</p>
                                        <p className="text-sm text-ink-500">{action.description}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-600" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/layout/Header';
import JobList from '@/components/dashboard/Jobliast';
import { getJobs } from '@/lib/api';
import { Job, JobStatus, JobPriority } from '@/types';

const STATUSES: JobStatus[] = ['Unassigned', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];
const PRIORITIES: JobPriority[] = ['Low', 'Normal', 'Emergency'];

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    useEffect(() => {
        const params: { status?: string; priority?: string } = {};
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;

        setIsLoading(true);
        getJobs(params)
            .then((data) => setJobs(data.jobs))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [statusFilter, priorityFilter]);

    const filteredJobs = jobs.filter((job) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            job.client_name.toLowerCase().includes(q) ||
            job.site_address.toLowerCase().includes(q) ||
            String(job.job_number).includes(q)
        );
    });

    return (
        <>
            <Header title="All jobs" subtitle="Browse the current work queue" />
            <div className="mx-auto max-w-7xl p-7">
                <div className="mb-6 flex flex-wrap gap-3">
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                        <input
                            type="text"
                            placeholder="Search by client, address, or job #…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full rounded-xl border border-ink-200 bg-surface pl-10 pr-4 text-sm text-ink-800 shadow-xs transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 rounded-xl border border-ink-200 bg-surface px-4 text-sm text-ink-700 shadow-xs transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="h-11 rounded-xl border border-ink-200 bg-surface px-4 text-sm text-ink-700 shadow-xs transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    >
                        <option value="">All priorities</option>
                        {PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {!isLoading && (
                    <p className="mb-4 text-sm text-ink-500">
                        <span className="tabular font-medium text-ink-700">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? 's' : ''} found
                    </p>
                )}

                <JobList jobs={filteredJobs} isLoading={isLoading} />
            </div>
        </>
    );
}

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
            <Header title="All Jobs" subtitle="Browse the current work queue" />
            <div className="p-6">
                <div className="mb-6 flex flex-wrap gap-3">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by client, address, or job #..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 rounded-lg border border-slate-300 px-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">All Statuses</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="h-11 rounded-lg border border-slate-300 px-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">All Priorities</option>
                        {PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {!isLoading && (
                    <p className="mb-4 text-sm text-slate-500">
                        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                    </p>
                )}

                <JobList jobs={filteredJobs} isLoading={isLoading} />
            </div>
        </>
    );
}

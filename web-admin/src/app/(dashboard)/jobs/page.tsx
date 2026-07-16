'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/layout/Header';
import JobList from '@/components/dashboard/Jobliast';
import JobFilters, { DEFAULT_JOB_FILTERS, JobFilterState } from '@/components/jobs/JobFilters';
import { getJobs, getTechnicians } from '@/lib/api';
import { Job, Technician } from '@/types';

function toYMD(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Whether a job's scheduled date falls inside the selected calendar interval.
function matchesInterval(scheduledDate: string | null, interval: string): boolean {
    if (!interval) return true;
    if (!scheduledDate) return false;

    const date = scheduledDate.slice(0, 10);
    const now = new Date();
    const today = toYMD(now);

    if (interval === 'today') return date === today;

    if (interval === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return date >= toYMD(start) && date <= toYMD(end);
    }

    if (interval === 'month') {
        return date.slice(0, 7) === today.slice(0, 7);
    }

    return true;
}

function matchesFilters(job: Job, filters: JobFilterState): boolean {
    if (filters.display) {
        const groups: Record<string, boolean> = {
            active: job.status === 'Assigned' || job.status === 'In Progress',
            pending: job.status === 'Unassigned',
            completed: job.status === 'Completed',
            cancelled: job.status === 'Cancelled',
        };
        if (!groups[filters.display]) return false;
    }
    if (filters.tech && job.assigned_technician_id !== filters.tech) return false;
    if (filters.callType && job.job_type !== filters.callType) return false;
    if (filters.realTimeStatus && job.status !== filters.realTimeStatus) return false;
    if (!matchesInterval(job.scheduled_date, filters.interval)) return false;
    // Work Area, Zone, Order Type and Call Confirmed have no backing data on
    // jobs yet; their controls are in place but do not restrict results.
    return true;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTERS);

    useEffect(() => {
        getJobs()
            .then((data) => setJobs(data.jobs))
            .catch(console.error)
            .finally(() => setIsLoading(false));

        getTechnicians().then(setTechnicians).catch(console.error);
    }, []);

    const filteredJobs = jobs.filter((job) => {
        if (!matchesFilters(job, filters)) return false;
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
                <JobFilters filters={filters} onChange={setFilters} technicians={technicians} />

                <div className="relative mb-6">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        type="text"
                        placeholder="Search by client, address, or job #…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 w-full rounded-xl border border-ink-200 bg-surface pl-10 pr-4 text-sm text-ink-800 shadow-xs transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    />
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

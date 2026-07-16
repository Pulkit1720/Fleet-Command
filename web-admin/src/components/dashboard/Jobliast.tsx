'use client';

import { ClipboardList } from 'lucide-react';
import { Job } from '@/types';
import JobCard from '@/components/jobs/JobCard';

interface JobListProps {
    jobs: Job[];
    selectedJobId?: string | null;
    onSelectJob?: (job: Job) => void;
    isLoading?: boolean;
    onJobUpdated?: (job: Job) => void;
}

export default function JobList({
    jobs,
    selectedJobId,
    onSelectJob,
    isLoading,
    onJobUpdated,
}: JobListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-44 animate-pulse rounded-2xl border border-ink-200 bg-ink-100/70"
                    />
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-surface/50 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100">
                    <ClipboardList className="h-6 w-6 text-ink-400" />
                </div>
                <p className="font-medium text-ink-900">No jobs found</p>
                <p className="mt-1 text-sm text-ink-500">
                    Create a new job to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJobId === job.id}
                    onClick={() => onSelectJob?.(job)}
                    onJobUpdated={onJobUpdated}
                />
            ))}
        </div>
    );
}

'use client';

import { Job } from '@/types';
import JobCard from '@/components/jobs/JobCard';

interface JobListProps {
    jobs: Job[];
    selectedJobId?: string | null;
    onSelectJob?: (job: Job) => void;
    isLoading?: boolean;
}

export default function JobList({
    jobs,
    selectedJobId,
    onSelectJob,
    isLoading,
}: JobListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                    />
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-slate-900">No jobs found</p>
                <p className="text-sm text-slate-500">
                    Create a new job to get started
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
                />
            ))}
        </div>
    );
}
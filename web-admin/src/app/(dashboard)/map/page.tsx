'use client';

import { useState, useEffect } from 'react';
import Header from '@/layout/Header';
import JobMap from '@/components/dashboard/JobMap';
import JobList from '@/components/dashboard/Jobliast';
import { getJobs } from '@/lib/api';
import { Job } from '@/types';

export default function MapPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getJobs()
            .then((data) => setJobs(data.jobs))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <>
            <Header title="Live map" subtitle="Track jobs and technicians in real time" />
            <div className="flex gap-4 p-7" style={{ height: 'calc(100dvh - 72px)' }}>
                <div className="w-80 flex-shrink-0 overflow-y-auto pr-1">
                    <JobList
                        jobs={jobs}
                        selectedJobId={selectedJob?.id}
                        onSelectJob={setSelectedJob}
                        isLoading={isLoading}
                    />
                </div>
                <div className="flex-1 overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-sm">
                    <JobMap
                        jobs={jobs}
                        selectedJob={selectedJob}
                        onSelectJob={setSelectedJob}
                    />
                </div>
            </div>
        </>
    );
}

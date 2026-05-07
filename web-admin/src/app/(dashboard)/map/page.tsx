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
            <Header title="Live Map" subtitle="Track jobs and technicians in real time" />
            <div className="flex gap-0 p-6" style={{ height: 'calc(100vh - 80px)' }}>
                <div className="w-80 flex-shrink-0 overflow-y-auto pr-4">
                    <JobList
                        jobs={jobs}
                        selectedJobId={selectedJob?.id}
                        onSelectJob={setSelectedJob}
                        isLoading={isLoading}
                    />
                </div>
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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

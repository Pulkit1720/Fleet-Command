import Header from '@/layout/Header';
import JobForm from '@/components/jobs/JobForm';

export default function CreateJobPage() {
    return (
        <>
            <Header title="Create New Job" subtitle="Schedule a new service job" />
            <div className="p-6">
                <div className="mx-auto max-w-4xl">
                    <JobForm />
                </div>
            </div>
        </>
    );
}
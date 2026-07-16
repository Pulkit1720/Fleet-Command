'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, User, AlertCircle, UserPlus, Loader2 } from 'lucide-react';
import { Job, Technician } from '@/types';
import Badge from '@/components/ui/Badge';
import {
    getPriorityColor,
    getStatusColor,
    getJobTypeColor,
    formatDate,
    formatTime,
    formatJobNumber,
    isJobOverdue,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getTechnicians, updateJob } from '@/lib/api';

interface JobCardProps {
    job: Job;
    onClick?: () => void;
    isSelected?: boolean;
    onJobUpdated?: (job: Job) => void;
}

export default function JobCard({ job, onClick, isSelected, onJobUpdated }: JobCardProps) {
    const overdue = isJobOverdue(job);
    const canAssign = !job.assigned_technician_id && job.status === 'Unassigned' && Boolean(onJobUpdated);
    const [isAssigning, setIsAssigning] = useState(false);

    return (
        <div
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-2xl border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                isSelected
                    ? 'border-brand-400 ring-4 ring-brand-500/10'
                    : overdue
                        ? 'border-rose-300 hover:border-rose-400'
                        : 'border-ink-200 hover:border-ink-300'
            )}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{job.client_name}</p>
                    <p className="tabular text-sm text-ink-400">#{formatJobNumber(job.job_number)}</p>
                </div>
                <Badge className={cn('border', getPriorityColor(job.priority))}>{job.priority}</Badge>
            </div>

            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge className={getJobTypeColor(job.job_type)} variant="outline">
                    {job.job_type}
                </Badge>
                <Badge className={getStatusColor(job.status)} variant="outline">
                    {job.status}
                </Badge>
                {overdue && (
                    <Badge className="gap-1 bg-rose-600 text-white">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                    </Badge>
                )}
            </div>

            {/* Address */}
            <div className="mb-3 flex items-start gap-2 text-sm text-ink-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                <span className="line-clamp-2">{job.site_address}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                <div
                    className={cn(
                        'flex items-center gap-1.5 text-sm',
                        overdue ? 'font-medium text-rose-600' : 'text-ink-500'
                    )}
                >
                    <Clock className={cn('h-4 w-4', overdue ? 'text-rose-500' : 'text-ink-400')} />
                    <span className="tabular">{formatDate(job.scheduled_date)}</span>
                    {job.scheduled_time_start && (
                        <span className="tabular">· {formatTime(job.scheduled_time_start)}</span>
                    )}
                </div>
                {job.assigned_technician ? (
                    <div className="flex items-center gap-1.5 text-sm text-ink-500">
                        <User className="h-4 w-4 text-ink-400" />
                        <span>{job.assigned_technician.full_name.split(' ')[0]}</span>
                    </div>
                ) : canAssign ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAssigning((open) => !open);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign
                    </button>
                ) : null}
            </div>

            {isAssigning && canAssign && (
                <AssignPanel
                    job={job}
                    onClose={() => setIsAssigning(false)}
                    onAssigned={(updated) => {
                        setIsAssigning(false);
                        onJobUpdated?.(updated);
                    }}
                />
            )}
        </div>
    );
}

// Inline panel to assign a technician (and adjust the scheduled date) on a
// job that was created unassigned.
function AssignPanel({
    job,
    onClose,
    onAssigned,
}: {
    job: Job;
    onClose: () => void;
    onAssigned: (job: Job) => void;
}) {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [techId, setTechId] = useState('');
    const [date, setDate] = useState(job.scheduled_date?.slice(0, 10) ?? '');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getTechnicians()
            .then((techs) => setTechnicians(techs.filter((t) => t.is_active)))
            .catch(() => setError('Failed to load technicians'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleAssign = async () => {
        if (!techId) {
            setError('Pick a technician');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            const updated = await updateJob(job.id, {
                assigned_technician_id: techId,
                status: 'Assigned',
                ...(date ? { scheduled_date: date } : {}),
            } as Partial<Job>);
            onAssigned(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign');
            setIsSaving(false);
        }
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 space-y-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3"
        >
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <select
                    value={techId}
                    onChange={(e) => setTechId(e.target.value)}
                    disabled={isLoading || isSaving}
                    aria-label="Technician"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-ink-200 bg-surface px-2 text-sm text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                >
                    <option value="">
                        {isLoading ? 'Loading technicians…' : 'Select technician'}
                    </option>
                    {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                            {tech.full_name}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isSaving}
                    aria-label="Scheduled date"
                    className="h-9 rounded-lg border border-ink-200 bg-surface px-2 text-sm text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                />
            </div>
            <div className="flex justify-end gap-2">
                <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAssign}
                    disabled={isSaving || !techId}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSaving ? 'Assigning…' : 'Assign'}
                </button>
            </div>
        </div>
    );
}

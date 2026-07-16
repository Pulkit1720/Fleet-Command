'use client';

import { MapPin, Clock, User, AlertCircle } from 'lucide-react';
import { Job } from '@/types';
import Badge from '@/components/ui/Badge';
import {
    getPriorityColor,
    getStatusColor,
    getJobTypeColor,
    formatDate,
    formatTime,
    isJobOverdue,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface JobCardProps {
    job: Job;
    onClick?: () => void;
    isSelected?: boolean;
}

export default function JobCard({ job, onClick, isSelected }: JobCardProps) {
    const overdue = isJobOverdue(job);

    return (
        <div
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-2xl border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                isSelected
                    ? 'border-brand-400 ring-4 ring-brand-500/10'
                    : 'border-ink-200 hover:border-ink-300'
            )}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{job.client_name}</p>
                    <p className="tabular text-sm text-ink-400">#{job.job_number}</p>
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
                <div className="flex items-center gap-1.5 text-sm text-ink-500">
                    <Clock className="h-4 w-4 text-ink-400" />
                    <span className="tabular">{formatDate(job.scheduled_date)}</span>
                    {job.scheduled_time_start && (
                        <span className="tabular">· {formatTime(job.scheduled_time_start)}</span>
                    )}
                </div>
                {job.assigned_technician && (
                    <div className="flex items-center gap-1.5 text-sm text-ink-500">
                        <User className="h-4 w-4 text-ink-400" />
                        <span>{job.assigned_technician.full_name.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

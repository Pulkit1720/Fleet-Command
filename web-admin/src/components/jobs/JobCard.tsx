'use client';

import { MapPin, Clock, User } from 'lucide-react';
import { Job } from '@/types';
import Badge from '@/components/ui/Badge';
import {
    getPriorityColor,
    getStatusColor,
    getJobTypeColor,
    formatDate,
    formatTime,
} from '@/lib/utils';

interface JobCardProps {
    job: Job;
    onClick?: () => void;
    isSelected?: boolean;
}

export default function JobCard({ job, onClick, isSelected }: JobCardProps) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <p className="font-semibold text-slate-900">{job.client_name}</p>
                    <p className="text-sm text-slate-500">#{job.job_number}</p>
                </div>
                <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
            </div>

            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-2">
                <Badge className={getJobTypeColor(job.job_type)} variant="outline">
                    {job.job_type}
                </Badge>
                <Badge className={getStatusColor(job.status)} variant="outline">
                    {job.status}
                </Badge>
            </div>

            {/* Address */}
            <div className="mb-3 flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="line-clamp-2">{job.site_address}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(job.scheduled_date)}</span>
                    {job.scheduled_time_start && (
                        <span>at {formatTime(job.scheduled_time_start)}</span>
                    )}
                </div>
                {job.assigned_technician && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <User className="h-4 w-4" />
                        <span>{job.assigned_technician.full_name.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
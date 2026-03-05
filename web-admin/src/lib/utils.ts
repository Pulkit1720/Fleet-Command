import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(time: string | null): string {
  if (!time) return '-';
  return time.slice(0, 5);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Emergency':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Normal':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Low':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Unassigned':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Assigned':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'In Progress':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getJobTypeColor(jobType: string): string {
  switch (jobType) {
    case 'Repair':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'New Install':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Ongoing Install':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Maintenance':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'Inspection':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}
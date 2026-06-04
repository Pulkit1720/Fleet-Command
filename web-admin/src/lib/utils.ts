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
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Normal':
      return 'bg-brand-50 text-brand-700 border-brand-200';
    case 'Low':
      return 'bg-ink-100 text-ink-600 border-ink-200';
    default:
      return 'bg-ink-100 text-ink-600 border-ink-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Unassigned':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Assigned':
      return 'bg-brand-50 text-brand-700 border-brand-200';
    case 'In Progress':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled':
      return 'bg-ink-100 text-ink-500 border-ink-200';
    default:
      return 'bg-ink-100 text-ink-600 border-ink-200';
  }
}

export function getJobTypeColor(jobType: string): string {
  switch (jobType) {
    case 'Repair':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Install':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Ongoing Install':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Maintenance':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Inspection':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    default:
      return 'bg-ink-100 text-ink-600 border-ink-200';
  }
}
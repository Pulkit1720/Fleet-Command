import { clsx, type ClassValue } from 'clsx';
import { Job, JobType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Mirrors the backend's automatic-duration defaults.
export const DEFAULT_DURATION_MINUTES: Record<JobType, number> = {
  'Repair': 120,
  'Install': 180,
  'Ongoing Install': 240,
  'Maintenance': 90,
  'Inspection': 60,
};

// Duration is derived automatically: scheduled time window first, then the
// job-type default.
export function deriveDurationMinutes(
  jobType: JobType,
  timeStart?: string | null,
  timeEnd?: string | null
): number {
  if (timeStart && timeEnd) {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const start = toMinutes(timeStart);
    const end = toMinutes(timeEnd);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return end - start;
    }
  }
  return DEFAULT_DURATION_MINUTES[jobType] ?? 120;
}

export function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// Date-based job numbers are 9 digits: YYMMDDNNN → shown as "260715-001".
// Older sequential numbers are shown as-is.
export function formatJobNumber(jobNumber: number): string {
  const s = String(jobNumber);
  if (s.length === 9) return `${s.slice(0, 6)}-${s.slice(6)}`;
  return s;
}

// A job is overdue when it is still open (not Completed/Cancelled) and the
// current time is past its expected completion time. Expected completion is,
// in order of preference: scheduled end time, scheduled start time plus the
// estimated duration, or the end of the scheduled day.
export function isJobOverdue(
  job: Pick<
    Job,
    | 'status'
    | 'scheduled_date'
    | 'scheduled_time_start'
    | 'scheduled_time_end'
    | 'estimated_duration_minutes'
  >,
  now: Date = new Date()
): boolean {
  if (job.status === 'Completed' || job.status === 'Cancelled') return false;
  if (!job.scheduled_date) return false;

  const date = job.scheduled_date.slice(0, 10);
  const toLocalDate = (time: string) =>
    new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);

  let expectedEnd: Date;
  if (job.scheduled_time_end) {
    expectedEnd = toLocalDate(job.scheduled_time_end);
  } else if (job.scheduled_time_start) {
    expectedEnd = new Date(
      toLocalDate(job.scheduled_time_start).getTime() +
        (job.estimated_duration_minutes || 0) * 60_000
    );
  } else {
    expectedEnd = new Date(`${date}T23:59:59`);
  }

  return !Number.isNaN(expectedEnd.getTime()) && now.getTime() > expectedEnd.getTime();
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
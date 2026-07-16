import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatTime,
  getPriorityColor,
  getStatusColor,
  getJobTypeColor,
  isJobOverdue,
  formatJobNumber,
  deriveDurationMinutes,
  formatDurationMinutes,
} from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('preserves all class strings from clsx (no tailwind merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-2 p-4');
  });
});

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('formats ISO date string in en-US locale', () => {
    const formatted = formatDate('2024-06-15T12:00:00.000Z');
    expect(formatted).toMatch(/Jun/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
  });
});

describe('formatTime', () => {
  it('returns dash for null', () => {
    expect(formatTime(null)).toBe('-');
  });

  it('returns first 5 characters of time string', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
    expect(formatTime('09:05')).toBe('09:05');
  });
});

describe('getPriorityColor', () => {
  it('returns correct classes for each priority', () => {
    expect(getPriorityColor('Emergency')).toContain('rose');
    expect(getPriorityColor('Normal')).toContain('brand');
    expect(getPriorityColor('Low')).toContain('ink');
  });

  it('returns default ink for unknown priority', () => {
    expect(getPriorityColor('Unknown')).toContain('ink');
  });
});

describe('getStatusColor', () => {
  it('returns correct classes for each status', () => {
    expect(getStatusColor('Unassigned')).toContain('amber');
    expect(getStatusColor('Assigned')).toContain('brand');
    expect(getStatusColor('In Progress')).toContain('violet');
    expect(getStatusColor('Completed')).toContain('emerald');
    expect(getStatusColor('Cancelled')).toContain('ink');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('Pending')).toContain('ink');
  });
});

describe('getJobTypeColor', () => {
  it('returns correct classes for each job type', () => {
    expect(getJobTypeColor('Repair')).toContain('orange');
    expect(getJobTypeColor('Install')).toContain('emerald');
    expect(getJobTypeColor('Ongoing Install')).toContain('cyan');
    expect(getJobTypeColor('Maintenance')).toContain('violet');
    expect(getJobTypeColor('Inspection')).toContain('pink');
  });

  it('returns default for unknown job type', () => {
    expect(getJobTypeColor('Survey')).toContain('ink');
  });
});

describe('isJobOverdue', () => {
  const baseJob = {
    status: 'Assigned' as const,
    scheduled_date: '2024-06-15',
    scheduled_time_start: null,
    scheduled_time_end: null,
    estimated_duration_minutes: 60,
  };
  const now = new Date('2024-06-15T12:00:00');

  it('is overdue when past the scheduled end time', () => {
    const job = { ...baseJob, scheduled_time_end: '11:00' };
    expect(isJobOverdue(job, now)).toBe(true);
  });

  it('is not overdue before the scheduled end time', () => {
    const job = { ...baseJob, scheduled_time_end: '13:00' };
    expect(isJobOverdue(job, now)).toBe(false);
  });

  it('falls back to start time plus estimated duration', () => {
    const overdue = { ...baseJob, scheduled_time_start: '10:00' }; // ends 11:00
    const onTime = { ...baseJob, scheduled_time_start: '11:30' }; // ends 12:30
    expect(isJobOverdue(overdue, now)).toBe(true);
    expect(isJobOverdue(onTime, now)).toBe(false);
  });

  it('falls back to end of the scheduled day when no times are set', () => {
    expect(isJobOverdue(baseJob, now)).toBe(false);
    expect(isJobOverdue(baseJob, new Date('2024-06-16T00:30:00'))).toBe(true);
  });

  it('is never overdue for completed or cancelled jobs', () => {
    const job = { ...baseJob, scheduled_time_end: '11:00' };
    expect(isJobOverdue({ ...job, status: 'Completed' }, now)).toBe(false);
    expect(isJobOverdue({ ...job, status: 'Cancelled' }, now)).toBe(false);
  });

  it('is not overdue without a scheduled date', () => {
    expect(isJobOverdue({ ...baseJob, scheduled_date: null }, now)).toBe(false);
  });
});

describe('formatJobNumber', () => {
  it('formats 9-digit date-based numbers as YYMMDD-NNN', () => {
    expect(formatJobNumber(260715001)).toBe('260715-001');
  });

  it('leaves legacy sequential numbers untouched', () => {
    expect(formatJobNumber(42)).toBe('42');
    expect(formatJobNumber(1007)).toBe('1007');
  });
});

describe('deriveDurationMinutes', () => {
  it('uses the scheduled time window when valid', () => {
    expect(deriveDurationMinutes('Repair', '10:00', '11:30')).toBe(90);
  });

  it('falls back to the job-type default otherwise', () => {
    expect(deriveDurationMinutes('Inspection')).toBe(60);
    expect(deriveDurationMinutes('Install', '10:00', '')).toBe(180);
    expect(deriveDurationMinutes('Repair', '12:00', '10:00')).toBe(120);
  });
});

describe('formatDurationMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatDurationMinutes(90)).toBe('1h 30m');
    expect(formatDurationMinutes(120)).toBe('2h');
    expect(formatDurationMinutes(45)).toBe('45m');
  });
});

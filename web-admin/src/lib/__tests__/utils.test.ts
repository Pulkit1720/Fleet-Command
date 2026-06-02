import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatTime,
  getPriorityColor,
  getStatusColor,
  getJobTypeColor,
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
    expect(getPriorityColor('Emergency')).toContain('red');
    expect(getPriorityColor('Normal')).toContain('blue');
    expect(getPriorityColor('Low')).toContain('slate');
  });

  it('returns default slate for unknown priority', () => {
    expect(getPriorityColor('Unknown')).toContain('slate');
  });
});

describe('getStatusColor', () => {
  it('returns correct classes for each status', () => {
    expect(getStatusColor('Unassigned')).toContain('amber');
    expect(getStatusColor('Assigned')).toContain('blue');
    expect(getStatusColor('In Progress')).toContain('purple');
    expect(getStatusColor('Completed')).toContain('green');
    expect(getStatusColor('Cancelled')).toContain('slate');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('Pending')).toContain('slate');
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
    expect(getJobTypeColor('Survey')).toContain('slate');
  });
});

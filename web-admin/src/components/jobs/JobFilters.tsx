'use client';

import { Technician, JobStatus, JobType } from '@/types';

export const JOB_STATUSES: JobStatus[] = ['Unassigned', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];
export const JOB_TYPES: JobType[] = ['Repair', 'Install', 'Ongoing Install', 'Maintenance', 'Inspection'];

export interface JobFilterState {
    display: string;
    tech: string;
    techChecks: [boolean, boolean];
    workArea: string;
    workAreaChecks: [boolean, boolean];
    callType: string;
    callTypeChecks: [boolean, boolean];
    realTimeStatus: string;
    interval: string;
    zone: string;
    zoneChecks: [boolean, boolean];
    orderType: string;
    orderTypeChecks: [boolean, boolean];
    callConfirmed: string;
}

export const DEFAULT_JOB_FILTERS: JobFilterState = {
    display: '',
    tech: '',
    techChecks: [false, false],
    workArea: '',
    workAreaChecks: [false, false],
    callType: '',
    callTypeChecks: [false, false],
    realTimeStatus: '',
    interval: '',
    zone: '',
    zoneChecks: [false, false],
    orderType: '',
    orderTypeChecks: [false, false],
    callConfirmed: '',
};

interface Option {
    value: string;
    label: string;
}

interface JobFiltersProps {
    filters: JobFilterState;
    onChange: (filters: JobFilterState) => void;
    technicians: Technician[];
}

export default function JobFilters({ filters, onChange, technicians }: JobFiltersProps) {
    const set = (patch: Partial<JobFilterState>) => onChange({ ...filters, ...patch });

    const techOptions: Option[] = technicians.map((t) => ({ value: t.id, label: t.full_name }));

    return (
        <div className="mb-6 rounded-2xl border border-ink-200 bg-surface p-4 shadow-sm">
            <div className="grid gap-x-10 gap-y-2.5 lg:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-2.5">
                    <FilterRow
                        label="Display"
                        value={filters.display}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                        onValueChange={(v) => set({ display: v })}
                    />
                    <FilterRow
                        label="Tech"
                        value={filters.tech}
                        options={techOptions}
                        onValueChange={(v) => set({ tech: v })}
                        checkboxLabels={['Primary', 'Secondary']}
                        checks={filters.techChecks}
                        onChecksChange={(c) => set({ techChecks: c })}
                    />
                    <FilterRow
                        label="Work Area"
                        value={filters.workArea}
                        options={[]}
                        onValueChange={(v) => set({ workArea: v })}
                        checkboxLabels={['Primary', 'Secondary']}
                        checks={filters.workAreaChecks}
                        onChecksChange={(c) => set({ workAreaChecks: c })}
                    />
                    <FilterRow
                        label="Call Type"
                        value={filters.callType}
                        options={JOB_TYPES.map((t) => ({ value: t, label: t }))}
                        onValueChange={(v) => set({ callType: v })}
                        checkboxLabels={['Primary', 'Secondary']}
                        checks={filters.callTypeChecks}
                        onChecksChange={(c) => set({ callTypeChecks: c })}
                    />
                    <FilterRow
                        label="Real Time Status"
                        value={filters.realTimeStatus}
                        options={JOB_STATUSES.map((s) => ({ value: s, label: s }))}
                        onValueChange={(v) => set({ realTimeStatus: v })}
                    />
                </div>

                {/* Column 2 */}
                <div className="space-y-2.5">
                    <FilterRow
                        label="Interval"
                        value={filters.interval}
                        options={[
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'This Week' },
                            { value: 'month', label: 'This Month' },
                        ]}
                        onValueChange={(v) => set({ interval: v })}
                    />
                    {/* Spacer row so the rows below line up with the left column */}
                    <div className="hidden h-9 lg:block" aria-hidden="true" />
                    <FilterRow
                        label="Zone"
                        value={filters.zone}
                        options={[]}
                        onValueChange={(v) => set({ zone: v })}
                        checkboxLabels={['Primary', 'Secondary']}
                        checks={filters.zoneChecks}
                        onChecksChange={(c) => set({ zoneChecks: c })}
                    />
                    <FilterRow
                        label="Order Type"
                        value={filters.orderType}
                        options={[]}
                        onValueChange={(v) => set({ orderType: v })}
                        checkboxLabels={['Primary', 'Secondary']}
                        checks={filters.orderTypeChecks}
                        onChecksChange={(c) => set({ orderTypeChecks: c })}
                    />
                    <FilterRow
                        label="Call Confirmed"
                        value={filters.callConfirmed}
                        options={[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                        ]}
                        onValueChange={(v) => set({ callConfirmed: v })}
                    />
                </div>
            </div>
        </div>
    );
}

function FilterRow({
    label,
    value,
    options,
    onValueChange,
    checkboxLabels,
    checks,
    onChecksChange,
}: {
    label: string;
    value: string;
    options: Option[];
    onValueChange: (value: string) => void;
    checkboxLabels?: [string, string];
    checks?: [boolean, boolean];
    onChecksChange?: (checks: [boolean, boolean]) => void;
}) {
    return (
        <div className="flex h-9 items-center gap-2.5">
            <label className="w-32 flex-shrink-0 text-xs font-bold text-ink-700">{label}:</label>
            <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                aria-label={label}
                className="h-8 min-w-0 flex-1 rounded-lg border border-ink-200 bg-surface px-2 text-xs text-ink-700 shadow-xs transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
                <option value="">All</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {checkboxLabels && checks && onChecksChange && (
                <span className="flex flex-shrink-0 items-center gap-2.5">
                    {checkboxLabels.map((cbLabel, i) => (
                        <label
                            key={cbLabel}
                            className="flex cursor-pointer items-center gap-1 text-xs text-ink-600"
                        >
                            <input
                                type="checkbox"
                                checked={checks[i]}
                                onChange={(e) => {
                                    const next: [boolean, boolean] = [...checks];
                                    next[i] = e.target.checked;
                                    onChecksChange(next);
                                }}
                                className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 accent-brand-600 focus:ring-brand-500/20"
                            />
                            {cbLabel}
                        </label>
                    ))}
                </span>
            )}
        </div>
    );
}

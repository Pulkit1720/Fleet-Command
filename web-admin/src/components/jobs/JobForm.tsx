'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createJob, getTechnicians } from '@/lib/api';
import { Technician, JobType, JobPriority, AddressSuggestion } from '@/types';
import AddressAutocomplete from './AddressAutocomplete';
import Button from '@/components/ui/Button';

type JobFormData = {
    client_name: string;
    client_phone: string;
    client_email: string;
    job_type: JobType;
    priority: JobPriority;
    description: string;
    site_address: string;
    lat: number | null;
    lng: number | null;
    assigned_technician_id: string;
    scheduled_date: string;
    scheduled_time_start: string;
    scheduled_time_end: string;
    estimated_duration_minutes: number;
    notes: string;
};

const JOB_TYPES: JobType[] = ['Repair', 'Install', 'Ongoing Install', 'Maintenance', 'Inspection'];
const PRIORITIES: JobPriority[] = ['Low', 'Normal', 'Emergency'];

export default function JobForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<JobFormData>({
        client_name: '',
        client_phone: '',
        client_email: '',
        job_type: 'Repair' as JobType,
        priority: 'Normal' as JobPriority,
        description: '',
        site_address: '',
        lat: null as number | null,
        lng: null as number | null,
        assigned_technician_id: '',
        scheduled_date: '',
        scheduled_time_start: '',
        scheduled_time_end: '',
        estimated_duration_minutes: 60,
        notes: '',
    });

    useEffect(() => {
        getTechnicians().then(setTechnicians).catch(console.error);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        const nextValue =
            name === 'estimated_duration_minutes' ? Number(value) : value;

        setFormData((prev) => ({ ...prev, [name]: nextValue }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (errors.submit) {
            setErrors((prev) => ({ ...prev, submit: '' }));
        }
    };

    const handleAddressSelect = (suggestion: AddressSuggestion) => {
        setFormData((prev) => ({
            ...prev,
            site_address: suggestion.address,
            lat: suggestion.lat,
            lng: suggestion.lng,
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required';
        if (!formData.site_address.trim()) newErrors.site_address = 'Site address is required';
        if (!formData.scheduled_date) newErrors.scheduled_date = 'Scheduled date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await createJob({
                ...formData,
                assigned_technician_id: formData.assigned_technician_id || undefined,
            });
            router.push('/');
        } catch (err) {
            console.error('Create job error:', err);
            const message = err instanceof Error && err.message
                ? err.message
                : 'Failed to create job. Please try again.';
            setErrors({ submit: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {errors.submit}
                </div>
            )}

            {/* Client Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium text-slate-900">Client Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Client Name *
                        </label>
                        <input
                            type="text"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleChange}
                            className={`h-11 w-full rounded-lg border px-4 text-sm focus:outline-none focus:ring-2 ${errors.client_name
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                        {errors.client_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                        <input
                            type="tel"
                            name="client_phone"
                            value={formData.client_phone}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            name="client_email"
                            value={formData.client_email}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {/* Job Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium text-slate-900">Job Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Job Type</label>
                        <select
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {JOB_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Assign Technician
                        </label>
                        <select
                            name="assigned_technician_id"
                            value={formData.assigned_technician_id}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Unassigned</option>
                            {technicians.map((tech) => (
                                <option key={tech.id} value={tech.id}>
                                    {tech.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium text-slate-900">Location</h3>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Site Address *
                    </label>
                    <AddressAutocomplete
                        value={formData.site_address}
                        onChange={(value) => setFormData((prev) => ({ ...prev, site_address: value }))}
                        onSelect={handleAddressSelect}
                        placeholder="Start typing an address..."
                        error={errors.site_address}
                    />
                    {formData.lat && formData.lng && (
                        <p className="mt-2 text-xs text-slate-500">
                            📍 Coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                        </p>
                    )}
                </div>
            </div>

            {/* Schedule */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium text-slate-900">Schedule</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Date *</label>
                        <input
                            type="date"
                            name="scheduled_date"
                            value={formData.scheduled_date}
                            onChange={handleChange}
                            className={`h-11 w-full rounded-lg border px-4 text-sm focus:outline-none focus:ring-2 ${errors.scheduled_date
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                        {errors.scheduled_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Start Time</label>
                        <input
                            type="time"
                            name="scheduled_time_start"
                            value={formData.scheduled_time_start}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">End Time</label>
                        <input
                            type="time"
                            name="scheduled_time_end"
                            value={formData.scheduled_time_end}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Duration (min)
                        </label>
                        <input
                            type="number"
                            name="estimated_duration_minutes"
                            value={formData.estimated_duration_minutes}
                            onChange={handleChange}
                            min={15}
                            step={15}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium text-slate-900">Additional Notes</h3>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any special instructions or notes..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Job'}
                </Button>
            </div>
        </form>
    );
}
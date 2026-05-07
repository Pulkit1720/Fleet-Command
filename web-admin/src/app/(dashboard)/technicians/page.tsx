'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Circle, UserPlus, X, Loader2 } from 'lucide-react';
import Header from '@/layout/Header';
import { getTechnicians, inviteTechnician } from '@/lib/api';
import { Technician } from '@/types';

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        getTechnicians()
            .then(setTechnicians)
            .catch((err) => setError(err.message || 'Failed to load technicians'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleInvited = (newTech: Technician) => {
        setTechnicians((prev) => [...prev, newTech]);
        setShowInviteModal(false);
    };

    return (
        <>
            <Header title="Technicians" subtitle="Manage your field team" />
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    {!isLoading && !error && (
                        <p className="text-sm text-slate-500">
                            {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
                        </p>
                    )}
                    <div className="ml-auto">
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite Technician
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!isLoading && !error && technicians.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-4">
                            <User className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-lg font-medium text-slate-900">No technicians yet</p>
                        <p className="mt-1 text-sm text-slate-500">Invite a technician to get started.</p>
                    </div>
                )}

                {!isLoading && !error && technicians.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {technicians.map((tech) => (
                            <TechnicianCard key={tech.id} tech={tech} />
                        ))}
                    </div>
                )}
            </div>

            {showInviteModal && (
                <InviteModal
                    onClose={() => setShowInviteModal(false)}
                    onInvited={handleInvited}
                />
            )}
        </>
    );
}

function InviteModal({
    onClose,
    onInvited,
}: {
    onClose: () => void;
    onInvited: (tech: Technician) => void;
}) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const tech = await inviteTechnician({
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
            });
            setSuccess(true);
            setTimeout(() => onInvited(tech), 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send invite');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Invite Technician</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            Invite sent! The technician will receive an email to set up their account.
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={isLoading || success}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                            placeholder="Jane Smith"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading || success}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                            placeholder="jane@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading || success}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                            placeholder="+1 555 000 0000"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                'Send Invite'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TechnicianCard({ tech }: { tech: Technician }) {
    const hasLocation = tech.current_lat != null && tech.current_lng != null;
    const lastSeen = tech.last_location_update
        ? new Date(tech.last_location_update).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          })
        : null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                        <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">{tech.full_name}</p>
                        <p className="text-xs text-slate-500">ID: {tech.id.slice(0, 8)}…</p>
                    </div>
                </div>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        tech.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}
                >
                    <Circle
                        className={`h-2 w-2 fill-current ${tech.is_active ? 'text-green-500' : 'text-slate-400'}`}
                    />
                    {tech.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{tech.email}</span>
                </div>
                {tech.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span>{tech.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    {hasLocation ? (
                        <span>
                            {tech.current_lat!.toFixed(4)}, {tech.current_lng!.toFixed(4)}
                            {lastSeen && <span className="ml-1 text-xs text-slate-400">· {lastSeen}</span>}
                        </span>
                    ) : (
                        <span className="text-slate-400">Location not available</span>
                    )}
                </div>
            </div>
        </div>
    );
}

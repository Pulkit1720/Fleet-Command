'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Circle, UserPlus, X, Loader2 } from 'lucide-react';
import Header from '@/layout/Header';
import { getTechnicians, inviteTechnician } from '@/lib/api';
import { Technician } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function TechniciansPage() {
    const { user } = useAuth();
    const isAdmin =
        (user?.user_metadata?.role ?? user?.app_metadata?.role) === 'admin';
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
            <div className="mx-auto max-w-7xl p-7">
                <div className="mb-6 flex items-center justify-between">
                    {!isLoading && !error && (
                        <p className="text-sm text-ink-500">
                            <span className="tabular font-medium text-ink-700">{technicians.length}</span> technician{technicians.length !== 1 ? 's' : ''}
                        </p>
                    )}
                    {isAdmin && (
                        <div className="ml-auto">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-brand active:scale-[0.98]"
                            >
                                <UserPlus className="h-4 w-4" />
                                Invite technician
                            </button>
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-44 animate-pulse rounded-2xl border border-ink-200 bg-ink-100/70" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                        {error}
                    </div>
                )}

                {!isLoading && !error && technicians.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-surface/50 py-16 text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100">
                            <User className="h-6 w-6 text-ink-400" />
                        </div>
                        <p className="font-medium text-ink-900">No technicians yet</p>
                        <p className="mt-1 text-sm text-ink-500">Invite a technician to get started.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-scale-in rounded-3xl border border-ink-200 bg-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
                    <h2 className="text-base font-medium text-ink-900">Invite technician</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            Invite sent. The technician will receive an email to set up their account.
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">
                            Full name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={isLoading || success}
                            className="h-11 w-full rounded-xl border border-ink-200 px-3.5 text-sm text-ink-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50"
                            placeholder="Maya Rodriguez"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">
                            Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading || success}
                            className="h-11 w-full rounded-xl border border-ink-200 px-3.5 text-sm text-ink-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50"
                            placeholder="maya@company.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading || success}
                            className="h-11 w-full rounded-xl border border-ink-200 px-3.5 text-sm text-ink-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50"
                            placeholder="+1 (312) 847-1928"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                'Send invite'
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
        <div className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
                        <User className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                        <p className="font-medium text-ink-900">{tech.full_name}</p>
                        <p className="tabular text-xs text-ink-400">ID: {tech.id.slice(0, 8)}…</p>
                    </div>
                </div>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                        tech.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-ink-100 text-ink-500'
                    }`}
                >
                    <Circle
                        className={`h-2 w-2 fill-current ${tech.is_active ? 'text-emerald-500' : 'text-ink-400'}`}
                    />
                    {tech.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Mail className="h-4 w-4 flex-shrink-0 text-ink-400" />
                    <span className="truncate">{tech.email}</span>
                </div>
                {tech.phone && (
                    <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Phone className="h-4 w-4 flex-shrink-0 text-ink-400" />
                        <span className="tabular">{tech.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-ink-500">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-ink-400" />
                    {hasLocation ? (
                        <span className="tabular">
                            {tech.current_lat!.toFixed(4)}, {tech.current_lng!.toFixed(4)}
                            {lastSeen && <span className="ml-1 text-xs text-ink-400">· {lastSeen}</span>}
                        </span>
                    ) : (
                        <span className="text-ink-400">Location not available</span>
                    )}
                </div>
            </div>
        </div>
    );
}

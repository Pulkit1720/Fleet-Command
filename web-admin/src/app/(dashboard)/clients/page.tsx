'use client';

import { useState, useEffect } from 'react';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Pencil,
    Trash2,
    Plus,
    X,
    Loader2,
    ClipboardList,
    BookmarkPlus,
} from 'lucide-react';
import Header from '@/layout/Header';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/api';
import { Client } from '@/types';
import { cn, formatDate } from '@/lib/utils';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Client | 'new' | null>(null);

    useEffect(() => {
        getClients()
            .then(setClients)
            .catch((err) => setError(err.message || 'Failed to load clients'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSaved = (saved: Client, previous: Client | 'new') => {
        setClients((prev) => {
            if (previous === 'new') return [...prev, saved].sort(byName);
            // Editing a saved client, or promoting a derived one (matched by name)
            return prev
                .map((c) =>
                    (previous.id != null && c.id === previous.id) ||
                    (previous.id == null && c.client_name === previous.client_name)
                        ? { ...saved, job_count: c.job_count, active_job_count: c.active_job_count, last_job_date: c.last_job_date }
                        : c
                )
                .sort(byName);
        });
        setEditing(null);
    };

    const handleDeleted = (id: string) => {
        setClients((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <>
            <Header title="Clients" subtitle="View and manage the clients you work for" />
            <div className="mx-auto max-w-7xl p-7">
                <div className="mb-6 flex items-center justify-between">
                    {!isLoading && !error && (
                        <p className="text-sm text-ink-500">
                            <span className="tabular font-medium text-ink-700">{clients.length}</span> client{clients.length !== 1 ? 's' : ''}
                        </p>
                    )}
                    <div className="ml-auto">
                        <button
                            onClick={() => setEditing('new')}
                            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-brand active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4" />
                            Add client
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 animate-pulse rounded-xl border border-ink-200 bg-ink-100/70" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                        {error}
                    </div>
                )}

                {!isLoading && !error && clients.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-surface/50 py-16 text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100">
                            <Building2 className="h-6 w-6 text-ink-400" />
                        </div>
                        <p className="font-medium text-ink-900">No clients yet</p>
                        <p className="mt-1 text-sm text-ink-500">
                            Add a client, or create a job — its client shows up here automatically.
                        </p>
                    </div>
                )}

                {!isLoading && !error && clients.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {clients.map((client) => (
                            <ClientCard
                                key={client.id ?? `derived-${client.client_name}`}
                                client={client}
                                onEdit={() => setEditing(client)}
                                onDeleted={handleDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <ClientModal
                    client={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={(saved) => handleSaved(saved, editing)}
                />
            )}
        </>
    );
}

function byName(a: Client, b: Client) {
    return a.client_name.localeCompare(b.client_name);
}

function ClientCard({
    client,
    onEdit,
    onDeleted,
}: {
    client: Client;
    onEdit: () => void;
    onDeleted: (id: string) => void;
}) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!client.id) return;
        setIsDeleting(true);
        try {
            await deleteClient(client.id);
            onDeleted(client.id);
        } catch {
            setIsDeleting(false);
            setConfirmingDelete(false);
        }
    };

    const location = [client.city, client.state].filter(Boolean).join(', ');

    return (
        <div className="flex flex-col rounded-xl border border-ink-200 bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                        <Building2 className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{client.client_name}</p>
                        {client.contact_name && client.contact_name !== client.client_name && (
                            <p className="truncate text-[11px] text-ink-400">{client.contact_name}</p>
                        )}
                    </div>
                </div>
                {!client.saved && (
                    <span className="flex-shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-500">
                        From jobs
                    </span>
                )}
            </div>

            <div className="mb-3 space-y-1.5">
                {client.email && (
                    <div className="flex items-center gap-1.5 text-xs text-ink-600">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                        <span className="truncate">{client.email}</span>
                    </div>
                )}
                {client.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-ink-600">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                        <span className="tabular">{client.phone}</span>
                    </div>
                )}
                {(client.address || location) && (
                    <div className="flex items-center gap-1.5 text-xs text-ink-600">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                        <span className="truncate">{client.address || location}</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-ink-500">
                    <ClipboardList className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                    <span>
                        <span className="tabular font-medium text-ink-700">{client.job_count}</span> job{client.job_count !== 1 ? 's' : ''}
                        {client.active_job_count > 0 && (
                            <span className="text-brand-600"> · {client.active_job_count} active</span>
                        )}
                        {client.last_job_date && (
                            <span className="text-ink-400"> · last {formatDate(client.last_job_date)}</span>
                        )}
                    </span>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-ink-100 pt-2.5">
                {client.saved ? (
                    <>
                        {confirmingDelete ? (
                            <>
                                <span className="mr-auto text-xs text-rose-600">Delete this client?</span>
                                <button
                                    onClick={() => setConfirmingDelete(false)}
                                    disabled={isDeleting}
                                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                    {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                                    Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-800"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setConfirmingDelete(true)}
                                    aria-label={`Delete ${client.client_name}`}
                                    className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                    >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        Save client
                    </button>
                )}
            </div>
        </div>
    );
}

function ClientModal({
    client,
    onClose,
    onSaved,
}: {
    client: Client | null; // null = brand new; derived clients arrive prefilled with id null
    onClose: () => void;
    onSaved: (client: Client) => void;
}) {
    const isEdit = Boolean(client?.id);
    const [form, setForm] = useState({
        client_name: client?.client_name ?? '',
        contact_name: client?.contact_name ?? '',
        email: client?.email ?? '',
        phone: client?.phone ?? '',
        address: client?.address ?? '',
        city: client?.city ?? '',
        state: client?.state ?? '',
        postal_code: client?.postal_code ?? '',
        notes: client?.notes ?? '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.client_name.trim()) {
            setError('Client name is required');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            const saved = client?.id
                ? await updateClient(client.id, form)
                : await createClient(form);
            onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save client');
            setIsSaving(false);
        }
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-ink-200 px-3.5 text-sm text-ink-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-sm">
            <div className="max-h-[90dvh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl border border-ink-200 bg-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
                    <h2 className="text-base font-medium text-ink-900">
                        {isEdit ? 'Edit client' : 'Add client'}
                    </h2>
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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">
                                Client name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.client_name}
                                onChange={set('client_name')}
                                required
                                disabled={isSaving}
                                className={inputClass}
                                placeholder="Acme Property Group"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">Contact name</label>
                            <input
                                type="text"
                                value={form.contact_name}
                                onChange={set('contact_name')}
                                disabled={isSaving}
                                className={inputClass}
                                placeholder="Jordan Lee"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={set('email')}
                                disabled={isSaving}
                                className={inputClass}
                                placeholder="jordan@acme.com"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={set('phone')}
                                disabled={isSaving}
                                className={inputClass}
                                placeholder="10-digit number"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">Address</label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={set('address')}
                            disabled={isSaving}
                            className={inputClass}
                            placeholder="Street address"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">City</label>
                            <input type="text" value={form.city} onChange={set('city')} disabled={isSaving} className={inputClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">State</label>
                            <input type="text" value={form.state} onChange={set('state')} disabled={isSaving} className={inputClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-700">Postal code</label>
                            <input type="text" value={form.postal_code} onChange={set('postal_code')} disabled={isSaving} className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-700">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={set('notes')}
                            rows={2}
                            disabled={isSaving}
                            className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving…
                                </>
                            ) : isEdit ? (
                                'Save changes'
                            ) : (
                                'Add client'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Truck, Loader2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { getInvite, registerTechnician } from '@/lib/api';

function Shell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sidebar-bg px-4">
            <div className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-[120px]" />

            <div className="relative w-full max-w-sm animate-fade-in">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                        <Truck className="h-7 w-7 text-white" strokeWidth={2.25} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Coordinate</h1>
                        <p className="mt-1 text-sm text-ink-400">{subtitle}</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-lg backdrop-blur-xl">
                    {children}
                </div>
            </div>
        </div>
    );
}

function RegisterForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [status, setStatus] = useState<'validating' | 'ready' | 'invalid' | 'done'>('validating');
    const [invite, setInvite] = useState<{ full_name: string; email: string } | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }
        getInvite(token)
            .then((data) => {
                setInvite(data);
                setStatus('ready');
            })
            .catch(() => setStatus('invalid'));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await registerTechnician(token, password);
            setStatus('done');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Could not complete setup. Please try again.');
            setIsLoading(false);
        }
    };

    if (status === 'validating') {
        return (
            <Shell subtitle="Technician account setup">
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
                    <p className="text-sm text-ink-400">Checking your invite…</p>
                </div>
            </Shell>
        );
    }

    if (status === 'invalid') {
        return (
            <Shell subtitle="Technician account setup">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
                        <AlertCircle className="h-7 w-7 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-white">Invite link not valid</h2>
                        <p className="mt-1 text-sm text-ink-400">
                            This link is invalid or has expired. Ask your team admin to send a new invite.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-brand-300 underline underline-offset-4 hover:text-brand-200"
                    >
                        Back to sign in
                    </Link>
                </div>
            </Shell>
        );
    }

    if (status === 'done') {
        return (
            <Shell subtitle="Technician account setup">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                        <CheckCircle className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-white">Account ready</h2>
                        <p className="mt-1 text-sm text-ink-400">Your password has been set successfully.</p>
                    </div>
                    <div className="mt-2 w-full rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-8 w-8 flex-shrink-0 text-brand-300" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-brand-200">Open the mobile app</p>
                                <p className="mt-0.5 text-xs text-ink-400">
                                    Download the Fleet Coordinate app and log in with your email and new password.
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-ink-500">You can close this page.</p>
                </div>
            </Shell>
        );
    }

    return (
        <Shell subtitle="Technician account setup">
            <h2 className="mb-1 text-lg font-medium text-white">
                Welcome{invite?.full_name ? `, ${invite.full_name.split(' ')[0]}` : ''}
            </h2>
            <p className="mb-6 text-sm text-ink-400">
                Create a password for your technician account, then log in via the mobile app.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                {invite?.email && (
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink-300">Email</label>
                        <input
                            type="email"
                            value={invite.email}
                            disabled
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-ink-400"
                        />
                    </div>
                )}

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-300">New password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-ink-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                        placeholder="Min. 8 characters"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-300">Confirm password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-ink-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                        placeholder="Repeat password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white shadow-brand transition-all hover:bg-brand-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Setting password…
                        </>
                    ) : (
                        'Set password'
                    )}
                </button>
            </form>
        </Shell>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <Shell subtitle="Technician account setup">
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
                    </div>
                </Shell>
            }
        >
            <RegisterForm />
        </Suspense>
    );
}

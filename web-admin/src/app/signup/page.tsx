'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signupAdmin } from '@/lib/api';

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            // Create the admin account (server-side, email pre-confirmed)…
            await signupAdmin({ full_name: fullName.trim(), email: email.trim(), password });

            // …then sign in immediately for a frictionless first session.
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signInError) {
                setError(signInError.message);
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create your account');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sidebar-bg px-4">
            <div className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-[120px]" />

            <div className="relative w-full max-w-sm animate-fade-in">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <Image
                        src="/logo-mark.png"
                        alt="Fleet Coordinate logo"
                        width={56}
                        height={56}
                        className="rounded-2xl ring-1 ring-white/10"
                    />
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Coordinate</h1>
                        <p className="mt-1 text-sm text-ink-400">Create your workspace</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-lg backdrop-blur-xl">
                    <h2 className="mb-6 text-lg font-medium text-white">Create an admin account</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-300">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                autoComplete="name"
                                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-ink-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                                placeholder="Maya Rodriguez"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-300">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-ink-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink-300">
                                Password
                            </label>
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white shadow-brand transition-all hover:bg-brand-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account…
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-ink-400">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-brand-300 transition-colors hover:text-brand-200">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

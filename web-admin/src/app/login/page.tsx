'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        router.push('/');
        router.refresh();
    };

    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sidebar-bg px-4">
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-[120px]" />

            <div className="relative w-full max-w-sm animate-fade-in">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                        <Truck className="h-7 w-7 text-white" strokeWidth={2.25} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-white">Fleet Command</h1>
                        <p className="mt-1 text-sm text-ink-400">Operations dashboard</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-lg backdrop-blur-xl">
                    <h2 className="mb-6 text-lg font-medium text-white">Sign in to your workspace</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                                {error}
                            </div>
                        )}

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
                                autoComplete="current-password"
                                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-ink-500 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                                placeholder="••••••••"
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
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

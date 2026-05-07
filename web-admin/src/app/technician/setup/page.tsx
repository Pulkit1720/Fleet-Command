'use client';

import { useState } from 'react';
import { Truck, Loader2, Smartphone, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TechnicianSetupPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

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
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        // Sign out so technician can't access the admin panel
        await supabase.auth.signOut();
        setDone(true);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                        <Truck className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white">Fleet Command</h1>
                        <p className="mt-1 text-sm text-slate-400">Technician Account Setup</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
                    {done ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                                <CheckCircle className="h-7 w-7 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Account ready!</h2>
                                <p className="mt-1 text-sm text-slate-400">Your password has been set successfully.</p>
                            </div>
                            <div className="mt-2 w-full rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-8 w-8 flex-shrink-0 text-blue-400" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-blue-300">Open the mobile app</p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Download the Fleet Command app and log in with your email and new password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">You can close this page.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="mb-1 text-lg font-semibold text-white">Set your password</h2>
                            <p className="mb-6 text-sm text-slate-400">
                                Create a password for your technician account, then log in via the mobile app.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Repeat password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Setting password…
                                        </>
                                    ) : (
                                        'Set Password'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

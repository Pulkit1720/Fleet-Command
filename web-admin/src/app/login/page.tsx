'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Truck, MapPin, Compass } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Public demo workspace — intentionally shared credentials, seeded with
// sample data. Email invites are disabled server-side for this account.
const DEMO_EMAIL = 'demo@fleetcd.com';
const DEMO_PASSWORD = 'FleetDemo!2026';

const week = [
    { day: 'Sun', date: 22 },
    { day: 'Mon', date: 23 },
    { day: 'Tue', date: 24 },
    { day: 'Wed', date: 25 },
    { day: 'Thu', date: 26 },
    { day: 'Fri', date: 27 },
    { day: 'Sat', date: 28 },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);

    const signIn = async (signInEmail: string, signInPassword: string) => {
        setError('');
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: signInEmail,
            password: signInPassword,
        });

        if (authError) {
            setError(authError.message);
            return false;
        }

        router.push('/');
        router.refresh();
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await signIn(email, password);
        if (!ok) setIsLoading(false);
    };

    const handleDemo = async () => {
        setIsDemoLoading(true);
        const ok = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
        if (!ok) setIsDemoLoading(false);
    };

    return (
        <div className="flex min-h-dvh items-center justify-center bg-ink-300/60 p-4 sm:p-6">
            <div className="grid min-h-[min(92dvh,900px)] w-full max-w-7xl animate-fade-in grid-cols-1 overflow-hidden rounded-[2rem] shadow-lg lg:grid-cols-2">
                {/* ── Left: form panel ─────────────────────────────── */}
                <div className="relative flex flex-col bg-gradient-to-b from-ink-50 via-ink-50 to-brand-100 px-8 py-8 sm:px-14">
                    {/* Logo pill */}
                    <div className="flex items-center">
                        <div className="flex items-center gap-2.5 rounded-full border border-ink-300/70 bg-white/60 py-1.5 pl-2 pr-5 backdrop-blur">
                            <Image
                                src="/logo-transparent.png"
                                alt="Fleet Coordinate logo"
                                width={32}
                                height={32}
                            />
                            <span className="text-sm font-semibold tracking-tight text-ink-800">
                                Fleet Coordinate
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-semibold tracking-tight text-ink-900">
                                Welcome back
                            </h1>
                            <p className="mt-3 text-sm text-ink-500">
                                Sign in to your operations dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-600">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block pl-5 text-sm font-medium text-ink-600">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="you@company.com"
                                    className="w-full rounded-full border border-white bg-white/80 px-5 py-3.5 text-sm text-ink-900 shadow-xs placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block pl-5 text-sm font-medium text-ink-600">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        className="w-full rounded-full border border-white bg-white/80 px-5 py-3.5 pr-12 text-sm text-ink-900 shadow-xs placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isDemoLoading}
                                className="!mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-4 text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

                        {/* Demo access */}
                        <div className="mt-6">
                            <div className="flex items-center gap-3 text-xs text-ink-400">
                                <span className="h-px flex-1 bg-ink-200" />
                                or
                                <span className="h-px flex-1 bg-ink-200" />
                            </div>
                            <button
                                type="button"
                                onClick={handleDemo}
                                disabled={isLoading || isDemoLoading}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-brand-300 bg-white/70 py-3.5 text-sm font-semibold text-brand-700 shadow-xs backdrop-blur transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDemoLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Opening demo…
                                    </>
                                ) : (
                                    <>
                                        <Compass className="h-4 w-4" />
                                        Explore the demo
                                    </>
                                )}
                            </button>
                            <p className="mt-2 text-center text-xs text-ink-400">
                                One click, no sign-up — a sample workspace with live jobs and technicians.
                            </p>
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between text-sm text-ink-500">
                        <p>
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/signup"
                                className="font-medium text-ink-800 underline underline-offset-4 transition-colors hover:text-brand-600"
                            >
                                Sign up
                            </Link>
                        </p>
                        <span className="hidden text-xs text-ink-400 sm:block">
                            Dispatch · Track · Verify
                        </span>
                    </div>
                </div>

                {/* ── Right: dispatch visual panel ─────────────────── */}
                <div className="relative hidden overflow-hidden bg-[#0d1f33] lg:block">
                    {/* ambient glows */}
                    <div className="pointer-events-none absolute -top-24 right-0 h-[380px] w-[380px] rounded-full bg-brand-600/30 blur-[110px]" />
                    <div className="pointer-events-none absolute bottom-0 -left-16 h-[360px] w-[360px] rounded-full bg-sky-500/20 blur-[110px]" />

                    {/* street-map grid + route */}
                    <svg
                        className="absolute inset-0 h-full w-full"
                        viewBox="0 0 700 900"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                    >
                        <g stroke="rgba(255,255,255,0.06)" strokeWidth="2">
                            <line x1="0" y1="140" x2="700" y2="110" />
                            <line x1="0" y1="330" x2="700" y2="300" />
                            <line x1="0" y1="530" x2="700" y2="500" />
                            <line x1="0" y1="730" x2="700" y2="700" />
                            <line x1="120" y1="0" x2="150" y2="900" />
                            <line x1="330" y1="0" x2="360" y2="900" />
                            <line x1="540" y1="0" x2="570" y2="900" />
                        </g>
                        <g stroke="rgba(255,255,255,0.1)" strokeWidth="5">
                            <line x1="0" y1="435" x2="700" y2="405" />
                            <line x1="435" y1="0" x2="465" y2="900" />
                        </g>
                        {/* active route */}
                        <path
                            d="M 135 850 L 148 585 Q 150 545 190 542 L 415 528 Q 452 525 454 488 L 448 260"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="2 14"
                            opacity="0.9"
                        />
                        <circle cx="135" cy="850" r="10" fill="#38bdf8" opacity="0.35" />
                        <circle cx="135" cy="850" r="5" fill="#38bdf8" />
                    </svg>

                    {/* destination pin */}
                    <div className="absolute right-[31%] top-[22%]">
                        <span className="absolute -inset-3 animate-ping rounded-full bg-brand-500/30" />
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 shadow-brand ring-4 ring-brand-500/25">
                            <MapPin className="h-5 w-5 text-white" strokeWidth={2.25} />
                        </div>
                    </div>

                    {/* truck en route */}
                    <div className="absolute left-[42%] top-[56%] flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <Truck className="text-brand-600" size={22} strokeWidth={2.25} />
                    </div>

                    {/* job card stack — top left */}
                    <div className="absolute left-8 top-8">
                        <div className="absolute left-5 top-10 w-64 rounded-2xl bg-[#16283e]/90 px-5 pb-4 pt-9 shadow-lg backdrop-blur">
                            <p className="text-xs text-ink-400">Job #1041 · Completed 8:45am</p>
                        </div>
                        <div className="relative w-64 rounded-2xl bg-brand-500 px-5 py-4 shadow-brand">
                            <div className="flex items-start justify-between">
                                <p className="text-sm font-semibold text-white">New job assigned</p>
                                <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                            </div>
                            <p className="mt-1 text-xs text-brand-100">
                                HVAC Repair · 9:30am–10:00am
                            </p>
                        </div>
                    </div>

                    {/* week strip — center right */}
                    <div className="absolute right-8 top-[38%] rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-lg backdrop-blur-md">
                        <div className="flex gap-4">
                            {week.map(({ day, date }) => (
                                <div key={day} className="flex flex-col items-center gap-1.5">
                                    <span className="text-[11px] text-ink-300">{day}</span>
                                    <span
                                        className={
                                            date === 25
                                                ? 'flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white'
                                                : 'flex h-8 w-8 items-center justify-center text-sm font-medium text-white/90'
                                        }
                                    >
                                        {date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ETA card — bottom left */}
                    <div className="absolute bottom-16 left-10 w-72 rounded-2xl bg-white p-5 shadow-lg">
                        <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-ink-900">Technician en route</p>
                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="mt-1 text-xs text-ink-500">ETA 12 min · Job #1042</p>
                        <div className="mt-4 flex -space-x-2">
                            {['MK', 'JS', 'AR', 'TP'].map((initials, i) => (
                                <div
                                    key={initials}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${
                                        [
                                            'bg-brand-500',
                                            'bg-sky-500',
                                            'bg-emerald-500',
                                            'bg-amber-500',
                                        ][i]
                                    }`}
                                >
                                    {initials}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* tagline — bottom right */}
                    <p className="absolute bottom-6 right-8 text-xs text-ink-400">
                        Live fleet tracking, in one command center
                    </p>
                </div>
            </div>
        </div>
    );
}

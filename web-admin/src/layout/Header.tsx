'use client';

import { Bell, Search } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-ink-200/70 bg-canvas/80 px-7 backdrop-blur-md">
            <div>
                <h1 className="text-[19px] font-semibold tracking-tight text-ink-900">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        type="text"
                        placeholder="Search…"
                        className="h-10 w-56 rounded-xl border border-ink-200 bg-surface pl-9 pr-4 text-sm text-ink-800 shadow-xs transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                    />
                </div>

                {/* Notifications */}
                <button
                    aria-label="Notifications"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-surface text-ink-600 shadow-xs transition-colors hover:border-ink-300 hover:text-ink-900"
                >
                    <Bell className="h-[18px] w-[18px]" />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
                </button>
            </div>
        </header>
    );
}

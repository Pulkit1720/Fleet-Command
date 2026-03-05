'use client';

import { Bell, Search } from 'lucide-react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Notifications */}
                <button className="relative rounded-lg p-2 hover:bg-slate-100">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                </button>
            </div>
        </header>
    );
}
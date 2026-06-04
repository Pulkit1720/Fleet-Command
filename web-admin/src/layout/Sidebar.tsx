'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    Plus,
    Users,
    MapPin,
    Settings,
    Truck,
    LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Jobs', href: '/jobs', icon: ClipboardList },
    { name: 'Create Job', href: '/create-job', icon: Plus },
    { name: 'Technicians', href: '/technicians', icon: Users },
    { name: 'Live Map', href: '/map', icon: MapPin },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const displayEmail = user?.email ?? '';
    const displayName = displayEmail.split('@')[0] ?? 'Admin';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <aside className="fixed left-0 top-0 z-40 h-dvh w-[264px] bg-sidebar-bg">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-20 items-center gap-3 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                        <Truck className="h-5 w-5 text-white" strokeWidth={2.25} />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-white">Fleet Command</h1>
                        <p className="text-xs text-ink-400">Automation Services</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                    <p className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500">
                        Operations
                    </p>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                                    isActive
                                        ? 'bg-white/[0.07] text-white'
                                        : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100'
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
                                )}
                                <item.icon
                                    className={cn(
                                        'h-[18px] w-[18px] transition-colors',
                                        isActive ? 'text-brand-400' : 'text-ink-500 group-hover:text-ink-300'
                                    )}
                                    strokeWidth={2}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-white/[0.03] px-3 py-2.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{displayName}</p>
                            <p className="truncate text-xs text-ink-400">{displayEmail}</p>
                        </div>
                        <button
                            onClick={signOut}
                            title="Sign out"
                            aria-label="Sign out"
                            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

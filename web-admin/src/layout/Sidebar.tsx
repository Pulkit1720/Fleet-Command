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
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">Fleet Command</h1>
                        <p className="text-xs text-slate-400">Automation Services</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col justify-between px-4 py-6">
                    <div className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-400 hover:bg-white/8 hover:text-white'
                                    )}
                                >
                                    <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-slate-400')} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                            <p className="truncate text-xs text-slate-400">{displayEmail}</p>
                        </div>
                        <button
                            onClick={signOut}
                            title="Sign out"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">Fleet Command</h1>
                        <p className="text-xs text-slate-400">Automation Services</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-sidebar-active text-white'
                                        : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-600" />
                        <div>
                            <p className="text-sm font-medium text-white">Admin User</p>
                            <p className="text-xs text-slate-400">admin@fleetcommand.io</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
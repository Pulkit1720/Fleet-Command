import Link from 'next/link';
import { ArrowRight, ClipboardList, MapPin, Plus, Settings, Users } from 'lucide-react';
import Header from '@/layout/Header';
import StatsCards from '@/components/ui/dashboard/StatsCards';

const quickActions = [
    { href: '/create-job', label: 'Create Job', icon: Plus, description: 'Add a new job to the queue' },
    { href: '/jobs', label: 'View Jobs', icon: ClipboardList, description: 'Browse and manage all jobs' },
    { href: '/technicians', label: 'Technicians', icon: Users, description: 'Manage your field team' },
    { href: '/map', label: 'Live Map', icon: MapPin, description: 'Track technicians in real time' },
    { href: '/settings', label: 'Settings', icon: Settings, description: 'Configure your workspace' },
];

export default function DashboardPage() {
    return (
        <>
            <Header title="Dashboard" subtitle="Fleet command center" />
            <div className="space-y-6 p-6">
                <StatsCards stats={null} />

                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Quick Actions
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{action.label}</p>
                                        <p className="text-sm text-slate-500">{action.description}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

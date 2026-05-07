import Header from '@/layout/Header';

export default function SettingsPage() {
    return (
        <>
            <Header title="Settings" subtitle="Configure the dashboard and workspace" />
            <div className="p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-slate-900">Workspace</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            General workspace settings and integrations live here.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium text-slate-900">Notifications</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Notification preferences and account controls can be added here.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
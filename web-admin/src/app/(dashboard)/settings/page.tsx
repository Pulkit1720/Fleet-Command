import Header from '@/layout/Header';

const sections = [
    {
        title: 'Workspace',
        body: 'General workspace settings and integrations live here.',
    },
    {
        title: 'Notifications',
        body: 'Notification preferences and account controls can be added here.',
    },
];

export default function SettingsPage() {
    return (
        <>
            <Header title="Settings" subtitle="Configure the dashboard and workspace" />
            <div className="mx-auto max-w-7xl p-7">
                <div className="grid gap-4 lg:grid-cols-2">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            className="rounded-2xl border border-ink-200 bg-surface p-6 shadow-sm"
                        >
                            <h2 className="font-medium text-ink-900">{section.title}</h2>
                            <p className="mt-2 text-sm text-ink-500">{section.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

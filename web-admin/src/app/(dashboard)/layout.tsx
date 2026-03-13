import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-content-bg">
            <Sidebar />
            <main className="ml-64">{children}</main>
        </div>
    );
}
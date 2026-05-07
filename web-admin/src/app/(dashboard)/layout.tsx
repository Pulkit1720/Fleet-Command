import Sidebar from '@/layout/Sidebar';
import { AuthProvider } from '@/context/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-content-bg">
                <Sidebar />
                <main className="ml-64">{children}</main>
            </div>
        </AuthProvider>
    );
}

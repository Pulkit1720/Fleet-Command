import Sidebar from '@/layout/Sidebar';
import { AuthProvider } from '@/context/AuthContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-dvh bg-canvas">
                <Sidebar />
                <main className="ml-[264px] min-h-dvh">{children}</main>
            </div>
        </AuthProvider>
    );
}

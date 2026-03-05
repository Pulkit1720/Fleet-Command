import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Fleet Command - Admin Dashboard',
    description: 'Fleet Management System for Automation Business',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
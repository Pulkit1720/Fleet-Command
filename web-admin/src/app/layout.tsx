import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Fleet Coordinate — Operations Dashboard',
    description: 'Dispatch, track, and manage your field service fleet in one place.',
    icons: {
        icon: '/logo-mark.png',
        apple: '/logo-mark.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
            <body className="bg-canvas text-ink-900 antialiased">{children}</body>
        </html>
    );
}

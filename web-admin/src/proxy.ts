import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Pages reachable without a session (auth entry points + account setup).
    const isPublicPath =
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/register' ||
        pathname === '/set-password' ||
        pathname === '/technician/setup' ||
        pathname.startsWith('/auth/');

    if (!user) {
        if (isPublicPath) return supabaseResponse;
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // RBAC: the admin dashboard is admin-only. Technicians use the mobile app,
    // so a technician who ends up with a web session must not reach the panel.
    const role = user.user_metadata?.role ?? user.app_metadata?.role;
    const isAdmin = role === 'admin';

    if (!isAdmin) {
        // Account-setup pages stay reachable; everything else is off-limits.
        if (isPublicPath) return supabaseResponse;

        // Clear the session and bounce to login so there's no redirect loop.
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = '?error=not_authorized';
        const redirect = NextResponse.redirect(url);
        for (const cookie of request.cookies.getAll()) {
            if (cookie.name.startsWith('sb-')) redirect.cookies.delete(cookie.name);
        }
        return redirect;
    }

    // Signed-in admins shouldn't sit on the auth entry pages.
    if (pathname === '/login' || pathname === '/signup') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

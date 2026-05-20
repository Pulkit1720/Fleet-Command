import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let token_hash = searchParams.get('token_hash');
    let type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';

    // Supabase double-encodes params when redirectTo already has a query string
    // e.g. ?token_hash%3Dxxx%26type%3Dinvite — decode and re-parse as a fallback
    if (!token_hash) {
        const raw = request.url.split('?')[1] ?? '';
        const decoded = decodeURIComponent(raw);
        const fallback = new URLSearchParams(decoded);
        token_hash = fallback.get('token_hash');
        type = fallback.get('type') as EmailOtpType | null;
    }

    if (token_hash && type) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { data: { user }, error } = await supabase.auth.verifyOtp({ type, token_hash });

        if (!error) {
            if (type === 'invite') {
                // Use user returned directly from verifyOtp — getUser() would read
                // from request cookies which don't yet have the new session.
                const role = user?.user_metadata?.role ?? user?.app_metadata?.role;
                const destination = role === 'technician' ? '/technician/setup' : '/set-password';
                return NextResponse.redirect(new URL(destination, request.url));
            }
            return NextResponse.redirect(new URL(next, request.url));
        }

        console.error('[auth/confirm] verifyOtp failed:', error.message, error);
        const errorParam = encodeURIComponent(error.message ?? 'invalid_token');
        return NextResponse.redirect(new URL(`/login?error=${errorParam}`, request.url));
    }

    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
}

import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';

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

        const { error } = await supabase.auth.verifyOtp({ type, token_hash });

        if (!error) {
            if (type === 'invite') {
                // next param distinguishes technician invites (/technician/setup) from admin invites (/set-password)
                const destination = next !== '/' ? next : '/set-password';
                return NextResponse.redirect(new URL(destination, request.url));
            }
            return NextResponse.redirect(new URL(next, request.url));
        }
    }

    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
}

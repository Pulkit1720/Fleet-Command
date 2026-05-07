import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Job } from '../lib/types';

export interface Technician {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
}

interface AuthContextValue {
    session: Session | null;
    technician: Technician | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    session: null,
    technician: null,
    isLoading: true,
    signIn: async () => null,
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [technician, setTechnician] = useState<Technician | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function fetchTechnician(userId: string) {
        const { data, error } = await supabase
            .from('technicians')
            .select('id, full_name, email, phone, avatar_url, is_active')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return null;
        }
        return data as Technician;
    }

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session: s } }) => {
            setSession(s);
            if (s?.user) {
                const tech = await fetchTechnician(s.user.id);
                setTechnician(tech);
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, s) => {
                setSession(s);
                if (s?.user) {
                    const tech = await fetchTechnician(s.user.id);
                    setTechnician(tech);
                } else {
                    setTechnician(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, technician, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

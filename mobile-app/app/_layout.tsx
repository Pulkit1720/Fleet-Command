import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function RootLayoutNav() {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [invitePending, setInvitePending] = useState(false);

    useEffect(() => {
        const handleInviteUrl = async (url: string) => {
            const fragment = url.split('#')[1];
            if (!fragment) return;
            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const type = params.get('type');
            if (access_token && refresh_token && type === 'invite') {
                await supabase.auth.setSession({ access_token, refresh_token });
                setInvitePending(true);
            }
        };

        Linking.getInitialURL().then((url) => {
            if (url) handleInviteUrl(url);
        });

        const sub = Linking.addEventListener('url', ({ url }) => handleInviteUrl(url));
        return () => sub.remove();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inLoginScreen = segments[0] === 'login';
        const inSetPasswordScreen = segments[0] === 'set-password';

        if (invitePending && !inSetPasswordScreen) {
            router.replace('/set-password');
            return;
        }

        if (!session && !inLoginScreen && !inSetPasswordScreen) {
            router.replace('/login');
        } else if (session && inLoginScreen) {
            router.replace('/(tabs)');
        }
    }, [session, isLoading, segments, invitePending]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#0f172a' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="set-password" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="job/[id]"
                    options={{
                        title: 'Job Details',
                        presentation: 'card',
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

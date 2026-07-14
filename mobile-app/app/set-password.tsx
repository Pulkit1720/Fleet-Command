import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function SetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        router.replace('/(tabs)');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <View style={styles.logoContainer}>
                    <Image source={require('../assets/logo-mark.png')} style={styles.logoIcon} />
                    <Text style={styles.appName}>Fleet Coordinate</Text>
                    <Text style={styles.appSubtitle}>Technician Portal</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>Set your password</Text>
                    <Text style={styles.subtitle}>Create a password to complete your account setup.</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color="#f87171" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.field}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Min. 8 characters"
                                placeholderTextColor="#475569"
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword((v) => !v)}
                                style={styles.eyeBtn}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Repeat password"
                            placeholderTextColor="#475569"
                            secureTextEntry={!showPassword}
                            autoComplete="new-password"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Set Password & Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoIcon: {
        width: 72, height: 72, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16,
    },
    appName: { fontSize: 26, fontWeight: '700', color: '#fff' },
    appSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    form: {
        backgroundColor: '#0f172a', borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: '#1e293b', gap: 16,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#fff' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: -8 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    errorText: { flex: 1, fontSize: 13, color: '#f87171' },
    field: { gap: 6 },
    label: { fontSize: 13, fontWeight: '500', color: '#94a3b8' },
    input: {
        height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
        backgroundColor: '#1e293b', paddingHorizontal: 16, fontSize: 15, color: '#fff',
    },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
    button: {
        height: 52, borderRadius: 12, backgroundColor: '#2563eb',
        alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

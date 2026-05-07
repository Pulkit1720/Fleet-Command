import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import React from 'react';

export default function ProfileScreen() {
    const { technician, signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    const initials = technician?.full_name
        ? technician.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <View style={styles.container}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.name}>{technician?.full_name ?? 'Technician'}</Text>
                <Text style={styles.role}>{technician?.email ?? ''}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>—</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>—</Text>
                    <Text style={styles.statLabel}>On-Site Rate</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>—</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menu}>
                <MenuItem icon="notifications-outline" label="Notifications" />
                <MenuItem icon="location-outline" label="Location Settings" />
                <MenuItem icon="document-text-outline" label="Job History" />
                <MenuItem icon="help-circle-outline" label="Help & Support" />
                <MenuItem icon="log-out-outline" label="Sign Out" isDestructive onPress={handleSignOut} />
            </View>
        </View>
    );
}

function MenuItem({
    icon,
    label,
    isDestructive = false,
    onPress,
}: {
    icon: string;
    label: string;
    isDestructive?: boolean;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
            <Ionicons
                name={icon as any}
                size={22}
                color={isDestructive ? '#dc2626' : '#334155'}
            />
            <Text
                style={[
                    styles.menuLabel,
                    isDestructive && { color: '#dc2626' },
                ]}
            >
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    role: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 20,
        marginTop: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
    },
    menu: {
        marginTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 14,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: '#334155',
    },
});

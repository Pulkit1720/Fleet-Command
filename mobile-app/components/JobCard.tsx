import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../lib/types';
import { formatDistance } from '../lib/location';

interface JobCardProps {
    job: Job;
    onPress: () => void;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
    Emergency: { bg: '#fee2e2', text: '#dc2626' },
    Normal: { bg: '#dbeafe', text: '#2563eb' },
    Low: { bg: '#f1f5f9', text: '#64748b' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
    Assigned: { bg: '#dbeafe', text: '#2563eb' },
    'In Progress': { bg: '#f3e8ff', text: '#9333ea' },
};

export default function JobCard({ job, onPress }: JobCardProps) {
    const priority = priorityColors[job.priority] || priorityColors.Normal;
    const status = statusColors[job.status] || statusColors.Assigned;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.clientName}>{job.client_name}</Text>
                    <Text style={styles.jobNumber}>#{job.job_number}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: priority.bg }]}>
                    <Text style={[styles.badgeText, { color: priority.text }]}>
                        {job.priority}
                    </Text>
                </View>
            </View>

            {/* Badges */}
            <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={[styles.badgeText, { color: '#16a34a' }]}>
                        {job.job_type}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.text }]}>
                        {job.status}
                    </Text>
                </View>
            </View>

            {/* Address */}
            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#94a3b8" />
                <Text style={styles.address} numberOfLines={2}>
                    {job.site_address}
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {job.scheduled_date && (
                    <View style={styles.footerItem}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.footerText}>
                            {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </Text>
                    </View>
                )}
                {job.distance_meters != null && (
                    <View style={styles.footerItem}>
                        <Ionicons name="navigate-outline" size={14} color="#64748b" />
                        <Text style={styles.footerText}>
                            {formatDistance(job.distance_meters)}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {},
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    jobNumber: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 12,
    },
    address: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 13,
        color: '#64748b',
    },
});
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../../lib/types';
import { getJob } from '../../lib/api';
import TruthEngineButton from '../../components/TruthEngineButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const priorityColors: Record<string, string> = {
  Emergency: '#dc2626',
  Normal: '#2563eb',
  Low: '#64748b',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const data = await getJob(id);
        setJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load job');
      } finally {
        setIsLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  const handleStatusUpdate = (updatedJob: Job) => {
    setJob(updatedJob);
  };

  const openInMaps = () => {
    if (!job?.lat || !job?.lng) return;
    const url = `https://maps.apple.com/?daddr=${job.lat},${job.lng}`;
    Linking.openURL(url);
  };

  const callClient = () => {
    if (!job?.client_phone) return;
    Linking.openURL(`tel:${job.client_phone}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Map Preview */}
        {job.lat && job.lng && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: job.lat,
                longitude: job.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: job.lat, longitude: job.lng }}
                pinColor={priorityColors[job.priority] || '#2563eb'}
              />
              {/* Geofence Circle */}
              <Circle
                center={{ latitude: job.lat, longitude: job.lng }}
                radius={job.geofence_radius_meters || 200}
                strokeColor="rgba(37, 99, 235, 0.5)"
                fillColor="rgba(37, 99, 235, 0.1)"
                strokeWidth={2}
              />
            </MapView>
          </View>
        )}

        {/* Job Header */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.clientName}>{job.client_name}</Text>
              <Text style={styles.jobNumber}>Job #{job.job_number}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors[job.priority] || '#64748b' },
              ]}
            >
              <Text style={styles.priorityText}>{job.priority}</Text>
            </View>
          </View>

          {/* Job Type and Status */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.typeBadgeText, { color: '#16a34a' }]}>
                {job.job_type}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.typeBadgeText, { color: '#2563eb' }]}>
                {job.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.addressCard} onPress={openInMaps} activeOpacity={0.7}>
            <Ionicons name="location" size={20} color="#2563eb" />
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>{job.site_address}</Text>
              <Text style={styles.addressAction}>Tap to open in Maps →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        {job.client_phone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity style={styles.contactCard} onPress={callClient} activeOpacity={0.7}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.contactName}>{job.client_name}</Text>
                <Text style={styles.contactPhone}>{job.client_phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {job.scheduled_date
                  ? new Date(job.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                  : 'Not set'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {job.scheduled_time_start
                  ? job.scheduled_time_start.slice(0, 5)
                  : 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Geofence Info */}
        <View style={styles.section}>
          <View style={styles.geofenceInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#2563eb" />
            <Text style={styles.geofenceText}>
              GPS verification required within{' '}
              <Text style={styles.geofenceBold}>
                {job.geofence_radius_meters || 200}m
              </Text>{' '}
              of site to start/complete this job.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Truth Engine Button - Sticky Bottom */}
      {job.status !== 'Unassigned' && job.status !== 'Cancelled' && (
        <TruthEngineButton job={job} onStatusUpdate={handleStatusUpdate} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mapContainer: {
    height: 200,
    width: SCREEN_WIDTH,
  },
  map: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  clientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  jobNumber: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
  addressAction: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  contactPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  geofenceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  geofenceText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  geofenceBold: {
    fontWeight: '700',
  },
});
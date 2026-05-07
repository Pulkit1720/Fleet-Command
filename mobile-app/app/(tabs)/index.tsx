import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Job } from '../../lib/types';
import { getMyJobs, updateMyLocation } from '../../lib/api';
import { getCurrentLocation } from '../../lib/location';
import { useAuth } from '../../context/AuthContext';
import JobCard from '../../components/JobCard';

export default function ScheduleScreen() {
  const router = useRouter();
  const { technician } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!technician) return;
    try {
      setError(null);
      const location = await getCurrentLocation();

      if (location) {
        await updateMyLocation(technician.id, location.latitude, location.longitude).catch(() => { });
        const data = await getMyJobs(technician.id, location.latitude, location.longitude);
        setJobs(data.jobs);
      } else {
        const data = await getMyJobs(technician.id);
        setJobs(data.jobs);
      }
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [technician]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  const handleJobPress = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchJobs}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{jobs.length}</Text>
          <Text style={styles.summaryLabel}>Total Jobs</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#9333ea' }]}>
            {jobs.filter((j) => j.status === 'In Progress').length}
          </Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
            {jobs.filter((j) => j.priority === 'Emergency').length}
          </Text>
          <Text style={styles.summaryLabel}>Emergency</Text>
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Jobs Assigned</Text>
            <Text style={styles.emptySubtitle}>
              Pull down to refresh or check back later.
            </Text>
          </View>
        }
      />
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
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});
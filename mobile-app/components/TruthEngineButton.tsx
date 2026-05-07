import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job, Location } from '../lib/types';
import { getCurrentLocation, calculateDistance, formatDistance } from '../lib/location';
import { updateJobStatus } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface TruthEngineButtonProps {
    job: Job;
    onStatusUpdate: (job: Job) => void;
}

const GEOFENCE_RADIUS = 200; // meters

export default function TruthEngineButton({ job, onStatusUpdate }: TruthEngineButtonProps) {
    const { technician } = useAuth();
    const [location, setLocation] = useState<Location | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isWithinGeofence = distance !== null && distance <= GEOFENCE_RADIUS;
    const canStartJob = job.status === 'Assigned' && isWithinGeofence;
    const canCompleteJob = job.status === 'In Progress' && isWithinGeofence;

    // Get initial location
    useEffect(() => {
        refreshLocation();
    }, []);

    // Calculate distance when location updates
    useEffect(() => {
        if (location && job.lat && job.lng) {
            const dist = calculateDistance(
                location.latitude,
                location.longitude,
                job.lat,
                job.lng
            );
            setDistance(Math.round(dist));
        }
    }, [location, job.lat, job.lng]);

    const refreshLocation = async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const loc = await getCurrentLocation();
            if (loc) {
                setLocation(loc);
            } else {
                setError('Location permission denied');
            }
        } catch (err) {
            setError('Failed to get location');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleStartJob = async () => {
        if (!location || !canStartJob || !technician) return;
        setIsLoading(true);
        setError(null);
        try {
            const updatedJob = await updateJobStatus(
                job.id,
                technician.id,
                'In Progress',
                location.latitude,
                location.longitude
            );
            onStatusUpdate(updatedJob);
        } catch (err: any) {
            setError(err.message || 'Failed to start job');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteJob = async () => {
        if (!location || !canCompleteJob || !technician) return;
        setIsLoading(true);
        setError(null);
        try {
            const updatedJob = await updateJobStatus(
                job.id,
                technician.id,
                'Completed',
                location.latitude,
                location.longitude
            );
            onStatusUpdate(updatedJob);
        } catch (err: any) {
            setError(err.message || 'Failed to complete job');
        } finally {
            setIsLoading(false);
        }
    };

    const getButtonContent = () => {
        if (job.status === 'Completed') {
            return {
                text: 'Job Completed',
                icon: 'checkmark-circle',
                disabled: true,
                onPress: undefined,
                style: styles.completedButton,
            };
        }

        if (job.status === 'In Progress') {
            return {
                text: canCompleteJob ? 'Complete Job' : `Get within ${GEOFENCE_RADIUS}m`,
                icon: canCompleteJob ? 'checkmark-circle' : 'location',
                disabled: !canCompleteJob,
                onPress: handleCompleteJob,
                style: canCompleteJob ? styles.completeButton : styles.disabledButton,
            };
        }

        return {
            text: canStartJob ? 'Start Job' : `Get within ${GEOFENCE_RADIUS}m`,
            icon: canStartJob ? 'play-circle' : 'location',
            disabled: !canStartJob,
            onPress: handleStartJob,
            style: canStartJob ? styles.startButton : styles.disabledButton,
        };
    };

    const button = getButtonContent();

    return (
        <View style={styles.container}>
            {/* Distance Indicator */}
            <View style={styles.distanceContainer}>
                <View style={styles.distanceHeader}>
                    <Text style={styles.distanceLabel}>Distance to Site</Text>
                    <TouchableOpacity onPress={refreshLocation} disabled={isRefreshing}>
                        {isRefreshing ? (
                            <ActivityIndicator size="small" color="#64748b" />
                        ) : (
                            <Ionicons name="refresh" size={18} color="#64748b" />
                        )}
                    </TouchableOpacity>
                </View>

                {distance !== null ? (
                    <View style={styles.distanceRow}>
                        <Ionicons
                            name={isWithinGeofence ? 'checkmark-circle' : 'close-circle'}
                            size={24}
                            color={isWithinGeofence ? '#16a34a' : '#dc2626'}
                        />
                        <Text
                            style={[
                                styles.distanceValue,
                                { color: isWithinGeofence ? '#16a34a' : '#dc2626' },
                            ]}
                        >
                            {formatDistance(distance)}
                        </Text>
                        <Text style={styles.geofenceStatus}>
                            {isWithinGeofence
                                ? '✓ Within geofence'
                                : `Needs to be < ${GEOFENCE_RADIUS}m`}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.locationError}>
                        {error || 'Getting location...'}
                    </Text>
                )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
                style={[styles.actionButton, button.style]}
                onPress={button.onPress}
                disabled={button.disabled || isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons
                            name={button.icon as any}
                            size={24}
                            color={button.disabled ? '#94a3b8' : '#fff'}
                        />
                        <Text
                            style={[
                                styles.buttonText,
                                button.disabled && styles.disabledButtonText,
                            ]}
                        >
                            {button.text}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    distanceContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    distanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    distanceLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    distanceValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    geofenceStatus: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 4,
    },
    locationError: {
        fontSize: 14,
        color: '#dc2626',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        borderRadius: 12,
    },
    startButton: {
        backgroundColor: '#2563eb',
    },
    completeButton: {
        backgroundColor: '#16a34a',
    },
    completedButton: {
        backgroundColor: '#e2e8f0',
    },
    disabledButton: {
        backgroundColor: '#e2e8f0',
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    disabledButtonText: {
        color: '#94a3b8',
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: '#dc2626',
        textAlign: 'center',
    },
});
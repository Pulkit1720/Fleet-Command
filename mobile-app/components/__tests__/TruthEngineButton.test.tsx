import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Job } from '../../lib/types';

const mockTechnician = {
  id: 'tech-1',
  full_name: 'Jane Tech',
  email: 'jane@test.com',
  phone: null,
  avatar_url: null,
  is_active: true,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ technician: mockTechnician }),
}));

const mockGetCurrentLocation = jest.fn();
const mockUpdateJobStatus = jest.fn();

jest.mock('../../lib/location', () => ({
  getCurrentLocation: (...args: unknown[]) => mockGetCurrentLocation(...args),
  calculateDistance: jest.requireActual('../../lib/location').calculateDistance,
  formatDistance: jest.requireActual('../../lib/location').formatDistance,
}));

jest.mock('../../lib/api', () => ({
  updateJobStatus: (...args: unknown[]) => mockUpdateJobStatus(...args),
}));

import TruthEngineButton from '../TruthEngineButton';

const jobSite = { lat: 40.7128, lng: -74.006 };

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    job_number: 1,
    client_name: 'Client',
    client_phone: null,
    job_type: 'Repair',
    priority: 'Normal',
    status: 'Assigned',
    description: null,
    site_address: '123 Main St',
    geofence_radius_meters: 200,
    scheduled_date: null,
    scheduled_time_start: null,
    ...jobSite,
    ...overrides,
  };
}

describe('TruthEngineButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentLocation.mockResolvedValue({
      latitude: jobSite.lat,
      longitude: jobSite.lng,
    });
  });

  it('shows distance and within-geofence status when at job site', async () => {
    render(<TruthEngineButton job={makeJob()} onStatusUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('0m')).toBeTruthy();
    });
    expect(screen.getByText(/Within geofence/)).toBeTruthy();
    expect(screen.getByText('Start Job')).toBeTruthy();
  });

  it('disables start when technician is outside geofence', async () => {
    mockGetCurrentLocation.mockResolvedValue({
      latitude: 40.8,
      longitude: -74.006,
    });

    render(<TruthEngineButton job={makeJob()} onStatusUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Get within 200m/)).toBeTruthy();
    });
    expect(screen.queryByText('Start Job')).toBeNull();
  });

  it('starts job when within geofence and button pressed', async () => {
    const onStatusUpdate = jest.fn();
    const updatedJob = makeJob({ status: 'In Progress' });
    mockUpdateJobStatus.mockResolvedValue(updatedJob);

    render(<TruthEngineButton job={makeJob()} onStatusUpdate={onStatusUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Start Job')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Job'));

    await waitFor(() => {
      expect(mockUpdateJobStatus).toHaveBeenCalledWith(
        'job-1',
        'tech-1',
        'In Progress',
        jobSite.lat,
        jobSite.lng
      );
      expect(onStatusUpdate).toHaveBeenCalledWith(updatedJob);
    });
  });

  it('shows complete button for in-progress job within geofence', async () => {
    render(
      <TruthEngineButton
        job={makeJob({ status: 'In Progress' })}
        onStatusUpdate={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Complete Job')).toBeTruthy();
    });
  });

  it('shows completed state for finished jobs', async () => {
    render(
      <TruthEngineButton
        job={makeJob({ status: 'Completed' })}
        onStatusUpdate={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Job Completed')).toBeTruthy();
    });
  });

  it('shows error when location permission denied', async () => {
    mockGetCurrentLocation.mockResolvedValue(null);

    render(<TruthEngineButton job={makeJob()} onStatusUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Location permission denied').length).toBeGreaterThan(0);
    });
  });

  it('displays API error when start job fails', async () => {
    mockUpdateJobStatus.mockRejectedValue(
      new Error('Geofence verification failed')
    );

    render(<TruthEngineButton job={makeJob()} onStatusUpdate={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Start Job')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Start Job'));

    await waitFor(() => {
      expect(screen.getByText('Geofence verification failed')).toBeTruthy();
    });
  });
});

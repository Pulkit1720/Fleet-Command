import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import JobCard from '../JobCard';
import { Job } from '../../lib/types';

const baseJob: Job = {
  id: 'job-1',
  job_number: 1042,
  client_name: 'Acme Corp',
  client_phone: null,
  job_type: 'Repair',
  priority: 'Emergency',
  status: 'Assigned',
  description: null,
  site_address: '123 Main St, New York, NY',
  lat: 40.7128,
  lng: -74.006,
  geofence_radius_meters: 200,
  scheduled_date: '2024-06-15',
  scheduled_time_start: '09:00',
  distance_meters: 450,
};

describe('JobCard', () => {
  it('renders client name, job number, and address', () => {
    render(<JobCard job={baseJob} onPress={jest.fn()} />);

    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('#1042')).toBeTruthy();
    expect(screen.getByText('123 Main St, New York, NY')).toBeTruthy();
  });

  it('renders priority, job type, and status badges', () => {
    render(<JobCard job={baseJob} onPress={jest.fn()} />);

    expect(screen.getByText('Emergency')).toBeTruthy();
    expect(screen.getByText('Repair')).toBeTruthy();
    expect(screen.getByText('Assigned')).toBeTruthy();
  });

  it('shows formatted distance when distance_meters is set', () => {
    render(<JobCard job={baseJob} onPress={jest.fn()} />);
    expect(screen.getByText('450m')).toBeTruthy();
  });

  it('shows scheduled date when present', () => {
    render(<JobCard job={baseJob} onPress={jest.fn()} />);
    expect(screen.getByText(/Jun/)).toBeTruthy();
    expect(screen.getByText(/15/)).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    render(<JobCard job={baseJob} onPress={onPress} />);

    fireEvent.press(screen.getByText('Acme Corp'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to Normal priority colors for unknown priority', () => {
    const job = { ...baseJob, priority: 'Unknown' as Job['priority'] };
    render(<JobCard job={job} onPress={jest.fn()} />);
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('formats kilometer distance in footer', () => {
    const job = { ...baseJob, distance_meters: 1500 };
    render(<JobCard job={job} onPress={jest.fn()} />);
    expect(screen.getByText('1.5km')).toBeTruthy();
  });
});

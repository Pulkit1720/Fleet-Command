import * as ExpoLocation from 'expo-location';
import {
  calculateDistance,
  formatDistance,
  getCurrentLocation,
  requestLocationPermission,
} from '../location';

const mockRequestPermission =
  ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = ExpoLocation.getCurrentPositionAsync as jest.Mock;

describe('calculateDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(calculateDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('calculates distance between two NYC points (~1.4 km)', () => {
    const distance = calculateDistance(40.7484, -73.9857, 40.758, -73.9855);
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(2000);
  });

  it('is symmetric', () => {
    const d1 = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
    const d2 = calculateDistance(34.0522, -118.2437, 37.7749, -122.4194);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe('formatDistance', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(150)).toBe('150m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('formats kilometer distances with one decimal', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(2500)).toBe('2.5km');
  });
});

describe('requestLocationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when permission is granted', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    await expect(requestLocationPermission()).resolves.toBe(true);
  });

  it('returns false when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    await expect(requestLocationPermission()).resolves.toBe(false);
  });
});

describe('getCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(mockGetPosition).not.toHaveBeenCalled();
  });

  it('returns latitude and longitude when permission granted', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.006 },
    });

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: 40.7128,
      longitude: -74.006,
    });
    expect(mockGetPosition).toHaveBeenCalledWith({
      accuracy: ExpoLocation.Accuracy.High,
    });
  });

  it('returns null and logs when getCurrentPositionAsync throws', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockRejectedValue(new Error('GPS unavailable'));

    await expect(getCurrentLocation()).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});

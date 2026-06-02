import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

describe('geocodingService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  async function loadGeocoding() {
    return import('../geocodingService.js');
  }

  describe('geocodeAddress', () => {
    it('returns null coordinates when MAPBOX token is missing', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = '';
      const { geocodeAddress } = await loadGeocoding();

      const result = await geocodeAddress('123 Main St');

      expect(result).toEqual({
        lat: null,
        lng: null,
        formattedAddress: '123 Main St',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns lat, lng, and formatted address from Mapbox response', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { geocodeAddress } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({
          features: [
            {
              center: [-74.006, 40.7128],
              place_name: 'New York, NY, USA',
            },
          ],
        }),
      });

      const result = await geocodeAddress('New York');

      expect(result).toEqual({
        lat: 40.7128,
        lng: -74.006,
        formattedAddress: 'New York, NY, USA',
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('mapbox.places/New%20York.json')
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('access_token=test-token')
      );
    });

    it('throws when no features are returned', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { geocodeAddress } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({ features: [] }),
      });

      await expect(geocodeAddress('nowhere')).rejects.toThrow('Address not found');
    });

    it('throws and logs when fetch fails', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { geocodeAddress } = await loadGeocoding();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetch.mockRejectedValue(new Error('network error'));

      await expect(geocodeAddress('NYC')).rejects.toThrow('network error');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('reverseGeocode', () => {
    it('throws when MAPBOX token is missing', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = '';
      const { reverseGeocode } = await loadGeocoding();

      await expect(reverseGeocode(40.7128, -74.006)).rejects.toThrow(
        'Mapbox access token not configured'
      );
    });

    it('returns place name from coordinates', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { reverseGeocode } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({
          features: [{ place_name: 'Manhattan, New York, NY' }],
        }),
      });

      const result = await reverseGeocode(40.7128, -74.006);

      expect(result).toBe('Manhattan, New York, NY');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('-74.006,40.7128.json')
      );
    });

    it('returns null when no features found', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { reverseGeocode } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({ features: [] }),
      });

      const result = await reverseGeocode(0, 0);
      expect(result).toBeNull();
    });
  });

  describe('autocompleteAddress', () => {
    it('throws when MAPBOX token is missing', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = '';
      const { autocompleteAddress } = await loadGeocoding();

      await expect(autocompleteAddress('main')).rejects.toThrow(
        'Mapbox access token not configured'
      );
    });

    it('maps features to suggestion objects', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { autocompleteAddress } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({
          features: [
            {
              id: 'place.1',
              place_name: '123 Main St, City',
              center: [-74.0, 40.7],
            },
            {
              id: 'place.2',
              place_name: '456 Main Ave, City',
              center: [-74.1, 40.8],
            },
          ],
        }),
      });

      const results = await autocompleteAddress('main st');

      expect(results).toEqual([
        { id: 'place.1', address: '123 Main St, City', lat: 40.7, lng: -74.0 },
        { id: 'place.2', address: '456 Main Ave, City', lat: 40.8, lng: -74.1 },
      ]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('autocomplete=true')
      );
    });

    it('returns empty array when features is empty', async () => {
      process.env.MAPBOX_ACCESS_TOKEN = 'test-token';
      const { autocompleteAddress } = await loadGeocoding();

      fetch.mockResolvedValue({
        json: async () => ({ features: [] }),
      });

      const results = await autocompleteAddress('xyz');
      expect(results).toEqual([]);
    });
  });
});

import dotenv from 'dotenv';

dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export async function geocodeAddress(address) {
    if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox access could not be configured');
    }
    const encodedaddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedaddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            throw new Error('Address not found');
        }

        const [lng, lat] = data.features[0].center;
        const formattedAddress = data.features[0].place_name;

        return {
            lat,
            lng,
            formattedAddress
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

export async function reverseGeocode(lat, lng) {
    if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox access token not configured');
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            return null;
        }

        return data.features[0].place_name;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
}

export async function autocompleteAddress(query) {
    if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox access token not configured');
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&types=address,poi`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.features.map(feature => ({
            id: feature.id,
            address: feature.place_name,
            lat: feature.center[1],
            lng: feature.center[0]
        }));
    } catch (error) {
        console.error('Autocomplete error:', error);
        throw error;
    }
}
import supabase from '../config/supabase.js';

//Calculate distance b/w two coordinates using Haversine formula
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; //Earth's radius in meters
    const dLat = toRad(lat2 - lat1); //Radain conversion of degree
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}

//Check if technician is within geofence
export function isWithinGeofence(techLat, techLng, jobLat, jobLng, radiusMeters = 200) {
    const distance = calculateDistance(techLat, techLng, jobLat, jobLng);
    return {
        isWithin: distance <= radiusMeters,
        distance: Math.round(distance)
    };
}

//Log truth entry
export async function logTruthEntry(data) {
    const {
        jobId,
        technicianId,
        action,
        techLat,
        techLng,
        jobLat,
        jobLng,
        geofenceRadius = 200,
        deviceInfo = null
    } = data;

    const distance = calculateDistance(techLat, techLng, jobLat, jobLng);
    const withinGeofence = distance <= geofenceRadius;

    const { data: logEntry, error } = await supabase
        .from('logs')
        .insert({
            job_id: jobId,
            technician_id: technicianId,
            action,
            recorded_lat: techLat,
            recorded_lng: techLng,
            distance_from_site_meters: Math.round(distance),
            within_geofence: withinGeofence,
            device_info: deviceInfo
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return logEntry;
}

//Get truth logs for a job
export async function getJobTruthLogs(jobId) {
    const { data, error } = await supabase
        .from('logs')
        .select(`
        *,
        technician:techncians(id, full_name, email)
        `)
        .eq('job_id', jobId)
        .order('timestamp', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}
import supabase from '../config/supabase.js';
import { geocodeAddress, autocompleteAddress } from '../services/geocodingService.js';
import { logTruthEntry, isWithinGeofence, getJobTruthLogs } from '../services/truthEngineService.js';

// Get all jobs with optional filters
export async function getJobs(req, res, next) {
    try {
        const {
            status,
            priority,
            technician_id,
            date,
            limit = 50,
            offset = 0
        } = req.query;

        let query = supabase
            .from('jobs')
            .select(`
        *,
        assigned_technician:technicians(id, full_name, email, phone)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (technician_id) query = query.eq('assigned_technician_id', technician_id);
        if (date) query = query.eq('scheduled_date', date);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            jobs: data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        next(error);
    }
}

// Get single job by ID
export async function getJob(req, res, next) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('jobs')
            .select(`
        *,
        assigned_technician:technicians(id, full_name, email, phone, avatar_url)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
}

// Create new job with geocoding
export async function createJob(req, res, next) {
    try {
        const {
            client_name,
            client_phone,
            client_email,
            job_type,
            priority = 'Normal',
            description,
            site_address,
            lat,
            lng,
            assigned_technician_id,
            scheduled_date,
            scheduled_time_start,
            scheduled_time_end,
            estimated_duration_minutes,
            notes
        } = req.body;

        // Geocode address if lat/lng not provided
        let finalLat = lat;
        let finalLng = lng;
        let finalAddress = site_address;

        if (!lat || !lng) {
            const geocoded = await geocodeAddress(site_address);
            finalLat = geocoded.lat;
            finalLng = geocoded.lng;
            finalAddress = geocoded.formattedAddress;
        }

        const { data, error } = await supabase
            .from('jobs')
            .insert({
                client_name,
                client_phone,
                client_email,
                job_type,
                priority,
                status: assigned_technician_id ? 'Assigned' : 'Unassigned',
                description,
                site_address: finalAddress,
                lat: finalLat,
                lng: finalLng,
                assigned_technician_id,
                scheduled_date,
                scheduled_time_start,
                scheduled_time_end,
                estimated_duration_minutes,
                notes
            })
            .select(`
        *,
        assigned_technician:technicians(id, full_name, email, phone)
      `)
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
}

// Update job
export async function updateJob(req, res, next) {
    try {
        const { id } = req.params;
        const updates = req.body;

        // If address changed, re-geocode
        if (updates.site_address && !updates.lat && !updates.lng) {
            const geocoded = await geocodeAddress(updates.site_address);
            updates.lat = geocoded.lat;
            updates.lng = geocoded.lng;
            updates.site_address = geocoded.formattedAddress;
        }

        const { data, error } = await supabase
            .from('jobs')
            .update(updates)
            .eq('id', id)
            .select(`
        *,
        assigned_technician:technicians(id, full_name, email, phone)
      `)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
}

// Update job status with Truth Engine verification
export async function updateJobStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status, technician_id, tech_lat, tech_lng, device_info } = req.body;

        // Get job details
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (jobError) throw jobError;

        // For status changes that require presence verification
        const requiresVerification = ['In Progress', 'Completed'].includes(status);

        if (requiresVerification && tech_lat && tech_lng) {
            const geofenceCheck = isWithinGeofence(
                tech_lat,
                tech_lng,
                job.lat,
                job.lng,
                job.geofence_radius_meters
            );

            // Log the truth entry
            await logTruthEntry({
                jobId: id,
                technicianId: technician_id,
                action: status === 'In Progress' ? 'job_started' : 'job_completed',
                techLat: tech_lat,
                techLng: tech_lng,
                jobLat: job.lat,
                jobLng: job.lng,
                geofenceRadius: job.geofence_radius_meters,
                deviceInfo: device_info
            });

            // Return error if not within geofence (but still log the attempt)
            if (!geofenceCheck.isWithin) {
                return res.status(403).json({
                    error: 'Geofence verification failed',
                    distance: geofenceCheck.distance,
                    required_distance: job.geofence_radius_meters,
                    message: `You are ${geofenceCheck.distance}m from the job site. Must be within ${job.geofence_radius_meters}m.`
                });
            }
        }

        // Update timestamps based on status
        const updateData = { status };
        if (status === 'In Progress') {
            updateData.actual_start_time = new Date().toISOString();
        } else if (status === 'Completed') {
            updateData.actual_end_time = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('jobs')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        assigned_technician:technicians(id, full_name, email, phone)
      `)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
}

// Get job stats
export async function getJobStats(req, res, next) {
    try {
        const { data, error } = await supabase
            .from('job_stats')
            .select('*')
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        next(error);
    }
}

// Autocomplete address
export async function searchAddress(req, res, next) {
    try {
        const { q } = req.query;

        if (!q || q.length < 3) {
            return res.json([]);
        }

        const suggestions = await autocompleteAddress(q);
        res.json(suggestions);
    } catch (error) {
        next(error);
    }
}

// Get truth logs for a job
export async function getJobLogs(req, res, next) {
    try {
        const { id } = req.params;
        const logs = await getJobTruthLogs(id);
        res.json(logs);
    } catch (error) {
        next(error);
    }
}

// Check geofence status
export async function checkGeofence(req, res, next) {
    try {
        const { id } = req.params;
        const { tech_lat, tech_lng } = req.query;

        if (!tech_lat || !tech_lng) {
            return res.status(400).json({ error: 'tech_lat and tech_lng required' });
        }

        const { data: job, error } = await supabase
            .from('jobs')
            .select('lat, lng, geofence_radius_meters')
            .eq('id', id)
            .single();

        if (error) throw error;

        const result = isWithinGeofence(
            parseFloat(tech_lat),
            parseFloat(tech_lng),
            job.lat,
            job.lng,
            job.geofence_radius_meters
        );

        res.json({
            within_geofence: result.isWithin,
            distance_meters: result.distance,
            geofence_radius: job.geofence_radius_meters
        });
    } catch (error) {
        next(error);
    }
}
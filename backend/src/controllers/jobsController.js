import supabase from '../config/supabase.js';
import { geocodeAddress, autocompleteAddress } from '../services/geocodingService.js';
import { logTruthEntry, isWithinGeofence, getJobTruthLogs } from '../services/truthEngineService.js';

function minutesToTimeValue(minutes) {
    const parsedMinutes = Number(minutes);

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
        return null;
    }

    const hours = Math.floor(parsedMinutes / 60)
        .toString()
        .padStart(2, '0');
    const remainingMinutes = Math.round(parsedMinutes % 60)
        .toString()
        .padStart(2, '0');

    return `${hours}:${remainingMinutes}:00`;
}

function timeValueToMinutes(timeValue) {
    if (timeValue == null) {
        return null;
    }

    if (typeof timeValue === 'number') {
        return timeValue;
    }

    const parts = String(timeValue).split(':').map((part) => Number(part));
    if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) {
        return null;
    }

    const [hours, minutes, seconds = 0] = parts;
    return hours * 60 + minutes + Math.round(seconds / 60);
}

function normalizeJobRecord(job) {
    if (!job) {
        return job;
    }

    return {
        ...job,
        estimated_duration_minutes: timeValueToMinutes(job.estimated_duration_minutes),
    };
}

const TECH_JOIN = 'assigned_technician(id, full_name, email, phone)';
const TECH_JOIN_AVATAR = 'assigned_technician(id, full_name, email, phone, avatar_url)';

// Fallback durations by job type, used when no explicit duration or
// start/end times are provided.
const DEFAULT_DURATION_MINUTES = {
    'Repair': 120,
    'Install': 180,
    'Ongoing Install': 240,
    'Maintenance': 90,
    'Inspection': 60,
};

// Duration is derived automatically: explicit value > scheduled time window
// > job-type default.
function deriveDurationMinutes({
    estimated_duration_minutes,
    scheduled_time_start,
    scheduled_time_end,
    job_type,
}) {
    const explicit = Number(estimated_duration_minutes);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;

    const start = timeValueToMinutes(scheduled_time_start);
    const end = timeValueToMinutes(scheduled_time_end);
    if (start != null && end != null && end > start) return end - start;

    return DEFAULT_DURATION_MINUTES[job_type] ?? 120;
}

// Date-based job numbers: YYMMDDNNN (e.g. 260715001 = first job created on
// 2026-07-15). Fits comfortably in the existing integer column.
async function nextJobNumber() {
    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const prefix = Number(yymmdd) * 1000;

    const { data, error } = await supabase
        .from('jobs')
        .select('job_number')
        .gte('job_number', prefix)
        .lte('job_number', prefix + 999)
        .order('job_number', { ascending: false })
        .limit(1);

    if (error) throw error;

    const last = Array.isArray(data) && data[0] ? Number(data[0].job_number) : null;
    return last ? last + 1 : prefix + 1;
}

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
            .select(`*, ${TECH_JOIN}`, { count: 'exact' })
            .eq('created_by', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (technician_id) query = query.eq('assigned_technician', technician_id);
        if (date) query = query.eq('scheduled_date', date);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            jobs: data.map(normalizeJobRecord),
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
            .select(`*, ${TECH_JOIN_AVATAR}`)
            .eq('id', id)
            .eq('created_by', req.user.id)
            .single();

        if (error) throw error;

        res.json(normalizeJobRecord(data));
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
            assigned_technician_id,   // frontend sends this name
            scheduled_date,
            scheduled_time_start,
            scheduled_time_end,
            estimated_duration_minutes,
            notes
        } = req.body;

        let finalLat = lat;
        let finalLng = lng;
        let finalAddress = site_address;

        if (!lat || !lng) {
            const geocoded = await geocodeAddress(site_address);
            finalLat = geocoded.lat;
            finalLng = geocoded.lng;
            finalAddress = geocoded.formattedAddress;
        }

        const durationMinutes = deriveDurationMinutes({
            estimated_duration_minutes,
            scheduled_time_start,
            scheduled_time_end,
            job_type,
        });

        const { data, error } = await supabase
            .from('jobs')
            .insert({
                job_number: await nextJobNumber(),
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
                assigned_technician: assigned_technician_id || null,  // DB column name
                scheduled_date,
                scheduled_time_start,
                scheduled_time_end,
                estimated_duration_minutes: minutesToTimeValue(durationMinutes),
                notes,
                created_by: req.user.id
            })
            .select(`*, ${TECH_JOIN}`)
            .single();

        if (error) throw error;

        res.status(201).json(normalizeJobRecord(data));
    } catch (error) {
        next(error);
    }
}

// Update job
export async function updateJob(req, res, next) {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Map frontend field name to DB column name
        if ('assigned_technician_id' in updates) {
            updates.assigned_technician = updates.assigned_technician_id || null;
            delete updates.assigned_technician_id;
        }

        if (updates.estimated_duration_minutes !== undefined) {
            updates.estimated_duration_minutes = minutesToTimeValue(updates.estimated_duration_minutes);
        }

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
            .eq('created_by', req.user.id)
            .select(`*, ${TECH_JOIN}`)
            .single();

        if (error) throw error;

        res.json(normalizeJobRecord(data));
    } catch (error) {
        next(error);
    }
}

// Update job status with Truth Engine verification
export async function updateJobStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status, technician_id, tech_lat, tech_lng, device_info } = req.body;

        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (jobError) throw jobError;

        const requiresVerification = ['In Progress', 'Completed'].includes(status);

        if (requiresVerification && tech_lat && tech_lng) {
            const geofenceCheck = isWithinGeofence(
                tech_lat,
                tech_lng,
                job.lat,
                job.lng,
                job.geofence_radius_meters
            );

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

            if (!geofenceCheck.isWithin) {
                return res.status(403).json({
                    error: 'Geofence verification failed',
                    distance: geofenceCheck.distance,
                    required_distance: job.geofence_radius_meters,
                    message: `You are ${geofenceCheck.distance}m from the job site. Must be within ${job.geofence_radius_meters}m.`
                });
            }
        }

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
            .select(`*, ${TECH_JOIN}`)
            .single();

        if (error) throw error;

        res.json(normalizeJobRecord(data));
    } catch (error) {
        next(error);
    }
}

// Get job stats scoped to the requesting admin.
// The `job_stats` view aggregates ALL jobs, so we compute the same shape here
// over only this admin's jobs.
export async function getJobStats(req, res, next) {
    try {
        const now = new Date();
        const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

        // Start of the current week (Monday) and month, as YYYY-MM-DD (UTC,
        // matching how `today` is derived above).
        const weekStartDate = new Date(now);
        weekStartDate.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
        const weekStart = weekStartDate.toISOString().slice(0, 10);
        const monthStart = `${today.slice(0, 8)}01`;

        const { data, error } = await supabase
            .from('jobs')
            .select('status, priority, scheduled_date, actual_end_time, updated_at')
            .eq('created_by', req.user.id);

        if (error) throw error;

        const stats = {
            unassigned_count: 0,
            assigned_count: 0,
            in_progress_count: 0,
            completed_count: 0,
            completed_today_count: 0,
            completed_week_count: 0,
            completed_month_count: 0,
            emergency_count: 0,
            today_count: 0,
            total_count: data.length,
        };

        for (const job of data) {
            if (job.status === 'Unassigned') stats.unassigned_count++;
            else if (job.status === 'Assigned') stats.assigned_count++;
            else if (job.status === 'In Progress') stats.in_progress_count++;
            else if (job.status === 'Completed') {
                stats.completed_count++;
                const completedAt = (job.actual_end_time || job.updated_at || '').slice(0, 10);
                if (completedAt === today) stats.completed_today_count++;
                if (completedAt && completedAt >= weekStart && completedAt <= today) {
                    stats.completed_week_count++;
                }
                if (completedAt && completedAt >= monthStart && completedAt <= today) {
                    stats.completed_month_count++;
                }
            }

            if (job.priority === 'Emergency' && !['Completed', 'Cancelled'].includes(job.status)) {
                stats.emergency_count++;
            }
            if (job.scheduled_date === today) stats.today_count++;
        }

        res.json(stats);
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

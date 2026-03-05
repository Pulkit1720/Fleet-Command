import supabase from '../config/supabase.js';
import { calculateDistance } from '../services/truthEngineService.js';

// Get all technicians
export async function getTechnicians(req, res, next) {
  try {
    const { is_active } = req.query;

    let query = supabase
      .from('technicians')
      .select('*')
      .order('full_name');

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Get single technician
export async function getTechnician(req, res, next) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Update technician location
export async function updateLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    const { data, error } = await supabase
      .from('technicians')
      .update({
        current_lat: lat,
        current_lng: lng,
        last_location_update: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Get jobs for a technician sorted by distance
export async function getTechnicianJobs(req, res, next) {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    // Get technician
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();

    if (techError) throw techError;

    // Get assigned jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('assigned_technician_id', id)
      .in('status', ['Assigned', 'In Progress'])
      .order('scheduled_date');

    if (jobsError) throw jobsError;

    // Calculate distance for each job if location provided
    const techLat = parseFloat(lat) || technician.current_lat;
    const techLng = parseFloat(lng) || technician.current_lng;

    let jobsWithDistance = jobs.map(job => ({
      ...job,
      distance_meters: techLat && techLng && job.lat && job.lng
        ? Math.round(calculateDistance(techLat, techLng, job.lat, job.lng))
        : null
    }));

    // Sort by distance if available
    if (techLat && techLng) {
      jobsWithDistance.sort((a, b) => {
        if (a.distance_meters === null) return 1;
        if (b.distance_meters === null) return -1;
        return a.distance_meters - b.distance_meters;
      });
    }

    res.json({
      technician,
      jobs: jobsWithDistance
    });
  } catch (error) {
    next(error);
  }
}
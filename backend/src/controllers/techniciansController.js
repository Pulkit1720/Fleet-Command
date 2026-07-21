import supabase from '../config/supabase.js';
import { calculateDistance } from '../services/truthEngineService.js';
import { sendTechnicianInvite } from '../services/emailService.js';
import { generateInviteToken } from '../services/inviteTokenService.js';

// Public demo account (credentials are intentionally public on the login page)
const DEMO_ADMIN_EMAIL = 'demo@fleetcd.com';

// Get all technicians
export async function getTechnicians(req, res, next) {
  try {
    const { is_active } = req.query;

    // Scope to the technicians owned by the requesting admin
    let query = supabase
      .from('technicians')
      .select('*')
      .eq('admin_id', req.user.id)
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

// Invite a new technician via email
export async function inviteTechnician(req, res, next) {
  try {
    // Only admins may invite technicians
    const role = req.user?.user_metadata?.role ?? req.user?.app_metadata?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only an admin can invite technicians' });
    }

    // The public demo workspace must not send real invite emails
    if (req.user?.email === DEMO_ADMIN_EMAIL) {
      return res.status(403).json({
        error: 'Invites are disabled in the demo workspace',
      });
    }

    const { full_name, email, phone } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'full_name and email are required' });
    }

    // Check if a completed technician record already exists
    const { data: existing } = await supabase
      .from('technicians')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'A technician with this email already exists' });
    }

    const webAdminUrl = process.env.WEB_ADMIN_URL || 'http://localhost:8080';

    // The inviting admin's display name powers the "<name> invited you" email.
    const inviterName =
      req.user?.user_metadata?.full_name?.trim() ||
      req.user?.email ||
      null;

    // Create the auth user with a confirmed email but no password yet — the
    // technician sets their own password on the /register page. We deliberately
    // avoid Supabase magic links: those are single-use, so email-security
    // scanners that pre-fetch links consume the token before the human clicks.
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name, role: 'technician' },
      });

    if (createError) {
      const alreadyExists =
        createError.status === 422 ||
        /already.*registered|already.*exists/i.test(createError.message || '');
      if (alreadyExists) {
        return res
          .status(409)
          .json({ error: 'A technician with this email already exists' });
      }
      throw createError;
    }

    const userId = created.user?.id;

    // Our own invite token (only the hash is stored). The /register page
    // validates it read-only, so a scanner hitting the link can't burn it.
    const { token, hash, expiresAt } = generateInviteToken();
    const inviteUrl = `${webAdminUrl}/register?token=${token}`;

    // Create technician record linked to the new auth user, owned by this admin
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .insert({
        user_id: userId,
        admin_id: req.user.id,
        full_name,
        email,
        phone: phone || null,
        is_active: true,
        invite_token_hash: hash,
        invite_token_expires_at: expiresAt,
      })
      .select()
      .single();

    if (techError) {
      // Don't leave an orphaned auth user if the row insert fails
      if (userId) await supabase.auth.admin.deleteUser(userId);
      throw techError;
    }

    // Deliver the invite. If email fails, roll back the half-created technician
    // and auth user so the admin can simply retry once email works again —
    // otherwise the leftover records make the retry fail with "already exists".
    try {
      await sendTechnicianInvite({ to: email, full_name, inviterName, inviteUrl });
    } catch (emailError) {
      await supabase.from('technicians').delete().eq('id', technician.id);
      if (userId) {
        await supabase.auth.admin.deleteUser(userId);
      }
      console.error(
        `Invite email to ${email} failed, rolled back technician ${technician.id}:`,
        emailError.message
      );
      return res.status(502).json({
        error:
          'The invite email could not be sent, so nothing was created. Fix the email settings and retry.',
      });
    }

    res.status(201).json(technician);
  } catch (error) {
    next(error);
  }
}

// Update a technician's profile (name, phone, active status)
export async function updateTechnician(req, res, next) {
  try {
    const role = req.user?.user_metadata?.role ?? req.user?.app_metadata?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only an admin can update technicians' });
    }

    const { id } = req.params;
    const { full_name, phone, is_active } = req.body;

    const updates = {};
    if (full_name !== undefined) {
      if (!String(full_name).trim()) {
        return res.status(400).json({ error: 'full_name cannot be empty' });
      }
      updates.full_name = String(full_name).trim();
    }
    if (phone !== undefined) {
      // DB check constraint requires exactly 10 digits when phone is set
      const digits = phone == null ? '' : String(phone).replace(/\D/g, '');
      if (digits && !/^\d{10}$/.test(digits)) {
        return res.status(400).json({ error: 'Phone must be exactly 10 digits' });
      }
      updates.phone = digits || null;
    }
    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    // Scoped to this admin's own technicians
    const { data, error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .eq('admin_id', req.user.id)
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      return res.status(404).json({ error: 'Technician not found' });
    }
    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Delete a technician: open jobs go back to Unassigned, their login is removed
export async function deleteTechnician(req, res, next) {
  try {
    const role = req.user?.user_metadata?.role ?? req.user?.app_metadata?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only an admin can delete technicians' });
    }

    // The public demo workspace is shared — keep its seeded team intact
    if (req.user?.email === DEMO_ADMIN_EMAIL) {
      return res.status(403).json({
        error: 'Deleting technicians is disabled in the demo workspace',
      });
    }

    const { id } = req.params;

    // Ownership check, and we need user_id to remove the auth account
    const { data: technician, error: fetchError } = await supabase
      .from('technicians')
      .select('id, user_id')
      .eq('id', id)
      .eq('admin_id', req.user.id)
      .single();

    if (fetchError || !technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Return their open jobs to the unassigned pool (the FK would only null
    // the technician, leaving jobs stuck in Assigned/In Progress)
    const { error: jobsError } = await supabase
      .from('jobs')
      .update({ assigned_technician: null, status: 'Unassigned' })
      .eq('assigned_technician', id)
      .in('status', ['Assigned', 'In Progress']);

    if (jobsError) throw jobsError;

    const { error: deleteError } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id);

    if (deleteError) {
      // job_attachments.uploaded_by has no ON DELETE action, so the FK blocks
      if (deleteError.code === '23503') {
        return res.status(409).json({
          error:
            'This technician has uploaded job attachments and cannot be deleted. Mark them inactive instead.',
        });
      }
      throw deleteError;
    }

    // Remove the login so the deleted technician can no longer sign in
    if (technician.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(
        technician.user_id
      );
      if (authError) {
        console.error(
          `Technician ${id} deleted but auth user cleanup failed:`,
          authError.message
        );
      }
    }

    res.json({ ok: true });
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
      .eq('assigned_technician', id)
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
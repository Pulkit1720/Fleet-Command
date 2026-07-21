import supabase from '../config/supabase.js';
import { hashToken } from '../services/inviteTokenService.js';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Look up a technician by a still-valid invite token. Returns null when the
// token is unknown, already used, or expired.
async function findPendingInvite(rawToken) {
  if (!rawToken) return null;

  const { data, error } = await supabase
    .from('technicians')
    .select('id, user_id, full_name, email, invite_token_expires_at, invite_accepted_at')
    .eq('invite_token_hash', hashToken(rawToken))
    .maybeSingle();

  if (error || !data) return null;
  if (data.invite_accepted_at) return null;
  if (data.invite_token_expires_at && new Date(data.invite_token_expires_at) < new Date()) {
    return null;
  }
  return data;
}

// Self-serve admin signup.
// Uses the service-key admin API with email_confirm:true so the new admin can
// sign in immediately (no email-confirmation step). The client follows up with
// signInWithPassword to obtain a session.
export async function signup(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: full_name?.trim() || null },
    });

    if (error) {
      // Supabase returns a 422 for an already-registered email
      const alreadyExists =
        error.status === 422 || /already.*registered|already.*exists/i.test(error.message || '');
      if (alreadyExists) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      throw error;
    }

    res.status(201).json({ ok: true, user_id: data.user?.id });
  } catch (error) {
    next(error);
  }
}

// Public — validate a technician invite token (read-only, safe for link scanners
// to hit). Returns the invitee's name/email so the /register page can greet them.
export async function getInvite(req, res, next) {
  try {
    const invite = await findPendingInvite(req.params.token);
    if (!invite) {
      return res.status(404).json({ error: 'This invite link is invalid or has expired' });
    }
    res.json({ full_name: invite.full_name, email: invite.email });
  } catch (error) {
    next(error);
  }
}

// Public — complete a technician's account setup: set their password and mark
// the invite consumed. The token is the authorization here, so no session needed.
export async function registerTechnician(req, res, next) {
  try {
    const { token, password } = req.body;

    if (String(password || '').length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const invite = await findPendingInvite(token);
    if (!invite) {
      return res.status(404).json({ error: 'This invite link is invalid or has expired' });
    }
    if (!invite.user_id) {
      return res.status(409).json({ error: 'This invite is not linked to an account' });
    }

    const { error: pwError } = await supabase.auth.admin.updateUserById(invite.user_id, {
      password,
    });
    if (pwError) throw pwError;

    // Consume the invite so the link can't be reused
    const { error: markError } = await supabase
      .from('technicians')
      .update({
        invite_accepted_at: new Date().toISOString(),
        invite_token_hash: null,
        invite_token_expires_at: null,
      })
      .eq('id', invite.id);
    if (markError) throw markError;

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

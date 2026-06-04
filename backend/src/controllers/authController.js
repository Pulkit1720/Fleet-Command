import supabase from '../config/supabase.js';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

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

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authoriztion token ' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_key,
            {
                global: {
                    headers: { Authorization: `Bearer ${token} ` }
                }
            }
        );

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        req.supabase = supabase;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

//Optional auth - continues even without token
export async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return next();
    }

    return authenticate(req, res, next);
}
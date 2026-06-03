import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

console.log('SUPABASE_URL is:', supabaseUrl ? 'Set' : 'Missing', supabaseUrl);
console.log('SUPABASE_SECRET_KEY is:', supabaseServiceKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars. env keys:", Object.keys(process.env).join(', '));
    throw new Error('Missing Supabase environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default supabase;
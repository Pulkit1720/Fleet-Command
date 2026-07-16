import supabase from '../config/supabase.js';

// The client table enforces a strict 10-digit phone format; normalize free-form
// input (e.g. "+1 (312) 847-1928") and drop values that don't fit.
function normalizePhone(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? digits : null;
}

function clientKey(name) {
    return (name || '').trim().toLowerCase();
}

// List clients for the requesting admin: saved rows from the client table,
// plus clients derived from this admin's jobs that have no saved record yet.
// Every entry carries job_count / active_job_count / last_job_date.
export async function getClients(req, res, next) {
    try {
        const [clientsResult, jobsResult] = await Promise.all([
            supabase
                .from('client')
                .select('*')
                .eq('created_by', req.user.id)
                .order('client_name'),
            supabase
                .from('jobs')
                .select('client_name, client_phone, client_email, status, scheduled_date, created_at')
                .eq('created_by', req.user.id),
        ]);

        if (clientsResult.error) throw clientsResult.error;
        if (jobsResult.error) throw jobsResult.error;

        const groups = new Map();
        for (const job of jobsResult.data || []) {
            const name = (job.client_name || '').trim();
            if (!name) continue;
            const key = clientKey(name);
            const group = groups.get(key) || {
                client_name: name,
                phone: null,
                email: null,
                job_count: 0,
                active_job_count: 0,
                last_job_date: null,
            };

            group.job_count++;
            if (!['Completed', 'Cancelled'].includes(job.status)) group.active_job_count++;
            group.phone = group.phone || job.client_phone || null;
            group.email = group.email || job.client_email || null;

            const jobDate = job.scheduled_date || (job.created_at || '').slice(0, 10) || null;
            if (jobDate && (!group.last_job_date || jobDate > group.last_job_date)) {
                group.last_job_date = jobDate;
            }

            groups.set(key, group);
        }

        const saved = (clientsResult.data || []).map((client) => {
            const key = clientKey(client.client_name);
            const group = groups.get(key);
            groups.delete(key);
            return {
                ...client,
                saved: true,
                job_count: group?.job_count ?? 0,
                active_job_count: group?.active_job_count ?? 0,
                last_job_date: group?.last_job_date ?? null,
            };
        });

        const derived = [...groups.values()].map((group) => ({
            id: null,
            saved: false,
            client_name: group.client_name,
            contact_name: null,
            email: group.email,
            phone: group.phone,
            address: null,
            city: null,
            state: null,
            postal_code: null,
            notes: null,
            job_count: group.job_count,
            active_job_count: group.active_job_count,
            last_job_date: group.last_job_date,
        }));

        res.json(
            [...saved, ...derived].sort((a, b) =>
                a.client_name.localeCompare(b.client_name)
            )
        );
    } catch (error) {
        next(error);
    }
}

function clientPayload(body) {
    const { client_name, contact_name, email, phone, address, city, state, postal_code, notes } = body;
    return {
        client_name: client_name?.trim(),
        contact_name: (contact_name || client_name || '').trim(),
        email: email?.trim() || null,
        phone: normalizePhone(phone),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        postal_code: postal_code?.trim() || null,
        notes: notes?.trim() || null,
    };
}

export async function createClient(req, res, next) {
    try {
        const payload = clientPayload(req.body);
        if (!payload.client_name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const { data, error } = await supabase
            .from('client')
            .insert({ ...payload, created_by: req.user.id })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'A client with this email or phone already exists' });
            }
            throw error;
        }

        res.status(201).json({
            ...data,
            saved: true,
            job_count: 0,
            active_job_count: 0,
            last_job_date: null,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateClient(req, res, next) {
    try {
        const { id } = req.params;
        const payload = clientPayload(req.body);
        if (!payload.client_name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const { data, error } = await supabase
            .from('client')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('created_by', req.user.id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'A client with this email or phone already exists' });
            }
            throw error;
        }

        res.json({ ...data, saved: true });
    } catch (error) {
        next(error);
    }
}

export async function deleteClient(req, res, next) {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('client')
            .delete()
            .eq('id', id)
            .eq('created_by', req.user.id);

        if (error) throw error;

        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
}

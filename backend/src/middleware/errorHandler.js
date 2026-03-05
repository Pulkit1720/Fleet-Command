export function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    //Not found
    if (err.code === 'PGRST116') {
        return res.status(404).json({ error: 'Resource not found ' });
    }
    //Unique violation
    if (err.code === '23505') {
        return res.status(409).json({ error: 'Resource already exists' });
    }

    if (err.code === '23503') {
        return res.status(400).json({ error: 'Invalid reference' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
}

export function aysyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
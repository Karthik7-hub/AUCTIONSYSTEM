const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// --- JWT HELPERS ---
const signTokens = (payload) => ({
    accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }),
    refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' })
});

// Middleware: verify host or super admin access token
const verifyHostToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    try {
        req.tokenPayload = jwt.verify(auth.slice(7), JWT_SECRET);
        if (req.tokenPayload.role !== 'host' && req.tokenPayload.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch {
        res.status(401).json({ error: 'Token expired or invalid' });
    }
};

// Middleware: verify super admin access token
const verifySuperAdminToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    try {
        req.tokenPayload = jwt.verify(auth.slice(7), JWT_SECRET);
        if (req.tokenPayload.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
        next();
    } catch {
        res.status(401).json({ error: 'Token expired or invalid' });
    }
};

// Socket helper: verify token from socket event payload
const verifySocketToken = (token) => {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload.role === 'host' ? payload : null;
    } catch { return null; }
};

module.exports = {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    signTokens,
    verifyHostToken,
    verifySuperAdminToken,
    verifySocketToken
};

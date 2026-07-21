const rateLimit = require('express-rate-limit');

/**
 * Window-based rate limiter for login endpoints only.
 * 5 attempts per 15-minute window — resets automatically after the window expires.
 */
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,  // Sends RateLimit-* headers so client knows how long to wait
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const retryAfterMinutes = Math.ceil(options.windowMs / 60000);
        res.status(429).json({
            success: false,
            error: `Too many login attempts. Please try again in ${retryAfterMinutes} minutes.`
        });
    }
});

module.exports = { loginRateLimiter };

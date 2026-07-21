const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyHostToken, verifySuperAdminToken } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

// Rate limiting applied only to authentication endpoints
router.post('/api/verify-admin', loginRateLimiter, authController.verifyAdmin);
router.post('/api/super-admin/login', loginRateLimiter, authController.superAdminLogin);

router.post('/api/refresh-token', authController.refreshToken);
router.get('/api/verify-token', verifyHostToken, authController.verifyToken);
router.get('/api/verify-super-token', verifySuperAdminToken, authController.verifySuperToken);

module.exports = router;

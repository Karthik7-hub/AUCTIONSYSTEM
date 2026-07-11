const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const { signTokens, JWT_REFRESH_SECRET } = require('../middleware/auth');

// Host login verify
const verifyAdmin = async (req, res) => {
    try {
        const { auctionId, password } = req.body;
        
        let auction = null;
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(auctionId);
        if (isObjectId) {
            auction = await Auction.findById(auctionId).select('accessCode _id').lean();
        } else {
            auction = await Auction.findOne({ slug: auctionId }).select('accessCode _id').lean();
        }

        if (!auction) return res.status(404).json({ success: false, error: 'Auction not found' });
        if (auction.accessCode !== password) return res.status(401).json({ success: false, error: 'Invalid password' });

        const { accessToken, refreshToken } = signTokens({
            role: 'host',
            auctionId: auction._id.toString()
        });
        res.json({ success: true, accessToken, refreshToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Super admin login
const superAdminLogin = (req, res) => {
    if (req.body.password !== process.env.SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    const { accessToken, refreshToken } = signTokens({ role: 'super_admin' });
    res.json({ success: true, accessToken, refreshToken });
};

// Refresh token
const refreshToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'No refresh token' });
    try {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const { role, auctionId } = payload;
        const newPayload = auctionId ? { role, auctionId } : { role };
        const { accessToken, refreshToken: newRefreshToken } = signTokens(newPayload);
        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        res.status(401).json({ error: 'Refresh token expired or invalid. Please log in again.' });
    }
};

// Verify host token
const verifyToken = (req, res) => {
    res.json({ valid: true, role: req.tokenPayload.role, auctionId: req.tokenPayload.auctionId });
};

// Verify super admin token
const verifySuperToken = (req, res) => {
    res.json({ valid: true, role: req.tokenPayload.role });
};

module.exports = {
    verifyAdmin,
    superAdminLogin,
    refreshToken,
    verifyToken,
    verifySuperToken
};

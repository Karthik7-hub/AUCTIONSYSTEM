const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const resultsController = require('../controllers/resultsController');
const { verifyHostToken, verifySuperAdminToken } = require('../middleware/auth');

router.post('/api/create-auction', verifySuperAdminToken, auctionController.createAuction);
router.get('/api/auctions', auctionController.getAllAuctions);
router.get('/api/auctions/archived', verifySuperAdminToken, auctionController.getArchivedAuctions);
router.patch('/api/auctions/:id/archive', verifySuperAdminToken, auctionController.archiveAuction);
router.patch('/api/auctions/:id/restore', verifySuperAdminToken, auctionController.restoreAuction);
router.put('/api/auctions/:id', verifyHostToken, auctionController.updateAuction);
router.get('/api/init/:auctionId', auctionController.initAuction);
router.delete('/api/auctions/:id', verifySuperAdminToken, auctionController.deleteAuction);

// Results & Analytics Endpoints
router.get('/api/auctions/:id/results', resultsController.getAuctionResults);
router.get('/api/auctions/:id/team-summary', resultsController.getTeamSummary);
router.get('/api/auctions/:id/team/:teamId', resultsController.getTeamDetail);
router.get('/api/auctions/:id/pdf-data', resultsController.getPDFData);

module.exports = router;

const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');

router.post('/api/create-auction', auctionController.createAuction);
router.get('/api/auctions', auctionController.getAllAuctions);
router.get('/api/auctions/archived', auctionController.getArchivedAuctions);
router.patch('/api/auctions/:id/archive', auctionController.archiveAuction);
router.patch('/api/auctions/:id/restore', auctionController.restoreAuction);
router.put('/api/auctions/:id', auctionController.updateAuction);
router.get('/api/init/:auctionId', auctionController.initAuction);
router.delete('/api/auctions/:id', auctionController.deleteAuction);

module.exports = router;

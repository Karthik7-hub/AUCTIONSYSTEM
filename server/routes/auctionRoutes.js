const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');

router.post('/api/create-auction', auctionController.createAuction);
router.get('/api/auctions', auctionController.getAllAuctions);
router.put('/api/auctions/:id', auctionController.updateAuction);
router.get('/api/init/:auctionId', auctionController.initAuction);
router.delete('/api/auctions/:id', auctionController.deleteAuction);

module.exports = router;

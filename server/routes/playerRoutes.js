const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { verifyHostToken } = require('../middleware/auth');

router.post('/api/players', verifyHostToken, playerController.createPlayer);
router.post('/api/players/bulk', verifyHostToken, playerController.bulkCreatePlayers);
router.put('/api/players/:id', verifyHostToken, playerController.updatePlayer);
router.delete('/api/players/:id', verifyHostToken, playerController.deletePlayer);

module.exports = router;

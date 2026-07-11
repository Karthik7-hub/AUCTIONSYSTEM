const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.post('/api/players', playerController.createPlayer);
router.put('/api/players/:id', playerController.updatePlayer);
router.delete('/api/players/:id', playerController.deletePlayer);

module.exports = router;

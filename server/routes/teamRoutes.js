const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.post('/api/teams', teamController.createTeam);
router.post('/api/teams/bulk', teamController.bulkCreateTeams);
router.put('/api/teams/:id', teamController.updateTeam);
router.delete('/api/teams/:id', teamController.deleteTeam);

module.exports = router;

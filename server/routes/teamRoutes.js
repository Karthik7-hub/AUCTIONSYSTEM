const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { verifyHostToken } = require('../middleware/auth');

router.post('/api/teams', verifyHostToken, teamController.createTeam);
router.post('/api/teams/bulk', verifyHostToken, teamController.bulkCreateTeams);
router.put('/api/teams/:id', verifyHostToken, teamController.updateTeam);
router.delete('/api/teams/:id', verifyHostToken, teamController.deleteTeam);

module.exports = router;

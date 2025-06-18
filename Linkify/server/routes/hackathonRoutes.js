const express = require('express');
const hackathonController = require('../controllers/hackathonController');
const router = express.Router();

// Get all hackathons
router.get('/', hackathonController.getAllHackathons);

// Get upcoming hackathons
router.get('/upcoming', hackathonController.getUpcomingHackathons);

// Get hackathons by organizer
router.get('/organizer/:organizerId', hackathonController.getHackathonsByOrganizer);

// Get single hackathon
router.get('/:id', hackathonController.getHackathon);

// Register for hackathon (without auth)
router.post('/:id/register', hackathonController.registerForHackathon);

// Create new hackathon
router.post('/', hackathonController.createHackathon);

// Update hackathon
router.patch('/:id', hackathonController.updateHackathon);

// Delete hackathon
router.delete('/:id', hackathonController.deleteHackathon);

module.exports = router;
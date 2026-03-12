const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const { requireOrganizer } = require('../middleware/auth');

router.get('/dashboard', requireOrganizer, organizerController.getDashboardData);
router.get('/events', requireOrganizer, organizerController.getOrganizerEvents);

module.exports = router;

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireOrganizer } = require('../middleware/auth');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', requireOrganizer, eventController.createEvent);
router.put('/:id', requireOrganizer, eventController.updateEvent);
router.delete('/:id', requireOrganizer, eventController.deleteEvent);

module.exports = router;

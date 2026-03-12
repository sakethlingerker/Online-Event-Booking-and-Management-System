const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.get('/events', requireAdmin, adminController.getAllEventsForAdmin);
router.put('/events/:id/approve', requireAdmin, adminController.approveEvent);
router.put('/events/:id/reject', requireAdmin, adminController.rejectEvent);

module.exports = router;

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/bookings', bookingController.bookEvent);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/all-bookings', bookingController.getAllBookings); 

module.exports = router;

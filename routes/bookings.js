/**
 * Booking Routes
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isRider, canAccessResource } = require('../middleware/auth');
const {
    validateBooking,
    handleValidationErrors
} = require('../middleware/validation');

// Create Booking
router.post('/create/:rideId',
    isAuthenticated,
    validateBooking,
    handleValidationErrors,
    bookingController.createBooking
);

// My Bookings
router.get('/my-bookings', isAuthenticated, bookingController.showMyBookings);

// Booking Details
router.get('/:bookingId',
    isAuthenticated,
    bookingController.showBookingDetails
);

// Accept Booking (by rider)
router.post('/:bookingId/accept',
    isAuthenticated,
    isRider,
    bookingController.acceptBooking
);

// Reject Booking (by rider)
router.post('/:bookingId/reject',
    isAuthenticated,
    isRider,
    bookingController.rejectBooking
);

// Cancel Booking (by passenger)
router.post('/:bookingId/cancel',
    isAuthenticated,
    bookingController.cancelBooking
);

// Verify Pickup OTP (by rider)
router.post('/:bookingId/verify-pickup',
    isAuthenticated,
    isRider,
    bookingController.verifyPickupOTP
);

// Verify Dropoff OTP (by rider)
router.post('/:bookingId/verify-dropoff',
    isAuthenticated,
    isRider,
    bookingController.verifyDropoffOTP
);

// Complete Payment (Passenger action after dropoff)
router.post('/:bookingId/complete-payment',
    isAuthenticated,
    bookingController.completePayment
);

// Confirm Payment Receipt (Rider action - NEW - replaces mark-paid)
router.post('/:bookingId/confirm-payment',
    isAuthenticated,
    isRider,
    bookingController.confirmPayment
);

// Mark Payment as Paid (DEPRECATED - use confirm-payment instead)
router.post('/:bookingId/mark-paid',
    isAuthenticated,
    isRider,
    bookingController.markAsPaid
);

// Start Journey (pickup passenger) - DEPRECATED, use verify-pickup instead
router.post('/:bookingId/start',
    isAuthenticated,
    isRider,
    bookingController.startJourney
);

// Complete Journey (drop passenger) - DEPRECATED, use verify-dropoff instead
router.post('/:bookingId/complete',
    isAuthenticated,
    isRider,
    bookingController.completeJourney
);

module.exports = router;

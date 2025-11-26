/**
 * Booking Routes - API Only (React SPA)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isRider } = require('../middleware/auth');
const {
    validateBooking,
    handleValidationErrors
} = require('../middleware/validation');

// Create Booking API
router.post('/create/:rideId',
    isAuthenticated,
    validateBooking,
    handleValidationErrors,
    bookingController.createBooking
);

// My Bookings API
router.get('/my-bookings', isAuthenticated, bookingController.getMyBookings);

// Booking Details API
router.get('/:bookingId', isAuthenticated, bookingController.getBookingDetails);

// Accept Booking API (by rider)
router.post('/:bookingId/accept', isAuthenticated, isRider, bookingController.acceptBooking);

// Reject Booking API (by rider)
router.post('/:bookingId/reject', isAuthenticated, isRider, bookingController.rejectBooking);

// Cancel Booking API (by passenger)
router.post('/:bookingId/cancel', isAuthenticated, bookingController.cancelBooking);

// Verify Pickup OTP API (by rider)
router.post('/:bookingId/verify-pickup', isAuthenticated, isRider, bookingController.verifyPickupOTP);

// Verify Dropoff OTP API (by rider)
router.post('/:bookingId/verify-dropoff', isAuthenticated, isRider, bookingController.verifyDropoffOTP);

// Complete Payment API (Passenger action after dropoff)
router.post('/:bookingId/complete-payment', isAuthenticated, bookingController.completePayment);

// Confirm Payment Receipt API (Rider action)
router.post('/:bookingId/confirm-payment', isAuthenticated, isRider, bookingController.confirmPayment);

// Mark Payment as Paid API (legacy - use confirm-payment instead)
router.post('/:bookingId/mark-paid', isAuthenticated, isRider, bookingController.markAsPaid);

// Start Journey API (pickup passenger) - legacy, use verify-pickup
router.post('/:bookingId/start', isAuthenticated, isRider, bookingController.startJourney);

// Complete Journey API (drop passenger) - legacy, use verify-dropoff
router.post('/:bookingId/complete', isAuthenticated, isRider, bookingController.completeJourney);

module.exports = router;

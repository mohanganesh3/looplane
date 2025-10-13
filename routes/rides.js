/**
 * Ride Routes
 */

const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { isAuthenticated, isRider, isVerifiedRider } = require('../middleware/auth');
// Rate limiter removed
const {
    validateRidePost,
    validateRideUpdate,
    validateRideSearch,
    handleValidationErrors
} = require('../middleware/validation');

// Search Rides
router.get('/search', isAuthenticated, rideController.showSearchPage);
router.get('/search/results',
    isAuthenticated,
    validateRideSearch,
    handleValidationErrors,
    rideController.searchRides
);

// Post Ride
router.get('/post',
    isAuthenticated,
    isRider,
    isVerifiedRider,
    rideController.showPostRidePage
);
router.post('/post',
    isAuthenticated,
    isRider,
    isVerifiedRider,
    validateRidePost,
    handleValidationErrors,
    rideController.postRide
);

// My Rides (for riders)
router.get('/my-rides',
    isAuthenticated,
    isRider,
    rideController.showMyRides
);

// Edit Ride Page (MUST be before /:rideId to match correctly)
router.get('/:rideId/edit',
    isAuthenticated,
    isRider,
    rideController.showEditRidePage
);

// Update Ride (PUT method, different from GET above)
router.put('/:rideId',
    isAuthenticated,
    isRider,
    validateRideUpdate,
    handleValidationErrors,
    rideController.updateRide
);

// Delete Ride
router.delete('/:rideId',
    isAuthenticated,
    isRider,
    rideController.deleteRide
);

// Ride Details (MUST be after specific routes like /edit)
router.get('/:rideId', isAuthenticated, rideController.showRideDetails);

// Cancel Ride
router.post('/:rideId/cancel',
    isAuthenticated,
    isRider,
    rideController.cancelRide
);

// Start Ride
router.post('/:rideId/start',
    isAuthenticated,
    isRider,
    rideController.startRide
);

// Complete Ride
router.post('/:rideId/complete',
    isAuthenticated,
    isRider,
    rideController.completeRide
);

// Update Location (real-time tracking)
router.post('/:rideId/location',
    isAuthenticated,
    isRider,
    rideController.updateLocation
);

module.exports = router;

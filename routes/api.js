/**
 * API Routes (External API integrations)
 */

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
// Rate limiter removed
const uploadMiddleware = require('../middleware/upload');

// All API routes require authentication
router.use(isAuthenticated);

// User Profile API
router.get('/users/profile', userController.getProfileAPI);
router.put('/users/profile',
    uploadMiddleware.fields([
        { name: 'profilePhoto', maxCount: 1 }
    ]),
    userController.updateProfile
);

// Account Management API (Only deletion allowed for users)
// Note: Suspension/reactivation is admin-only via admin panel
router.post('/users/change-password', authController.changePassword);
router.delete('/users/account', userController.deleteAccount);

// Geocoding
router.get('/geocode', apiController.geocodeAddress);
router.get('/reverse-geocode', apiController.reverseGeocode);

// Routing
router.post('/route', apiController.getRoute);
router.post('/distance-matrix', apiController.getDistanceMatrix);
router.post('/snap-to-road', apiController.snapToRoad);

// Location Autocomplete
router.get('/autocomplete', apiController.autocomplete);

// ETA Calculation
router.get('/eta', apiController.calculateETA);

// Notifications
router.get('/notifications', apiController.getNotifications);
router.get('/notifications/all', apiController.getAllNotifications);
router.get('/notifications/count', apiController.getNotificationCount);
router.post('/notifications/:notificationId/read', apiController.markNotificationAsRead);
router.post('/notifications/mark-all-read', apiController.markAllNotificationsAsRead);

module.exports = router;

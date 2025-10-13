/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isRider } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
    validateProfileUpdate,
    validateEmergencyContact,
    validateVehicle,
    handleValidationErrors
} = require('../middleware/validation');

// Dashboard
router.get('/dashboard', isAuthenticated, userController.showDashboard);

// Chat Test Page (Debug)
router.get('/chat-test', isAuthenticated, (req, res) => {
    res.render('pages/chat-test', {
        title: 'Chat System Debug - LANE Carpool',
        user: req.user
    });
});

// Profile Completion (for new riders)
router.get('/complete-profile',
    isAuthenticated,
    isRider,
    userController.showCompleteProfilePage
);
router.post('/complete-profile',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([
        { name: 'vehiclePhoto', maxCount: 3 }
    ]),
    validateVehicle,
    handleValidationErrors,
    userController.completeProfile
);

// Document Upload
router.get('/upload-documents',
    isAuthenticated,
    isRider,
    userController.showUploadDocumentsPage
);
router.post('/documents',
    isAuthenticated,
    isRider,
    uploadLimiter,
    uploadMiddleware.riderDocuments,
    userController.uploadDocuments
);

// Profile
router.get('/profile', isAuthenticated, userController.showProfile);
router.get('/profile-data', isAuthenticated, userController.getProfileData);
router.post('/profile',
    isAuthenticated,
    uploadMiddleware.fields([
        { name: 'profilePhoto', maxCount: 1 }
    ]),
    validateProfileUpdate,
    handleValidationErrors,
    userController.updateProfile
);

// Emergency Contacts
router.post('/emergency-contacts',
    isAuthenticated,
    validateEmergencyContact,
    handleValidationErrors,
    userController.addEmergencyContact
);
router.delete('/emergency-contacts/:contactId',
    isAuthenticated,
    userController.removeEmergencyContact
);

// Vehicles (riders only)
router.post('/vehicles',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([
        { name: 'vehiclePhoto', maxCount: 3 }
    ]),
    validateVehicle,
    handleValidationErrors,
    userController.addVehicle
);
router.delete('/vehicles/:vehicleId',
    isAuthenticated,
    isRider,
    userController.removeVehicle
);

// Trip History
router.get('/trip-history', isAuthenticated, userController.showTripHistory);

// Notifications
router.get('/notifications', isAuthenticated, userController.showNotifications);

// Settings
router.get('/settings', isAuthenticated, userController.showSettings);
router.put('/settings', isAuthenticated, userController.updateSettings);

// Account Management (Only deletion allowed for users)
// Note: Suspension/Deactivation is admin-only action
router.delete('/account', isAuthenticated, userController.deleteAccount);

module.exports = router;

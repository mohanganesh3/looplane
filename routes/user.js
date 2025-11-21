/**
 * User Routes - API Only (React SPA)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isRider } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const {
    validateProfileUpdate,
    validateEmergencyContact,
    validateVehicle,
    handleValidationErrors
} = require('../middleware/validation');

// Dashboard API
router.get('/dashboard', isAuthenticated, userController.getDashboardData);

// Profile APIs
router.get('/profile', isAuthenticated, userController.getProfile);
router.get('/profile-data', isAuthenticated, userController.getProfileData);
router.get('/profile/:userId', isAuthenticated, userController.getPublicProfile);
router.post('/profile',
    isAuthenticated,
    uploadMiddleware.fields([{ name: 'profilePhoto', maxCount: 1 }]),
    validateProfileUpdate,
    handleValidationErrors,
    userController.updateProfile
);

// Profile picture upload API
router.post('/profile/picture',
    isAuthenticated,
    uploadMiddleware.profilePhotoFields,
    userController.updateProfilePicture
);

// Complete Profile API (for riders)
router.post('/complete-profile',
    isAuthenticated,
    isRider,
    userController.completeRiderProfile
);

// Document Upload API
router.post('/documents',
    isAuthenticated,
    isRider,
    uploadMiddleware.riderDocuments,
    userController.uploadDocuments
);

router.post('/documents/upload',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([
        { name: 'driverLicenseFront', maxCount: 1 },
        { name: 'driverLicenseBack', maxCount: 1 },
        { name: 'aadharCard', maxCount: 1 },
        { name: 'rcBook', maxCount: 1 },
        { name: 'insurance', maxCount: 1 },
        { name: 'vehiclePhotos', maxCount: 5 }
    ]),
    userController.uploadDocuments
);

router.get('/documents/status', isAuthenticated, userController.getDocumentStatus);

// Change password API
router.post('/change-password', isAuthenticated, userController.changePassword);

// Carbon Report API
router.get('/carbon-report', isAuthenticated, userController.getCarbonReport);

// Emergency Contacts APIs
router.get('/emergency-contacts/list', isAuthenticated, userController.getEmergencyContactsList);
router.post('/emergency-contacts/add', isAuthenticated, userController.addEmergencyContactNew);
router.post('/emergency-contacts/:contactId/send-verification', isAuthenticated, userController.sendContactVerification);
router.post('/emergency-contacts/:contactId/verify', isAuthenticated, userController.verifyEmergencyContact);
router.post('/emergency-contacts/:contactId/set-primary', isAuthenticated, userController.setPrimaryContact);
router.delete('/emergency-contacts/:contactId', isAuthenticated, userController.removeEmergencyContact);
router.post('/emergency-contacts',
    isAuthenticated,
    validateEmergencyContact,
    handleValidationErrors,
    userController.addEmergencyContact
);

// License/Verification APIs
router.post('/license/upload',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([
        { name: 'licenseFront', maxCount: 1 },
        { name: 'licenseBack', maxCount: 1 }
    ]),
    userController.uploadLicense
);
router.get('/license/status', isAuthenticated, userController.getLicenseStatus);

// Vehicle APIs
router.get('/vehicles', isAuthenticated, userController.getVehicles);
router.post('/vehicle',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([{ name: 'vehiclePhoto', maxCount: 3 }]),
    userController.addVehicle
);
router.put('/vehicle/:vehicleId',
    isAuthenticated,
    isRider,
    uploadMiddleware.fields([{ name: 'vehiclePhoto', maxCount: 3 }]),
    userController.updateVehicle
);
router.delete('/vehicle/:vehicleId',
    isAuthenticated,
    isRider,
    userController.removeVehicle
);

// Trip History API
router.get('/trip-history', isAuthenticated, userController.getTripHistory);

// Notifications API
router.get('/notifications', isAuthenticated, userController.getNotifications);

// Settings APIs
router.get('/settings', isAuthenticated, userController.getSettings);
router.put('/settings', isAuthenticated, userController.updateSettings);

// Trust Score & Badges APIs
router.get('/trust-score', isAuthenticated, userController.getTrustScore);
router.get('/trust-score/:userId', isAuthenticated, userController.getTrustScore);
router.get('/badges', isAuthenticated, userController.getUserBadges);
router.get('/badges/:userId', isAuthenticated, userController.getUserBadges);
router.post('/badges/check', isAuthenticated, userController.checkBadges);
router.get('/stats', isAuthenticated, userController.getUserStats);
router.get('/stats/:userId', isAuthenticated, userController.getUserStats);
router.get('/recommended-price', isAuthenticated, userController.getRecommendedPrice);
router.get('/contribution-calculator', isAuthenticated, userController.getContributionCalculator);

// Account Management API
router.delete('/account', isAuthenticated, userController.deleteAccount);

module.exports = router;

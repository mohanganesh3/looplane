/**
 * SOS Emergency Routes
 * Routes for emergency alerts and admin management
 */

const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public Emergency Page (requires authentication)
router.get('/emergency', isAuthenticated, sosController.showEmergencyPage);

// Trigger Emergency Alert
router.post('/trigger', isAuthenticated, sosController.triggerEmergency);

// Get User's Active Emergency Status
router.get('/status', isAuthenticated, sosController.getEmergencyStatus);

// Cancel Emergency (False Alarm)
router.post('/:emergencyId/cancel', isAuthenticated, sosController.cancelEmergency);

// Admin Routes
router.get('/admin/test', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/sos-test', { title: 'SOS Test', user: req.user });
});
router.get('/admin/dashboard', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/sos-dashboard', {
        title: 'SOS Emergency Dashboard - LANE Admin',
        user: req.user
    });
});
router.get('/admin/all', isAuthenticated, isAdmin, sosController.getAllEmergencies);
router.get('/admin/active', isAuthenticated, isAdmin, sosController.getActiveEmergencies);
router.get('/admin/stats', isAuthenticated, isAdmin, sosController.getEmergencyStats);
router.post('/admin/:emergencyId/update', isAuthenticated, isAdmin, sosController.updateEmergencyStatus);

module.exports = router;

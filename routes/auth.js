/**
 * Authentication Routes - API Only (React SPA)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    validateRegistration,
    validateLogin,
    validateOTP,
    validatePasswordChange,
    validateForgotPassword,
    validateResetPassword,
    handleValidationErrors
} = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

// Registration API
router.post('/register',
    validateRegistration,
    handleValidationErrors,
    authController.register
);

// OTP Verification API
router.post('/verify-otp',
    validateOTP,
    handleValidationErrors,
    authController.verifyOTP
);

// Resend OTP API
router.post('/resend-otp', authController.resendOTP);

// Login API
router.post('/login',
    validateLogin,
    handleValidationErrors,
    authController.login
);

// Logout API
router.post('/logout', isAuthenticated, authController.logout);
router.get('/logout', isAuthenticated, authController.logout);

// Forgot Password API
router.post('/forgot-password',
    validateForgotPassword,
    handleValidationErrors,
    authController.forgotPassword
);

// Reset Password API
router.post('/reset-password',
    validateResetPassword,
    handleValidationErrors,
    authController.resetPassword
);

// Change Password API (for logged-in users)
router.post('/change-password',
    isAuthenticated,
    validatePasswordChange,
    handleValidationErrors,
    authController.changePassword
);

// Get current session/user status
router.get('/me', isAuthenticated, authController.getCurrentUser);

module.exports = router;

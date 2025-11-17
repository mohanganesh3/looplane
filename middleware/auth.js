/**
 * Authentication Middleware
 * Protects routes and checks user roles
 * Updated for React frontend - returns JSON responses
 */

const User = require('../models/User');

/**
 * Check if user is authenticated and not suspended/deleted
 */
exports.isAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            redirectUrl: '/login'
        });
    }
    
    try {
        // Fetch user from database to check current status - include vehicles and documents for profile completion check
        const user = await User.findById(req.session.userId)
            .select('accountStatus isActive isSuspended suspensionReason role email profile vehicles documents verificationStatus');
        
        if (!user) {
            // User was deleted from database
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'Account not found. Please login again.',
                redirectUrl: '/login',
                forceLogout: true
            });
        }
        
        // Check if account is suspended
        if (user.accountStatus === 'SUSPENDED' || user.isSuspended) {
            req.session.destroy();
            return res.status(403).json({
                success: false,
                message: `Your account has been suspended. Reason: ${user.suspensionReason || 'Policy violation'}. Please check your email for details.`,
                accountSuspended: true,
                redirectUrl: '/login',
                forceLogout: true
            });
        }
        
        // Check if account is deleted
        if (user.accountStatus === 'DELETED') {
            req.session.destroy();
            return res.status(403).json({
                success: false,
                message: 'This account has been deleted.',
                accountDeleted: true,
                redirectUrl: '/login',
                forceLogout: true
            });
        }
        
        // Check if account is inactive
        if (user.isActive === false) {
            req.session.destroy();
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact support.',
                accountInactive: true,
                redirectUrl: '/login',
                forceLogout: true
            });
        }
        
        // Attach user to request for downstream use
        req.user = user;
        return next();
    } catch (error) {
        console.error('Error in isAuthenticated middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

/**
 * Check if user is a rider
 */
exports.isRider = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            redirectUrl: '/login'
        });
    }
    
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'User not found',
                redirectUrl: '/login'
            });
        }
        
        if (user.role !== 'RIDER') {
            return res.status(403).json({
                success: false,
                message: 'This action is only available to riders'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in isRider middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking permissions'
        });
    }
};

/**
 * Check if user is a passenger
 */
exports.isPassenger = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            redirectUrl: '/login'
        });
    }
    
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'User not found',
                redirectUrl: '/login'
            });
        }
        
        if (user.role !== 'PASSENGER') {
            return res.status(403).json({
                success: false,
                message: 'This action is only available to passengers'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in isPassenger middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking permissions'
        });
    }
};

/**
 * Check if user is an admin
 */
exports.isAdmin = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            redirectUrl: '/login'
        });
    }
    
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'User not found',
                redirectUrl: '/login'
            });
        }
        
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking permissions'
        });
    }
};

/**
 * Check if rider is verified
 */
exports.isVerifiedRider = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            redirectUrl: '/login'
        });
    }
    
    try {
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'User not found',
                redirectUrl: '/login'
            });
        }
        
        if (user.role !== 'RIDER') {
            return res.status(403).json({
                success: false,
                message: 'This action is only available to riders'
            });
        }
        
        if (user.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending verification',
                verificationStatus: user.verificationStatus,
                redirectUrl: '/user/documents'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Error checking verification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking verification'
        });
    }
};

/**
 * Check if user can access resource
 */
exports.canAccessResource = (resourceUserIdField) => {
    return (req, res, next) => {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (req.session.user && req.session.user.role === 'ADMIN') {
            return next();
        }
        
        if (resourceUserId === req.session.userId) {
            return next();
        }
        
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource'
        });
    };
};

/**
 * Attach user object to request and check account status
 */
exports.attachUser = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId)
                .select('-password')
                .lean();
            
            if (user) {
                // Check if user is suspended or deleted
                if (user.accountStatus === 'SUSPENDED' || user.isSuspended) {
                    // Don't attach user - they should be logged out
                    req.session.destroy();
                    // For API requests, the isAuthenticated middleware will handle the response
                    // For page loads, we just don't attach the user
                } else if (user.accountStatus === 'DELETED') {
                    req.session.destroy();
                } else {
                    req.user = user;
                    res.locals.currentUser = user;
                }
            }
        } catch (error) {
            console.error('Error attaching user:', error);
        }
    }
    next();
};

/**
 * Check if user is not authenticated (for login/register pages)
 */
exports.isGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.status(200).json({
            success: true,
            message: 'Already authenticated',
            redirectUrl: '/dashboard'
        });
    }
    next();
};

/**
 * User Controller
 * Handles user dashboard, profile management, emergency contacts, preferences
 */

const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const carbonCalculator = require('../utils/carbonCalculator');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const helpers = require('../utils/helpers');
const { sendEmail } = require('../config/email');

/**
 * Show user dashboard
 */
exports.showDashboard = asyncHandler(async (req, res) => {
    const user = req.user;
    const now = new Date();

    // Check if RIDER needs to complete profile
    if (user.role === 'RIDER') {
        // Check if vehicles array is empty or doesn't exist
        if (!user.vehicles || user.vehicles.length === 0) {
            req.flash('info', 'Please complete your profile and add vehicle details');
            return res.redirect('/user/complete-profile');
        }
        
        // Check if documents are not uploaded
        if (!user.documents?.driverLicense?.frontImage || !user.documents?.governmentId?.frontImage) {
            req.flash('info', 'Please upload your verification documents');
            return res.redirect('/user/upload-documents');
        }
    }

    // Get upcoming rides/bookings
    let upcomingTrips = [];
    let stats = {};

    if (user.role === 'RIDER') {
        // Get rider's upcoming rides
        const rides = await Ride.find({
            rider: user._id,
            departureTime: { $gte: now },
            status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
        })
        .populate('bookings.passenger', 'name profilePhoto rating')
        .sort({ departureTime: 1 })
        .limit(5);

        upcomingTrips = rides;

        // Calculate rider stats
        const totalRides = await Ride.countDocuments({ rider: user._id });
        const completedRides = await Ride.countDocuments({ 
            rider: user._id, 
            status: 'COMPLETED' 
        });
        const totalEarnings = await Booking.aggregate([
            {
                $lookup: {
                    from: 'rides',
                    localField: 'ride',
                    foreignField: '_id',
                    as: 'rideInfo'
                }
            },
            {
                $match: {
                    'rideInfo.rider': user._id,
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$payment.amount' }
                }
            }
        ]);

        stats = {
            totalRides,
            completedRides,
            activeRides: totalRides - completedRides,
            totalEarnings: totalEarnings[0]?.total || 0,
            carbonSaved: user.statistics?.carbonSaved || 0,
            rating: user.rating?.overall || 0
        };
    } else {
        // Get passenger's upcoming bookings
        const bookings = await Booking.find({
            passenger: user._id,
            'journeyDetails.actualPickupTime': { $gte: now },
            status: { $in: ['CONFIRMED', 'IN_PROGRESS'] }
        })
        .populate({
            path: 'ride',
            populate: { path: 'rider', select: 'name profilePhoto rating vehicles' }
        })
        .sort({ 'journeyDetails.actualPickupTime': 1 })
        .limit(5);

        upcomingTrips = bookings;

        // Calculate passenger stats
        const totalBookings = await Booking.countDocuments({ passenger: user._id });
        const completedBookings = await Booking.countDocuments({
            passenger: user._id,
            status: 'COMPLETED'
        });
        const totalSpent = await Booking.aggregate([
            {
                $match: {
                    passenger: user._id,
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$payment.amount' }
                }
            }
        ]);

        stats = {
            totalBookings,
            completedBookings,
            activeBookings: totalBookings - completedBookings,
            totalSpent: totalSpent[0]?.total || 0,
            carbonSaved: user.statistics?.carbonSaved || 0,
            rating: user.rating?.overall || 0
        };
    }

    // Get carbon report using new method
    const carbonReport = await carbonCalculator.generateUserCarbonReport(user._id);

    res.render('user/dashboard', {
        title: 'Dashboard - LANE Carpool',
        user,
        upcomingTrips,
        stats,
        carbonReport
    });
});

/**
 * Show complete profile page (for riders after registration)
 */
exports.showCompleteProfilePage = asyncHandler(async (req, res) => {
    if (req.user.role !== 'RIDER') {
        return res.redirect('/user/dashboard');
    }

    res.render('user/complete-profile', {
        title: 'Complete Your Profile - LANE Carpool',
        user: req.user,
        error: null
    });
});

/**
 * Handle profile completion (for riders)
 */
exports.completeProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.role !== 'RIDER') {
        throw new AppError('Only riders need to complete profile', 400);
    }

    const {
        vehicleType,
        make,
        model,
        year,
        color,
        licensePlate,
        capacity,
        acAvailable,
        genderPreference,
        musicPreference,
        smokingAllowed,
        petsAllowed,
        licenseNumber,
        licenseExpiry,
        bio
    } = req.body;

    // Add vehicle to vehicles array
    const vehicle = {
        vehicleType: vehicleType,
        make: make,
        model: model,
        year: parseInt(year),
        licensePlate: licensePlate.toUpperCase(),
        color: color,
        seats: parseInt(capacity),
        photos: [],
        isDefault: true,
        status: 'PENDING'
    };

    // Initialize vehicles array if it doesn't exist
    if (!user.vehicles) {
        user.vehicles = [];
    }

    // Add vehicle (or update if exists)
    if (user.vehicles.length === 0) {
        user.vehicles.push(vehicle);
    } else {
        // Update the first vehicle
        user.vehicles[0] = { ...user.vehicles[0], ...vehicle };
    }

    // Store license info in documents
    if (!user.documents.driverLicense) {
        user.documents.driverLicense = {};
    }
    user.documents.driverLicense.number = licenseNumber.toUpperCase();
    user.documents.driverLicense.expiryDate = new Date(licenseExpiry);

    // Update preferences (store at user level or in a preferences object)
    if (!user.preferences) {
        user.preferences = {};
    }
    
    user.preferences.genderPreference = genderPreference || 'ANY';
    user.preferences.musicPreference = musicPreference || 'OPEN_TO_REQUESTS';
    user.preferences.smokingAllowed = smokingAllowed === 'on';
    user.preferences.petsAllowed = petsAllowed === 'on';

    // Update bio
    if (bio) {
        user.profile.bio = bio;
    }

    // Verification is only needed for RIDERS, not PASSENGERS
    if (user.role === 'RIDER') {
        // Set verification status to PENDING (will be updated after document upload)
        user.verificationStatus = 'PENDING';
        await user.save();
        req.flash('success', 'Profile completed successfully! Please upload your documents for verification.');
        res.redirect('/user/upload-documents');
    } else {
        // PASSENGERS don't need verification - auto-verify them
        user.verificationStatus = 'VERIFIED';
        await user.save();
        req.flash('success', '✅ Profile completed successfully! You can now start booking rides.');
        res.redirect('/user/dashboard');
    }
});

/**
 * Show upload documents page
 */
exports.showUploadDocumentsPage = asyncHandler(async (req, res) => {
    if (req.user.role !== 'RIDER') {
        return res.redirect('/user/dashboard');
    }

    res.render('user/upload-documents', {
        title: 'Upload Documents - LANE Carpool',
        user: req.user,
        error: null
    });
});

/**
 * Handle document upload
 */
exports.uploadDocuments = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.role !== 'RIDER') {
        req.flash('error', 'Only riders can upload documents');
        return res.redirect('/user/dashboard');
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        req.flash('error', 'Please upload at least the required documents');
        return res.redirect('/user/upload-documents');
    }

    // Check required documents
    const requiredDocs = ['driverLicense', 'aadharCard', 'rcBook', 'insurance'];
    const missingDocs = requiredDocs.filter(doc => !req.files[doc]);
    
    if (missingDocs.length > 0) {
        req.flash('error', `Missing required documents: ${missingDocs.join(', ')}`);
        return res.redirect('/user/upload-documents');
    }

    // Update documents (matching model structure)
    if (req.files.driverLicense) {
        user.documents.driverLicense = user.documents.driverLicense || {};
        user.documents.driverLicense.frontImage = req.files.driverLicense[0].path;
        user.documents.driverLicense.status = 'PENDING';
    }
    
    if (req.files.aadharCard) {
        user.documents.governmentId = user.documents.governmentId || {};
        user.documents.governmentId.type = 'AADHAAR';
        user.documents.governmentId.frontImage = req.files.aadharCard[0].path;
        user.documents.governmentId.status = 'PENDING';
    }
    
    if (req.files.rcBook) {
        // Ensure vehicle exists in vehicles array
        if (!user.vehicles || user.vehicles.length === 0) {
            user.vehicles = [{}];
        }
        user.vehicles[0].registrationDocument = req.files.rcBook[0].path;
        user.vehicles[0].status = 'PENDING';
    }
    
    if (req.files.insurance) {
        user.documents.insurance = user.documents.insurance || {};
        user.documents.insurance.document = req.files.insurance[0].path;
        user.documents.insurance.status = 'PENDING';
    }
    
    // Handle multiple vehicle photos
    if (req.files.vehiclePhotos) {
        // Ensure vehicle exists in vehicles array
        if (!user.vehicles || user.vehicles.length === 0) {
            user.vehicles = [{}];
        }
        user.vehicles[0].photos = req.files.vehiclePhotos.map(file => file.path);
    }

    // Update verification status
    user.verificationStatus = 'UNDER_REVIEW';
    await user.save();

    // Create notification for all admins
    try {
        const Notification = require('../models/Notification');
        const User = require('../models/User');
        
        // Find all admin users
        const admins = await User.find({ role: 'ADMIN' });
        
        // Create notification for each admin
        const notificationPromises = admins.map(admin => 
            Notification.create({
                user: admin._id,
                type: 'VERIFICATION_REQUEST',
                title: 'New Driver Verification Request',
                message: `${user.profile.firstName} ${user.profile.lastName} has submitted documents for verification`,
                data: {
                    userId: user._id,
                    userName: `${user.profile.firstName} ${user.profile.lastName}`,
                    verificationStatus: 'IN_REVIEW'
                }
            })
        );
        
        await Promise.all(notificationPromises);
    } catch (notificationError) {
        console.error('Failed to create admin notification:', notificationError);
        // Continue even if notification fails
    }

    req.flash('success', 'Documents uploaded successfully! Admin will verify within 24-48 hours.');
    res.redirect('/user/dashboard');
});

/**
 * Show profile page
 */
exports.showProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('emergencyContacts');

    // Get user's recent reviews
    const reviews = await Review.find({
        reviewee: user._id
    })
    .populate('reviewer', 'name profilePhoto')
    .sort({ createdAt: -1 })
    .limit(10);

    res.render('user/profile', {
        title: 'My Profile - LANE Carpool',
        user,
        reviews
    });
});

/**
 * Get profile API (JSON response for frontend)
 */
exports.getProfileAPI = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('emergencyContacts')
        .select('-password -resetPasswordToken -resetPasswordExpires');

    // Get user's recent reviews
    const reviews = await Review.find({
        reviewee: user._id
    })
    .populate('reviewer', 'name profilePhoto')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
        success: true,
        user,
        reviews
    });
});

/**
 * Get profile data (for SOS page and other components)
 */
exports.getProfileData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('profile email phone emergencyContacts');

    res.status(200).json({
        success: true,
        profile: user.profile,
        email: user.email,
        phone: user.phone,
        emergencyContacts: user.emergencyContacts || []
    });
});

/**
 * Update profile with comprehensive validation and normalization
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { name, bio, preferences, profile, address, gender } = req.body;

    // ============================================
    // NORMALIZE AND VALIDATE INPUT DATA
    // ============================================
    
    // Update basic info
    if (name) {
        if (typeof name !== 'string' || name.trim().length < 2) {
            throw new AppError('❌ Invalid Name: Name must be at least 2 characters long.', 400);
        }
        user.name = name.trim();
    }
    
    if (bio) {
        if (typeof bio !== 'string') {
            throw new AppError('❌ Invalid Bio: Bio must be a string.', 400);
        }
        if (bio.length > 500) {
            throw new AppError(`📝 Bio Too Long: Your bio is ${bio.length} characters, but maximum is 500. Please shorten by ${bio.length - 500} characters.`, 400);
        }
        user.bio = bio.trim();
    }

    // ============================================
    // HANDLE PROFILE UPDATES WITH VALIDATION
    // ============================================
    if (profile) {
        let profileData = typeof profile === 'string' ? JSON.parse(profile) : profile;
        
        // Normalize gender to uppercase enum values
        if (profileData.gender) {
            const genderUpper = profileData.gender.toUpperCase();
            const validGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
            
            if (!validGenders.includes(genderUpper)) {
                throw new AppError(
                    `👤 Invalid Gender: "${profileData.gender}" is not valid. Please select from: Male, Female, Other, or Prefer Not to Say.`,
                    400
                );
            }
            profileData.gender = genderUpper;
        }
        
        // Handle address - convert string to object if needed
        if (profileData.address) {
            if (typeof profileData.address === 'string') {
                // Parse string address into structured format
                const addressStr = profileData.address.trim();
                profileData.address = {
                    street: addressStr,
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India'
                };
                
                // Try to extract city/state from comma-separated string
                const parts = addressStr.split(',').map(p => p.trim()).filter(p => p);
                if (parts.length >= 2) {
                    profileData.address.street = parts.slice(0, -1).join(', ');
                    profileData.address.city = parts[parts.length - 1];
                }
            } else if (typeof profileData.address === 'object') {
                // Ensure all required address fields exist
                profileData.address = {
                    street: profileData.address.street || '',
                    city: profileData.address.city || '',
                    state: profileData.address.state || '',
                    zipCode: profileData.address.zipCode || '',
                    country: profileData.address.country || 'India'
                };
            }
        }
        
        // Merge with existing profile
        user.profile = {
            ...user.profile.toObject(),
            ...profileData
        };
    }

    // ============================================
    // HANDLE STANDALONE GENDER UPDATE
    // ============================================
    if (gender && !profile) {
        const genderUpper = gender.toUpperCase();
        const validGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
        
        if (!validGenders.includes(genderUpper)) {
            throw new AppError(
                `👤 Invalid Gender: "${gender}" is not valid. ✅ Valid options: Male, Female, Other, Prefer Not to Say.`,
                400
            );
        }
        
        user.profile.gender = genderUpper;
    }

    // ============================================
    // HANDLE STANDALONE ADDRESS UPDATE
    // ============================================
    if (address && !profile) {
        if (typeof address === 'string') {
            const addressStr = address.trim();
            user.profile.address = {
                street: addressStr,
                city: '',
                state: '',
                zipCode: '',
                country: 'India'
            };
            
            // Try to parse comma-separated address
            const parts = addressStr.split(',').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
                user.profile.address.street = parts.slice(0, -1).join(', ');
                user.profile.address.city = parts[parts.length - 1];
            }
        } else if (typeof address === 'object') {
            user.profile.address = {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                zipCode: address.zipCode || '',
                country: address.country || 'India'
            };
        }
    }

    // ============================================
    // UPDATE PREFERENCES
    // ============================================
    if (preferences) {
        try {
            const prefsData = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;
            user.preferences = {
                ...user.preferences.toObject(),
                ...prefsData
            };
        } catch (e) {
            throw new AppError('❌ Invalid Preferences: Unable to parse preferences data.', 400);
        }
    }

    // ============================================
    // UPDATE PROFILE PHOTO
    // ============================================
    if (req.files && req.files.profilePhoto) {
        const photoPath = req.files.profilePhoto[0].path;
        if (!photoPath || !photoPath.match(/\.(jpg|jpeg|png|gif)$/i)) {
            throw new AppError('❌ Invalid Image: Profile photo must be JPG, PNG, or GIF format.', 400);
        }
        user.profilePhoto = photoPath;
    }

    // ============================================
    // SAVE WITH ERROR HANDLING
    // ============================================
    try {
        await user.save();
    } catch (saveError) {
        console.error('Profile save error:', saveError);
        
        // Handle specific mongoose validation errors
        if (saveError.name === 'ValidationError') {
            const errorMessages = Object.values(saveError.errors).map(err => {
                if (err.kind === 'enum') {
                    return `❌ Invalid ${err.path}: "${err.value}" is not a valid option.`;
                }
                return err.message;
            });
            throw new AppError(`Validation Error: ${errorMessages.join(', ')}`, 400);
        }
        
        throw saveError;
    }

    res.status(200).json({
        success: true,
        message: '✅ Profile updated successfully!',
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profile: user.profile,
            profilePhoto: user.profilePhoto,
            bio: user.bio,
            preferences: user.preferences
        }
    });
});

/**
 * Add emergency contact
 */
exports.addEmergencyContact = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { name, phone, relation } = req.body;

    if (user.emergencyContacts.length >= 3) {
        throw new AppError('Maximum 3 emergency contacts allowed', 400);
    }

    user.emergencyContacts.push({
        name,
        phone,
        relation
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Emergency contact added',
        emergencyContacts: user.emergencyContacts
    });
});

/**
 * Remove emergency contact
 */
exports.removeEmergencyContact = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { contactId } = req.params;

    user.emergencyContacts.pull(contactId);
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Emergency contact removed',
        emergencyContacts: user.emergencyContacts
    });
});

/**
 * Add vehicle
 */
exports.addVehicle = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.role !== 'RIDER') {
        throw new AppError('Only riders can add vehicles', 400);
    }

    const { type, make, model, year, registrationNumber, color, seatingCapacity } = req.body;

    // Validate required fields
    if (!type || !make || !model || !year || !registrationNumber || !seatingCapacity) {
        throw new AppError('All vehicle fields are required', 400);
    }

    // Validate field formats
    if (typeof type !== 'string' || type.trim().length === 0) {
        throw new AppError('Vehicle type is required', 400);
    }

    if (typeof make !== 'string' || make.trim().length === 0) {
        throw new AppError('Vehicle make is required', 400);
    }

    if (typeof model !== 'string' || model.trim().length === 0) {
        throw new AppError('Vehicle model is required', 400);
    }

    // Validate year
    const vehicleYear = parseInt(year);
    const currentYear = new Date().getFullYear();
    if (isNaN(vehicleYear) || vehicleYear < 1900 || vehicleYear > currentYear + 1) {
        throw new AppError(`Year must be between 1900 and ${currentYear + 1}`, 400);
    }

    // Validate registration number
    const cleanRegistrationNumber = registrationNumber.trim().toUpperCase();
    if (cleanRegistrationNumber.length === 0) {
        throw new AppError('Registration number is required', 400);
    }

    // Validate seating capacity
    const capacity = parseInt(seatingCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 15) {
        throw new AppError('Seating capacity must be between 1 and 15', 400);
    }

    const vehicle = {
        type: type.trim(),
        make: make.trim(),
        model: model.trim(),
        year: vehicleYear,
        registrationNumber: cleanRegistrationNumber,
        color: color ? color.trim() : '',
        seatingCapacity: capacity,
        isVerified: false
    };

    if (req.files && req.files.vehiclePhoto && req.files.vehiclePhoto.length > 0) {
        vehicle.photos = req.files.vehiclePhoto.map(file => file.path);
    }

    user.vehicles.push(vehicle);
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Vehicle added successfully',
        vehicles: user.vehicles
    });
});

/**
 * Remove vehicle
 */
exports.removeVehicle = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { vehicleId } = req.params;

    // Check if vehicle is being used in any active ride
    const activeRide = await Ride.findOne({
        rider: user._id,
        vehicle: vehicleId,
        status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
    });

    if (activeRide) {
        throw new AppError('Cannot remove vehicle with active rides', 400);
    }

    user.vehicles.pull(vehicleId);
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Vehicle removed',
        vehicles: user.vehicles
    });
});

/**
 * Show trip history
 */
exports.showTripHistory = asyncHandler(async (req, res) => {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let trips, totalTrips;

    if (user.role === 'RIDER') {
        // For riders, fetch completed rides
        totalTrips = await Ride.countDocuments({
            rider: user._id,
            status: 'COMPLETED'
        });

        const rides = await Ride.find({
            rider: user._id,
            status: 'COMPLETED'
        })
        .populate({
            path: 'bookings',
            populate: {
                path: 'passenger',
                select: 'name profilePhoto rating'
            }
        })
        .sort({ 'schedule.departureDateTime': -1 })
        .skip(skip)
        .limit(limit);

        // Transform rides to include expected properties and carbon calculations
        trips = rides.map(ride => {
            const rideObj = ride.toObject();
            
            // Calculate carbon savings for this ride
            let carbonSaved = 0;
            const distance = rideObj.route?.distance || 0;
            const completedBookings = (rideObj.bookings || []).filter(b => b.status === 'COMPLETED');
            const totalPassengers = completedBookings.length;
            
            if (distance > 0 && totalPassengers > 0) {
                const vehicle = user.vehicles?.find(v => v._id.toString() === rideObj.vehicle?.toString());
                const vehicleType = vehicle?.type || 'SEDAN';
                const fuelType = vehicle?.fuelType || 'PETROL';
                
                const savings = carbonCalculator.calculateCarbonSaved(
                    distance,
                    vehicleType,
                    totalPassengers,
                    fuelType
                );
                carbonSaved = savings.totalSaved;
            }
            
            return {
                ...rideObj,
                // Map route.start to from for template compatibility
                from: {
                    address: rideObj.route?.start?.address || rideObj.route?.start?.name || 'Not available',
                    coordinates: rideObj.route?.start?.coordinates
                },
                // Map route.destination to to for template compatibility
                to: {
                    address: rideObj.route?.destination?.address || rideObj.route?.destination?.name || 'Not available',
                    coordinates: rideObj.route?.destination?.coordinates
                },
                distance: distance,
                departureTime: rideObj.schedule?.departureDateTime,
                totalEarnings: rideObj.pricing?.totalEarnings || 0,
                completedAt: rideObj.tracking?.completedAt || rideObj.updatedAt,
                carbonSaved: parseFloat(carbonSaved.toFixed(2))
            };
        });
    } else {
        // For passengers, fetch completed bookings
        totalTrips = await Booking.countDocuments({
            passenger: user._id,
            status: 'COMPLETED'
        });

        trips = await Booking.find({
            passenger: user._id,
            status: 'COMPLETED'
        })
        .populate({
            path: 'ride',
            populate: { path: 'rider', select: 'name profilePhoto rating vehicles' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Transform bookings to include expected properties from ride and carbon calculations
        trips = trips.map(booking => {
            const bookingObj = booking.toObject();
            
            // Ensure totalAmount is available at top level
            if (!bookingObj.totalAmount && bookingObj.payment?.totalAmount) {
                bookingObj.totalAmount = bookingObj.payment.totalAmount;
            }
            
            // Add completion date
            bookingObj.completedAt = bookingObj.journey?.completedAt || bookingObj.updatedAt;
            
            // Calculate carbon savings for passenger
            let carbonSaved = 0;
            if (bookingObj.ride) {
                const distance = bookingObj.ride.route?.distance || 0;
                const totalPassengers = (bookingObj.ride.bookings || []).filter(b => b.status === 'COMPLETED').length;
                
                if (distance > 0 && totalPassengers > 0) {
                    const rider = bookingObj.ride.rider;
                    const vehicle = rider?.vehicles?.find(v => v._id.toString() === bookingObj.ride.vehicle?.toString());
                    const vehicleType = vehicle?.type || 'SEDAN';
                    const fuelType = vehicle?.fuelType || 'PETROL';
                    
                    const savings = carbonCalculator.calculateCarbonSaved(
                        distance,
                        vehicleType,
                        totalPassengers,
                        fuelType
                    );
                    // Passenger's share of savings
                    carbonSaved = savings.savedPerPerson;
                }
                
                // Add ride data at booking level for easier access
                bookingObj.ride.from = {
                    address: bookingObj.ride.route?.start?.address || bookingObj.ride.route?.start?.name || 'Not available',
                    coordinates: bookingObj.ride.route?.start?.coordinates
                };
                bookingObj.ride.to = {
                    address: bookingObj.ride.route?.destination?.address || bookingObj.ride.route?.destination?.name || 'Not available',
                    coordinates: bookingObj.ride.route?.destination?.coordinates
                };
                bookingObj.ride.distance = bookingObj.ride.route?.distance;
                bookingObj.ride.departureTime = bookingObj.ride.schedule?.departureDateTime;
                bookingObj.ride.vehicle = bookingObj.ride.vehicle || null;
            }
            
            bookingObj.carbonSaved = parseFloat(carbonSaved.toFixed(2));
            return bookingObj;
        });
    }

    const pagination = helpers.paginate(totalTrips, page, limit);

    res.render('user/trip-history', {
        title: 'Trip History - LANE Carpool',
        user,
        trips,
        pagination
    });
});

/**
 * Show notifications page
 */
exports.showNotifications = asyncHandler(async (req, res) => {
    res.render('user/notifications', {
        title: 'Notifications - LANE Carpool',
        user: req.user
    });
});

/**
 * Show settings page
 */
exports.showSettings = (req, res) => {
    res.render('user/settings', {
        title: 'Settings - LANE Carpool',
        user: req.user
    });
};

/**
 * Update settings
 */
exports.updateSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { emailNotifications, smsNotifications, pushNotifications } = req.body;

    user.preferences.notifications = {
        email: emailNotifications === 'true',
        sms: smsNotifications === 'true',
        push: pushNotifications === 'true'
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Settings updated successfully'
    });
});

/**
 * Deactivate account (temporary - can be reactivated)
 */
exports.deactivateAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { reason } = req.body;

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check if already deactivated
    if (!user.isActive) {
        throw new AppError('Account is already deactivated', 400);
    }

    // Cancel active rides/bookings
    if (user.role === 'RIDER') {
        const activeRides = await Ride.find({
            rider: user._id,
            status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
        });

        for (const ride of activeRides) {
            ride.status = 'CANCELLED';
            ride.cancellationReason = 'Rider deactivated account';
            await ride.save();

            // Notify passengers
            const bookings = await Booking.find({ ride: ride._id, status: { $in: ['CONFIRMED', 'PENDING'] } });
            for (const booking of bookings) {
                await Notification.create({
                    user: booking.passenger,
                    type: 'RIDE_CANCELLED',
                    title: 'Ride Cancelled',
                    message: `The ride you booked has been cancelled because the rider deactivated their account.`,
                    priority: 'HIGH'
                });
            }
        }
    } else {
        const activeBookings = await Booking.find({
            passenger: user._id,
            status: { $in: ['CONFIRMED', 'PENDING'] }
        });

        for (const booking of activeBookings) {
            booking.status = 'CANCELLED';
            booking.cancellationReason = 'Passenger deactivated account';
            await booking.save();

            // Notify rider
            await Notification.create({
                user: booking.ride.rider,
                type: 'BOOKING_CANCELLED',
                title: 'Booking Cancelled',
                message: `A passenger cancelled their booking because they deactivated their account.`,
                priority: 'MEDIUM'
            });
        }
    }

    // Deactivate account
    user.isActive = false;
    user.accountStatus = 'INACTIVE';
    user.deactivatedAt = new Date();
    user.deactivationReason = reason || 'User requested';
    
    await user.save();

    // Send confirmation email
    if (user.email) {
        try {
            await sendEmail({
                to: user.email,
                subject: 'Account Deactivated - LANE Carpool',
                text: `Hi ${user.profile?.firstName || 'User'},\n\nYour account has been temporarily deactivated. You can reactivate it anytime by logging back in.\n\nIf you didn't request this, please contact support immediately.\n\nBest regards,\nLANE Carpool Team`,
                html: `
                    <h2>Account Deactivated</h2>
                    <p>Hi ${user.profile?.firstName || 'User'},</p>
                    <p>Your account has been temporarily deactivated. You can reactivate it anytime by logging back in.</p>
                    <p><strong>What happens next:</strong></p>
                    <ul>
                        <li>Your profile is hidden</li>
                        <li>Active rides/bookings have been cancelled</li>
                        <li>Your data is safely preserved</li>
                    </ul>
                    <p>If you didn't request this, please contact support immediately.</p>
                    <p>Best regards,<br>LANE Carpool Team</p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send deactivation email:', emailError);
        }
    }

    // Destroy session
    req.session.destroy();

    res.status(200).json({
        success: true,
        message: 'Account deactivated successfully. You can reactivate anytime by logging in.',
        redirectUrl: '/auth/login'
    });
});

/**
 * Reactivate account
 */
exports.reactivateAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check if already active
    if (user.isActive) {
        throw new AppError('Account is already active', 400);
    }

    // Reactivate account
    user.isActive = true;
    user.accountStatus = 'ACTIVE';
    user.reactivatedAt = new Date();
    
    await user.save();

    // Send confirmation email
    if (user.email) {
        try {
            await sendEmail({
                to: user.email,
                subject: 'Welcome Back! - LANE Carpool',
                text: `Hi ${user.profile?.firstName || 'User'},\n\nYour account has been reactivated. Welcome back to LANE Carpool!\n\nBest regards,\nLANE Carpool Team`,
                html: `
                    <h2>Welcome Back!</h2>
                    <p>Hi ${user.profile?.firstName || 'User'},</p>
                    <p>Your account has been successfully reactivated. Welcome back to LANE Carpool!</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Create or book rides</li>
                        <li>Connect with other users</li>
                        <li>Access all your previous data</li>
                    </ul>
                    <p>Best regards,<br>LANE Carpool Team</p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send reactivation email:', emailError);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Account reactivated successfully. Welcome back!'
    });
});

/**
 * Delete account (permanent)
 */
exports.deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { reason } = req.body;

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check for active rides/bookings
    if (user.role === 'RIDER') {
        const activeRides = await Ride.countDocuments({
            rider: user._id,
            status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
        });

        if (activeRides > 0) {
            throw new AppError(
                '❌ Cannot delete account with active rides. Please cancel all active rides first or contact support.',
                400
            );
        }
    } else {
        const activeBookings = await Booking.countDocuments({
            passenger: user._id,
            status: { $in: ['CONFIRMED', 'IN_PROGRESS'] }
        });

        if (activeBookings > 0) {
            throw new AppError(
                '❌ Cannot delete account with active bookings. Please cancel all active bookings first or contact support.',
                400
            );
        }
    }

    // Store user info for email before deletion
    const userEmail = user.email;
    const userName = user.profile?.firstName || 'User';

    // Soft delete - mark as deleted but keep data for legal/audit purposes
    user.accountStatus = 'DELETED';
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = reason || 'User requested';
    
    // Anonymize sensitive data
    user.email = `deleted_${user._id}@deleted.com`;
    user.phone = `DELETED_${Date.now()}`;
    user.password = Math.random().toString(36); // Invalidate password
    
    await user.save();

    // Send farewell email before anonymization
    if (userEmail) {
        try {
            await sendEmail({
                to: userEmail,
                subject: 'Account Deleted - LANE Carpool',
                text: `Hi ${userName},\n\nYour account has been permanently deleted as requested.\n\nWe're sorry to see you go. Your data will be retained for legal purposes but anonymized.\n\nIf you change your mind, you can create a new account anytime.\n\nBest regards,\nLANE Carpool Team`,
                html: `
                    <h2>Account Deleted</h2>
                    <p>Hi ${userName},</p>
                    <p>Your account has been permanently deleted as requested.</p>
                    <p><strong>What was deleted:</strong></p>
                    <ul>
                        <li>Your profile and personal information</li>
                        <li>Access to all features</li>
                        <li>Your login credentials</li>
                    </ul>
                    <p><strong>Data Retention:</strong> Some anonymized data may be retained for legal and audit purposes.</p>
                    <p>We're sorry to see you go. If you change your mind, you can create a new account anytime.</p>
                    <p>Best regards,<br>LANE Carpool Team</p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send deletion email:', emailError);
        }
    }

    // Destroy session
    req.session.destroy();

    res.status(200).json({
        success: true,
        message: 'Account deleted successfully. We\'re sorry to see you go.',
        redirectUrl: '/'
    });
});

/**
 * Live Location Broadcaster
 * For drivers/riders to send their real-time location during active rides
 */

class LiveLocationBroadcaster {
    constructor(rideId, bookingId, userId) {
        this.rideId = rideId;
        this.bookingId = bookingId;
        this.userId = userId;
        this.watchId = null;
        this.isActive = false;
        this.updateInterval = 3000; // 3 seconds
        this.lastLocation = null;
        this.socket = io();
        
        console.log('📡 [Location Broadcaster] Initialized for ride:', rideId);
    }

    /**
     * Start broadcasting location
     */
    async start() {
        if (this.isActive) {
            console.warn('⚠️  [Location Broadcaster] Already active');
            return { success: false, message: 'Already broadcasting' };
        }

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.error('❌ [Location Broadcaster] Geolocation not supported');
            return { success: false, message: 'Geolocation not supported by your browser' };
        }

        try {
            // Request permission first
            const permissionTest = await this.requestLocationPermission();
            if (!permissionTest.success) {
                return permissionTest;
            }

            // Start watching position
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handleLocationUpdate(position),
                (error) => this.handleLocationError(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );

            this.isActive = true;
            console.log('✅ [Location Broadcaster] Started broadcasting');
            
            // Show notification to user
            this.showStatus('🔴 Live Location Active', 'Your location is being shared with passengers', 'success');
            
            return { success: true, message: 'Location broadcasting started' };
        } catch (error) {
            console.error('❌ [Location Broadcaster] Failed to start:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Stop broadcasting location
     */
    stop() {
        if (!this.isActive) {
            console.warn('⚠️  [Location Broadcaster] Not active');
            return;
        }

        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.isActive = false;
        console.log('⏹️  [Location Broadcaster] Stopped broadcasting');
        
        this.showStatus('⚫ Location Sharing Stopped', 'Passengers can no longer see your live location', 'info');
    }

    /**
     * Request location permission
     */
    async requestLocationPermission() {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('✅ [Location Broadcaster] Permission granted');
                    resolve({ success: true, position });
                },
                (error) => {
                    console.error('❌ [Location Broadcaster] Permission denied:', error);
                    let errorMessage = 'Failed to get location permission. ';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please enable location access in your browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'An unknown error occurred.';
                    }
                    
                    resolve({ success: false, message: errorMessage });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    /**
     * Handle location update
     */
    handleLocationUpdate(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0, // Convert m/s to km/h
            heading: position.coords.heading,
            altitude: position.coords.altitude,
            timestamp: new Date(position.timestamp)
        };

        this.lastLocation = location;

        console.log('📍 [Location Broadcaster] Location update:', {
            lat: location.latitude.toFixed(6),
            lng: location.longitude.toFixed(6),
            speed: location.speed,
            accuracy: Math.round(location.accuracy)
        });

        // Emit via Socket.IO
        this.socket.emit('location-update', {
            rideId: this.rideId,
            bookingId: this.bookingId,
            location,
            userId: this.userId
        });

        // Also emit as rider-location for clarity
        this.socket.emit('rider-location', {
            rideId: this.rideId,
            bookingId: this.bookingId,
            location,
            userId: this.userId
        });

        // Update UI if elements exist
        this.updateUI(location);
    }

    /**
     * Handle location error
     */
    handleLocationError(error) {
        console.error('❌ [Location Broadcaster] Error:', error);
        
        let errorMessage = 'Location error: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += 'Permission denied. Please enable location access.';
                this.stop();
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location unavailable. Retrying...';
                break;
            case error.TIMEOUT:
                errorMessage += 'Request timed out. Retrying...';
                break;
            default:
                errorMessage += 'Unknown error occurred.';
        }
        
        this.showStatus('⚠️  Location Error', errorMessage, 'error');
    }

    /**
     * Update UI elements
     */
    updateUI(location) {
        // Update speed display
        const speedElement = document.getElementById('currentSpeed');
        if (speedElement) {
            speedElement.textContent = Math.round(location.speed);
        }

        // Update accuracy display
        const accuracyElement = document.getElementById('locationAccuracy');
        if (accuracyElement) {
            accuracyElement.textContent = Math.round(location.accuracy);
        }

        // Update last update time
        const lastUpdateElement = document.getElementById('lastLocationUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }

        // Update status indicator
        const statusElement = document.getElementById('liveLocationStatus');
        if (statusElement) {
            statusElement.className = 'status-indicator live';
            statusElement.innerHTML = '🔴 Live';
        }
    }

    /**
     * Show status notification
     */
    showStatus(title, message, type = 'info') {
        // Check if showAlert function exists (from your existing code)
        if (typeof showAlert === 'function') {
            showAlert(`${title}: ${message}`, type);
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }

    /**
     * Get current location once (without watching)
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0,
                        timestamp: new Date(position.timestamp)
                    };
                    resolve(location);
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isActive: this.isActive,
            lastLocation: this.lastLocation,
            rideId: this.rideId,
            bookingId: this.bookingId
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveLocationBroadcaster;
}

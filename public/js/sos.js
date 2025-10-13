/**
 * SOS Emergency System - Frontend JavaScript (Updated for Localhost Testing)
 * Handles 3-second hold button, geolocation, and emergency triggers
 */

// Global state
let map = null;
let userMarker = null;
let currentLocation = null;
let holdTimer = null;
let holdStartTime = null;
let activeEmergency = null;
let isTriggering = false; // Flag to prevent multiple simultaneous triggers
const HOLD_DURATION = 3000; // 3 seconds

// Default fallback location (for testing if user denies location)
const FALLBACK_LOCATION = { latitude: 20.5937, longitude: 78.9629 }; // India center

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the SOS emergency page
    // Check if this is the admin dashboard by looking for admin-specific elements
    const isAdminDashboard = window.location.pathname.includes('/admin') || 
                            document.querySelector('#emergencyList') !== null;
    
    if (isAdminDashboard) {
        console.log('⏭️ [SOS] On admin dashboard, skipping user SOS initialization');
        return;
    }
    
    // Check if we have the SOS button element
    const sosButton = document.getElementById('sosButton');
    if (!sosButton) {
        console.log('⏭️ [SOS] No SOS button found, skipping initialization');
        return;
    }
    
    console.log('🌟 [DOM-READY] ========================================');
    console.log('🌟 [DOM-READY] SOS PAGE LOADED - DOM READY');
    console.log('🌟 [DOM-READY] ========================================');
    console.log('🌟 [DOM-READY] Browser:', navigator.userAgent);
    console.log('🌟 [DOM-READY] Geolocation available:', !!navigator.geolocation);
    console.log('🌟 [DOM-READY] Starting initialization...');
    initializeSOSSystem();
});

/**
 * Initialize SOS System
 */
async function initializeSOSSystem() {
    console.log('🚨 [INIT] Starting SOS System initialization...');
    console.log('🚨 [INIT] Current location:', currentLocation);
    
    // Initialize map first
    console.log('🚨 [INIT] Initializing map...');
    initializeMap();
    
    // Load emergency contacts
    console.log('🚨 [INIT] Loading emergency contacts...');
    await loadEmergencyContacts();
    
    // Check for active emergency
    console.log('🚨 [INIT] Checking for active emergency...');
    await checkActiveEmergency();
    
    // Setup SOS button
    console.log('🚨 [INIT] Setting up SOS button...');
    setupSOSButton();
    
    // Request location permission immediately (browser will show native dialog)
    console.log('🚨 [INIT] Requesting location permission...');
    const locationGranted = await requestLocationPermission();
    console.log('🚨 [INIT] Location permission result:', locationGranted);
    
    // Start location tracking
    startLocationTracking();
    
    console.log('🚨 [INIT] SOS System initialization complete!');
}

/**
 * Request location permission with fallback
 */
async function requestLocationPermission() {
    console.log('📍 [PERMISSION] Checking geolocation support...');
    console.log('📍 [PERMISSION] Secure context:', window.isSecureContext);
    console.log('📍 [PERMISSION] Location:', window.location.href);
    
    // Check geolocation support
    if (!navigator.geolocation) {
        console.warn('📍 [PERMISSION] Geolocation not supported. Using fallback location.');
        currentLocation = FALLBACK_LOCATION;
        updateLocationStatus('⚠️ Geolocation not supported. Using fallback location for testing.', 'warning');
        updateMapLocation(currentLocation.latitude, currentLocation.longitude);
        enableSOSButton();
        return false;
    }

    try {
        // Try Permissions API first (if available)
        if ('permissions' in navigator) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                console.log(`📍 [PERMISSION] Geolocation permission state: ${permissionStatus.state}`);

                if (permissionStatus.state === 'denied') {
                    console.warn('📍 [PERMISSION] Permission explicitly DENIED by user');
                    currentLocation = FALLBACK_LOCATION;
                    updateLocationStatus('❌ Location denied. Using fallback location for testing. <br><small>To enable: Click lock icon 🔒 in address bar → Allow Location</small>', 'error', true);
                    updateMapLocation(currentLocation.latitude, currentLocation.longitude);
                    enableSOSButton();
                    return false;
                }
            } catch (permError) {
                // Some browsers don't support permissions.query for geolocation
                console.log('📍 [PERMISSION] Permissions API not available, proceeding with direct request');
            }
        }

        // Try to acquire location (works for both 'granted' and 'prompt' states)
        return await acquireLocation();

    } catch (error) {
        console.error('📍 [PERMISSION] ❌ Location error:', error);
        console.error('📍 [PERMISSION] Error code:', error.code);
        console.error('📍 [PERMISSION] Error message:', error.message);
        
        // Use fallback on any error
        currentLocation = FALLBACK_LOCATION;
        let errorMessage = '⚠️ Could not get your location. Using fallback location for testing.';
        
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                console.warn('📍 [PERMISSION] Permission DENIED by user during prompt.');
                errorMessage = '❌ Location access denied. Using fallback location. <br><small>To enable: Click lock icon 🔒 in address bar → Allow Location → Reload page</small>';
                break;
            case 2: // POSITION_UNAVAILABLE
                console.warn('📍 [PERMISSION] Position UNAVAILABLE');
                errorMessage = '⚠️ Location unavailable. Using fallback location.';
                break;
            case 3: // TIMEOUT
                console.warn('📍 [PERMISSION] Request TIMEOUT');
                errorMessage = '⏱️ Location request timed out. Using fallback location.';
                break;
        }
        
        updateLocationStatus(errorMessage, 'warning', true);
        updateMapLocation(currentLocation.latitude, currentLocation.longitude);
        enableSOSButton();
        return false;
    }
}

/**
 * Acquire actual location
 */
async function acquireLocation() {
    console.log('📍 [ACQUIRE] Attempting to acquire position...');
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout
                maximumAge: 0
            });
        });

        console.log('📍 [ACQUIRE] ✅ Position acquired:', position);
        currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
        };
        
        console.log('📍 [ACQUIRE] Current location set:', currentLocation);
        updateLocationStatus('✅ Location acquired - Ready for SOS', 'success');
        updateMapLocation(currentLocation.latitude, currentLocation.longitude);
        enableSOSButton();
        
        return true;
    } catch (error) {
        console.warn('📍 [ACQUIRE] Failed to get position, using fallback.', error);
        currentLocation = FALLBACK_LOCATION;
        updateLocationStatus('⚠️ Location denied or unavailable. Using fallback location for testing.', 'warning', true);
        updateMapLocation(currentLocation.latitude, currentLocation.longitude);
        enableSOSButton();
        return false;
    }
}

/**
 * Enable SOS button
 */
function enableSOSButton() {
    const sosBtn = document.getElementById('sosButton');
    if (sosBtn) {
        sosBtn.disabled = false;
        console.log('📍 [ENABLE] SOS button enabled');
    }
}



/**
 * Initialize Leaflet Map
 */
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    // Use current location or fallback
    const defaultLat = currentLocation?.latitude || FALLBACK_LOCATION.latitude;
    const defaultLng = currentLocation?.longitude || FALLBACK_LOCATION.longitude;
    
    map = L.map('map').setView([defaultLat, defaultLng], currentLocation ? 15 : 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    if (currentLocation) {
        updateMapLocation(currentLocation.latitude, currentLocation.longitude);
    }
}

/**
 * Update map with user location
 */
function updateMapLocation(lat, lng) {
    if (!map) return;
    
    // Remove old marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    // Add new marker
    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    userMarker = L.marker([lat, lng], { icon: redIcon })
        .addTo(map)
        .bindPopup('<strong>Your Location</strong><br>Emergency will be triggered from here')
        .openPopup();
    
    map.setView([lat, lng], 15);
    
    // Reverse geocode to get address
    reverseGeocode(lat, lng);
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        document.getElementById('addressText').textContent = address;
    } catch (error) {
        console.error('Geocoding error:', error);
        document.getElementById('addressText').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

/**
 * Setup SOS Button with hold functionality
 */
function setupSOSButton() {
    const button = document.getElementById('sosButton');
    const circle = document.querySelector('.progress-ring-circle');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerText = document.getElementById('timerText');
    
    if (!button) return;
    
    // Enable button if location is available
    if (currentLocation) {
        button.disabled = false;
    }
    
    const circumference = 2 * Math.PI * 128; // radius = 128
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    
    // Mouse events
    button.addEventListener('mousedown', startHold);
    button.addEventListener('mouseup', cancelHold);
    button.addEventListener('mouseleave', cancelHold);
    
    // Touch events for mobile
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHold();
    });
    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        cancelHold();
    });
    button.addEventListener('touchcancel', cancelHold);
    
    function startHold() {
        if (button.disabled || activeEmergency || isTriggering) {
            console.warn('🚨 [HOLD] Button hold ignored - button disabled, active emergency exists, or already triggering');
            return;
        }
        
        console.log('🚨 Starting SOS hold...');
        button.classList.add('holding');
        timerDisplay.classList.remove('hidden');
        holdStartTime = Date.now();
        
        // Animate progress circle and timer
        holdTimer = setInterval(() => {
            const elapsed = Date.now() - holdStartTime;
            const progress = Math.min(elapsed / HOLD_DURATION, 1);
            const offset = circumference - (progress * circumference);
            circle.style.strokeDashoffset = offset;
            
            const remaining = Math.ceil((HOLD_DURATION - elapsed) / 1000);
            timerText.textContent = remaining;
            
            if (elapsed >= HOLD_DURATION) {
                clearInterval(holdTimer);
                cancelHold();
                triggerEmergency();
            }
        }, 50);
    }
    
    function cancelHold() {
        console.log('🚨 SOS hold cancelled');
        clearInterval(holdTimer);
        button.classList.remove('holding');
        timerDisplay.classList.add('hidden');
        circle.style.strokeDashoffset = circumference;
        timerText.textContent = '3';
        holdStartTime = null;
    }
}

/**
 * Trigger Emergency Alert
 */
async function triggerEmergency() {
    console.log('🚨🚨🚨 [TRIGGER] TRIGGERING EMERGENCY ALERT!');
    console.log('🚨 [TRIGGER] Current location:', currentLocation);
    console.log('🚨 [TRIGGER] Active emergency:', activeEmergency);
    console.log('🚨 [TRIGGER] Is triggering:', isTriggering);
    
    // Prevent multiple simultaneous triggers
    if (isTriggering) {
        console.warn('🚨 [TRIGGER] Already triggering, ignoring duplicate request');
        return;
    }
    
    // Check if there's already an active emergency
    if (activeEmergency) {
        console.warn('🚨 [TRIGGER] Active emergency already exists');
        showError('You already have an active emergency alert. Please cancel it first if it was a false alarm.');
        return;
    }
    
    isTriggering = true;
    
    try {
        // Get latest location or use fallback
        console.log('🚨 [TRIGGER] Updating current location...');
        await updateCurrentLocation();
        console.log('🚨 [TRIGGER] Location updated:', currentLocation);
        
        // Ensure we have a location (use fallback if necessary)
        if (!currentLocation) {
            console.warn('🚨 [TRIGGER] ⚠️ No location available, using fallback!');
            currentLocation = FALLBACK_LOCATION;
            updateLocationStatus('⚠️ Using fallback location for emergency.', 'warning');
        }
        
        // Show loading
        console.log('🚨 [TRIGGER] Showing loading indicator...');
        showLoading('Sending emergency alert...');
        
        // Send to server
        console.log('🚨 [TRIGGER] Sending POST request to /sos/trigger...');
        const requestBody = {
            location: currentLocation,
            type: 'SOS',
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }
        };
        console.log('🚨 [TRIGGER] Request body:', requestBody);
        
        const response = await fetch('/sos/trigger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('🚨 [TRIGGER] Response status:', response.status);
        console.log('🚨 [TRIGGER] Response OK:', response.ok);
        console.log('🚨 [TRIGGER] Response headers:', response.headers);
        
        // Try to parse JSON response
        let data;
        try {
            const responseText = await response.text();
            console.log('🚨 [TRIGGER] Raw response text:', responseText);
            data = JSON.parse(responseText);
            console.log('🚨 [TRIGGER] Parsed response data:', data);
        } catch (parseError) {
            console.error('🚨 [TRIGGER] ❌ Failed to parse response as JSON:', parseError);
            throw new Error('Invalid response from server');
        }
        
        // Check for success (handle both response.ok and data.success)
        if (response.ok && data.success) {
            console.log('🚨 [TRIGGER] ✅ SUCCESS! Emergency created:', data.emergency);
            activeEmergency = data.emergency;
            showSuccess('Emergency alert sent! Admin and guardians have been notified.');
            displayActiveEmergency(data.emergency);
            
            // Emit socket event for real-time updates
            if (window.socket) {
                console.log('🚨 [TRIGGER] Emitting socket event...');
                window.socket.emit('emergency:triggered', data.emergency);
            } else {
                console.warn('🚨 [TRIGGER] No socket connection available');
            }
        } else {
            console.error('🚨 [TRIGGER] ❌ Server returned failure');
            console.error('🚨 [TRIGGER] Response status:', response.status);
            console.error('🚨 [TRIGGER] Response message:', data.message);
            console.error('🚨 [TRIGGER] Full data:', data);
            
            // Check if it's an "already active" error
            if (data.message && data.message.includes('already have an active emergency')) {
                // If there's an emergency in the response, display it
                if (data.emergency) {
                    activeEmergency = data.emergency;
                    displayActiveEmergency(data.emergency);
                    showError('You already have an active emergency alert. Please cancel it first if it was a false alarm.');
                } else {
                    // Reload the page to fetch the active emergency
                    showError('You already have an active emergency alert. Reloading page...');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } else {
                showError(data.message || 'Failed to send emergency alert. Please try again.');
            }
        }
    } catch (error) {
        console.error('🚨 [TRIGGER] ❌ Exception occurred:', error);
        console.error('🚨 [TRIGGER] Error stack:', error.stack);
        showError('Failed to send emergency alert. Please try again.');
    } finally {
        isTriggering = false;
        console.log('🚨 [TRIGGER] Hiding loading indicator...');
        hideLoading();
        console.log('🚨 [TRIGGER] Emergency trigger process complete');
    }
}

/**
 * Update current location
 */
async function updateCurrentLocation() {
    console.log('📍 [UPDATE-LOC] Updating current location...');
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
        
        console.log('📍 [UPDATE-LOC] ✅ Position obtained:', position);
        currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
        };
        
        console.log('📍 [UPDATE-LOC] Current location updated:', currentLocation);
        
        if (map) {
            console.log('📍 [UPDATE-LOC] Updating map...');
            updateMapLocation(currentLocation.latitude, currentLocation.longitude);
        } else {
            console.warn('📍 [UPDATE-LOC] Map not available');
        }
        
        return true;
    } catch (error) {
        console.error('📍 [UPDATE-LOC] ❌ Location update error:', error);
        console.error('📍 [UPDATE-LOC] Error code:', error.code);
        return false;
    }
}

/**
 * Start continuous location tracking
 */
function startLocationTracking() {
    console.log('📡 [TRACKING] Starting continuous location tracking...');
    if (!navigator.geolocation) {
        console.error('📡 [TRACKING] Geolocation not supported');
        return;
    }
    
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            console.log('📡 [TRACKING] 📍 Position update:', position.coords);
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            if (map) {
                updateMapLocation(currentLocation.latitude, currentLocation.longitude);
            }
        },
        (error) => {
            console.error('📡 [TRACKING] ❌ Tracking error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        }
    );
    console.log('📡 [TRACKING] Watch ID:', watchId);
}

/**
 * Load emergency contacts
 */
async function loadEmergencyContacts() {
    try {
        const response = await fetch('/user/profile-data');
        const data = await response.json();
        
        const guardiansList = document.getElementById('guardiansList');
        if (!guardiansList) return;
        
        if (data.emergencyContacts && data.emergencyContacts.length > 0) {
            guardiansList.innerHTML = data.emergencyContacts.map(contact => `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">${contact.name}</p>
                            <p class="text-sm text-gray-600">${contact.relationship || 'Guardian'}</p>
                            ${contact.email ? `<p class="text-xs text-gray-600 mt-1"><i class="fas fa-envelope mr-1"></i>${contact.email}</p>` : ''}
                            ${contact.phone ? `<p class="text-xs text-gray-600"><i class="fas fa-phone mr-1"></i>${contact.phone}</p>` : ''}
                        </div>
                        <button onclick="removeEmergencyContact('${contact._id}')" 
                            class="ml-3 text-red-600 hover:text-red-700 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            guardiansList.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mb-2 text-2xl"></i>
                    <p class="text-yellow-800 text-sm font-semibold mb-2">No emergency contacts added yet</p>
                    <p class="text-yellow-700 text-xs mb-3">Add contacts who will be notified when you trigger SOS</p>
                    <button onclick="showAddContactModal()" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
                        <i class="fas fa-plus-circle mr-2"></i>Add Your First Contact
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

/**
 * Show add contact modal
 */
function showAddContactModal() {
    document.getElementById('addContactModal').classList.remove('hidden');
    document.getElementById('addContactForm').reset();
}

/**
 * Close add contact modal
 */
function closeAddContactModal() {
    document.getElementById('addContactModal').classList.add('hidden');
}

/**
 * Add emergency contact
 */
document.addEventListener('DOMContentLoaded', function() {
    const addContactForm = document.getElementById('addContactForm');
    if (addContactForm) {
        addContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contactName').value.trim();
            const relationship = document.getElementById('contactRelationship').value;
            const email = document.getElementById('contactEmail').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            
            if (!name || !email) {
                alert('Name and email are required');
                return;
            }
            
            try {
                const response = await fetch('/user/emergency-contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        relationship: relationship || 'Guardian',
                        email: email,
                        phone: phone || ''
                    })
                });
                
                const data = await response.json();
                
                if (data.success || response.ok) {
                    showSuccess('Emergency contact added successfully!');
                    closeAddContactModal();
                    await loadEmergencyContacts();
                } else {
                    alert(data.message || 'Failed to add contact');
                }
            } catch (error) {
                console.error('Error adding contact:', error);
                alert('Failed to add emergency contact. Please try again.');
            }
        });
    }
});

/**
 * Remove emergency contact
 */
async function removeEmergencyContact(contactId) {
    if (!confirm('Are you sure you want to remove this emergency contact?')) {
        return;
    }
    
    try {
        const response = await fetch(`/user/emergency-contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
            showSuccess('Emergency contact removed');
            await loadEmergencyContacts();
        } else {
            alert(data.message || 'Failed to remove contact');
        }
    } catch (error) {
        console.error('Error removing contact:', error);
        alert('Failed to remove contact');
    }
}

/**
 * Check for active emergency
 */
async function checkActiveEmergency() {
    try {
        const response = await fetch('/sos/status');
        const data = await response.json();
        
        if (data.success && data.emergency) {
            activeEmergency = data.emergency;
            displayActiveEmergency(data.emergency);
        }
    } catch (error) {
        console.error('Error checking emergency:', error);
    }
}

/**
 * Display active emergency
 */
function displayActiveEmergency(emergency) {
    const card = document.getElementById('activeEmergencyCard');
    const details = document.getElementById('emergencyDetails');
    const sosButton = document.getElementById('sosButton');
    
    if (!card || !details) return;
    
    card.classList.remove('hidden');
    sosButton.disabled = true;
    
    const triggeredTime = new Date(emergency.triggeredAt).toLocaleString();
    
    details.innerHTML = `
        <div class="flex items-center justify-between py-2 border-b">
            <span class="text-gray-700 font-semibold">Status:</span>
            <span class="px-3 py-1 bg-red-600 text-white rounded-full text-sm">${emergency.status}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b">
            <span class="text-gray-700 font-semibold">Triggered:</span>
            <span class="text-gray-900">${triggeredTime}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b">
            <span class="text-gray-700 font-semibold">Guardians Notified:</span>
            <span class="text-gray-900">${emergency.guardiansNotified?.length || 0}</span>
        </div>
        <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-3">
            <p class="text-yellow-900 text-sm flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                Your emergency alert is active. Admin has been notified and will respond soon.
            </p>
        </div>
    `;
}

/**
 * Cancel emergency
 */
async function cancelEmergency() {
    if (!activeEmergency) {
        showError('No active emergency to cancel');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this emergency alert? This should only be done if it was a false alarm.')) {
        return;
    }
    
    try {
        showLoading('Cancelling emergency alert...');
        
        console.log('🔴 [CANCEL] Cancelling emergency:', activeEmergency._id);
        
        const response = await fetch(`/sos/${activeEmergency._id}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔴 [CANCEL] Response status:', response.status);
        console.log('🔴 [CANCEL] Response OK:', response.ok);
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔴 [CANCEL] Response data:', data);
        
        hideLoading();
        
        if (data.success) {
            showSuccess('Emergency alert cancelled successfully');
            activeEmergency = null;
            
            // Hide active emergency card
            const emergencyCard = document.getElementById('activeEmergencyCard');
            if (emergencyCard) {
                emergencyCard.classList.add('hidden');
            }
            
            // Enable SOS button
            const sosButton = document.getElementById('sosButton');
            if (sosButton) {
                sosButton.disabled = false;
            }
            
            console.log('✅ Emergency cancelled successfully');
        } else {
            console.error('🔴 [CANCEL] Server returned success=false:', data.message);
            showError(data.message || 'Failed to cancel emergency');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ [CANCEL] Exception:', error);
        console.error('❌ [CANCEL] Error message:', error.message);
        console.error('❌ [CANCEL] Error stack:', error.stack);
        showError('Failed to cancel emergency. Please try again.');
    }
}

/**
 * Update location status
 */
function updateLocationStatus(message, type, showRetry = false) {
    const statusDiv = document.getElementById('locationStatus');
    if (!statusDiv) return;
    
    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const retryButton = showRetry ? `
        <button 
            onclick="retryLocationPermission()" 
            class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
            <i class="fas fa-redo mr-2"></i>Retry Location Access
        </button>
    ` : '';
    
    statusDiv.innerHTML = `
        <div class="${colors[type] || colors.warning} border rounded-lg p-4">
            <div class="flex items-center justify-center space-x-2">
                <i class="fas ${icons[type] || icons.warning}"></i>
                <span class="font-semibold">${message}</span>
            </div>
            ${retryButton}
        </div>
    `;
}

/**
 * Retry location permission (user-triggered)
 */
async function retryLocationPermission() {
    console.log('🔄 [RETRY] User clicked retry button');
    updateLocationStatus('🔄 Retrying location access...', 'info');
    const success = await requestLocationPermission();
    if (success && currentLocation) {
        const sosBtn = document.getElementById('sosButton');
        if (sosBtn) {
            sosBtn.disabled = false;
        }
        startLocationTracking();
    }
}

// Make retryLocationPermission globally accessible
window.retryLocationPermission = retryLocationPermission;

/**
 * Show success message
 */
function showSuccess(message) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.classList.remove('hidden');
        alertDiv.querySelector('p:last-child').textContent = message;
        
        setTimeout(() => {
            alertDiv.classList.add('hidden');
        }, 5000);
    } else {
        // Fallback: create a toast notification
        showToast(message, 'success');
    }
}

/**
 * Show error message
 */
function showError(message) {
    // Use toast notification instead of blocking alert
    showToast(message, 'error');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.getElementById('sosToast');
    if (existingToast) {
        existingToast.remove();
    }

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.id = 'sosToast';
    toast.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md animate-slideIn`;
    toast.innerHTML = `
        <div class="flex items-start space-x-3">
            <i class="fas ${icons[type]} text-2xl mt-1"></i>
            <div class="flex-1">
                <p class="font-semibold text-lg">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                <p class="text-sm mt-1">${message}</p>
            </div>
            <button onclick="document.getElementById('sosToast').remove()" class="text-white hover:text-gray-200">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000);
}

/**
 * Show loading
 */
function showLoading(message) {
    // Remove any existing loading indicator
    hideLoading();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'sosLoading';
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center';
    loadingDiv.innerHTML = `
        <div class="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p class="text-gray-800 font-semibold text-lg">${message || 'Processing...'}</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

/**
 * Hide loading
 */
function hideLoading() {
    const loadingDiv = document.getElementById('sosLoading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Export for use in other files
window.sosSystem = {
    triggerEmergency,
    cancelEmergency,
    updateCurrentLocation
};

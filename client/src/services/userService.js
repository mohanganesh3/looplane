import api from './api';

const userService = {
  // Get dashboard data
  getDashboard: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  // Update profile picture
  updateProfilePicture: async (formData) => {
    const response = await api.post('/user/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload driving license for verification
  uploadLicense: async (formData) => {
    const response = await api.post('/user/license/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get license verification status
  getLicenseStatus: async () => {
    const response = await api.get('/user/license/status');
    return response.data;
  },

  // Add vehicle details
  addVehicle: async (vehicleData) => {
    const response = await api.post('/user/vehicle', vehicleData);
    return response.data;
  },

  // Update vehicle details
  updateVehicle: async (vehicleId, vehicleData) => {
    const response = await api.put(`/user/vehicle/${vehicleId}`, vehicleData);
    return response.data;
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    const response = await api.delete(`/user/vehicle/${vehicleId}`);
    return response.data;
  },

  // Get user's vehicles
  getVehicles: async () => {
    const response = await api.get('/user/vehicles');
    return response.data;
  },

  // Get trip history
  getTripHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/user/trip-history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get carbon report
  getCarbonReport: async () => {
    const response = await api.get('/user/carbon-report');
    return response.data;
  },

  // Get settings
  getSettings: async () => {
    const response = await api.get('/user/settings');
    return response.data;
  },

  // Update settings
  updateSettings: async (data) => {
    const response = await api.put('/user/settings', data);
    return response.data;
  },

  // Update emergency contacts
  updateEmergencyContacts: async (contacts) => {
    const response = await api.put('/user/emergency-contacts', { contacts });
    return response.data;
  },

  // Get emergency contacts
  getEmergencyContacts: async () => {
    const response = await api.get('/user/emergency-contacts/list');
    return response.data;
  },

  // Add emergency contact
  addEmergencyContact: async (contactData) => {
    const response = await api.post('/user/emergency-contacts/add', contactData);
    return response.data;
  },

  // Send contact verification OTP
  sendContactVerification: async (contactId) => {
    const response = await api.post(`/user/emergency-contacts/${contactId}/send-verification`);
    return response.data;
  },

  // Verify contact with OTP
  verifyContact: async (contactId, otp) => {
    const response = await api.post(`/user/emergency-contacts/${contactId}/verify`, { otp });
    return response.data;
  },

  // Set primary contact
  setPrimaryContact: async (contactId) => {
    const response = await api.post(`/user/emergency-contacts/${contactId}/set-primary`);
    return response.data;
  },

  // Delete emergency contact
  deleteEmergencyContact: async (contactId) => {
    const response = await api.delete(`/user/emergency-contacts/${contactId}`);
    return response.data;
  },

  // Get notifications
  getNotifications: async (params = {}) => {
    const response = await api.get('/api/notifications/all', { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.post(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read');
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/user/change-password', data);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/user/account');
    return response.data;
  }
};

export default userService;

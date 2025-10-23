import api from './api';

const rideService = {
  // Search rides
  searchRides: async (params) => {
    const queryParams = new URLSearchParams();
    if (params.origin) queryParams.append('origin', JSON.stringify(params.origin));
    if (params.destination) queryParams.append('destination', JSON.stringify(params.destination));
    if (params.date) queryParams.append('date', params.date);
    if (params.seats) queryParams.append('seats', params.seats);
    
    const response = await api.get(`/rides/search/results?${queryParams.toString()}`);
    return response.data;
  },

  // Get ride by ID
  getRideById: async (id) => {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },

  // Get my rides (for riders)
  getMyRides: async (page = 1, limit = 10) => {
    const response = await api.get(`/rides/my-rides?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Post a new ride
  postRide: async (data) => {
    const response = await api.post('/rides/post', data);
    return response.data;
  },

  // Update ride
  updateRide: async (id, data) => {
    const response = await api.put(`/rides/${id}`, data);
    return response.data;
  },

  // Cancel ride
  cancelRide: async (id) => {
    const response = await api.delete(`/rides/${id}`);
    return response.data;
  },

  // Start ride
  startRide: async (id) => {
    const response = await api.post(`/rides/${id}/start`);
    return response.data;
  },

  // Complete ride
  completeRide: async (id) => {
    const response = await api.post(`/rides/${id}/complete`);
    return response.data;
  }
};

export default rideService;

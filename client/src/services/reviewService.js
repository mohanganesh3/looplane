import api from './api';

const reviewService = {
  getUserReviews: async (userId) => {
    const response = await api.get(`/api/reviews/user/${userId}`);
    return response.data;
  },

  getMyGivenReviews: async () => {
    const response = await api.get('/api/reviews/given');
    return response.data;
  },

  getMyReceivedReviews: async () => {
    const response = await api.get('/api/reviews/received');
    return response.data;
  },

  submitReview: async (bookingId, reviewData) => {
    const response = await api.post(`/api/reviews/booking/${bookingId}`, reviewData);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/api/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/api/reviews/${reviewId}`);
    return response.data;
  },

  getUserReviewStats: async (userId) => {
    const response = await api.get(`/api/reviews/stats/${userId}`);
    return response.data;
  }
};

export default reviewService;

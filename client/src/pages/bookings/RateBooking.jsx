import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LoadingSpinner, Alert } from '../../components/common';
import bookingService from '../../services/bookingService';

const RateBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratings, setRatings] = useState({
    punctuality: 0,
    communication: 0,
    cleanliness: 0,
    safety: 0
  });
  const [review, setReview] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [tags, setTags] = useState([]);

  const availableTags = [
    { id: 'friendly', label: 'Friendly', icon: '😊' },
    { id: 'onTime', label: 'On Time', icon: '⏰' },
    { id: 'cleanCar', label: 'Clean Car', icon: '✨' },
    { id: 'smoothRide', label: 'Smooth Ride', icon: '🚗' },
    { id: 'goodMusic', label: 'Good Music', icon: '🎵' },
    { id: 'safeDriving', label: 'Safe Driving', icon: '🛡️' },
    { id: 'greatConversation', label: 'Great Conversation', icon: '💬' },
    { id: 'comfortable', label: 'Comfortable', icon: '😌' }
  ];

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data.booking);
      
      // Check if already rated
      if (data.booking.rating) {
        setError('You have already rated this booking');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reviewData = {
        overallRating,
        ratings,
        review: review.trim(),
        wouldRecommend,
        tags
      };

      await bookingService.rateBooking(id, reviewData);
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/bookings/${id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tagId) => {
    setTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (success) {
    return (
      <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-500 text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">Your review has been submitted successfully.</p>
            <div className="flex justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <i 
                  key={star} 
                  className={`fas fa-star text-2xl ${star <= overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                ></i>
              ))}
            </div>
            <p className="text-sm text-gray-500">Redirecting to booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert type="error" message={error} />
          <Link to="/bookings" className="text-emerald-500 hover:underline mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const driver = booking?.ride?.rider;

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <Link to={`/bookings/${id}`} className="inline-flex items-center text-emerald-500 hover:text-emerald-700 mb-6">
          <i className="fas fa-arrow-left mr-2"></i>Back to Booking
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center">
              <i className="fas fa-star mr-3"></i>Rate Your Ride
            </h1>
            <p className="text-emerald-100 mt-1">
              Help other riders by sharing your experience
            </p>
          </div>

          {/* Driver Info */}
          {driver && (
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center">
                <img
                  src={driver.profilePhoto || '/images/default-avatar.png'}
                  alt={driver.firstName}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {driver.firstName} {driver.lastName?.charAt(0)}.
                  </h3>
                  <p className="text-gray-500 text-sm">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {booking.pickupPoint?.name || booking.ride?.source?.name} → {booking.dropoffPoint?.name || booking.ride?.destination?.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert type="error" message={error} />}

            {/* Overall Rating */}
            <div className="text-center">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                How was your overall experience?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition transform hover:scale-110"
                  >
                    <i 
                      className={`fas fa-star text-4xl ${
                        star <= (hoverRating || overallRating) 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    ></i>
                  </button>
                ))}
              </div>
              <p className="text-gray-500 mt-2">
                {overallRating === 0 && 'Tap to rate'}
                {overallRating === 1 && 'Poor'}
                {overallRating === 2 && 'Fair'}
                {overallRating === 3 && 'Good'}
                {overallRating === 4 && 'Very Good'}
                {overallRating === 5 && 'Excellent!'}
              </p>
            </div>

            {/* Detailed Ratings */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Rate specific aspects (optional)
              </label>
              
              {[
                { key: 'punctuality', label: 'Punctuality', icon: 'fa-clock' },
                { key: 'communication', label: 'Communication', icon: 'fa-comments' },
                { key: 'cleanliness', label: 'Cleanliness', icon: 'fa-broom' },
                { key: 'safety', label: 'Safety', icon: 'fa-shield-alt' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-700 flex items-center">
                    <i className={`fas ${item.icon} text-emerald-500 mr-2 w-5`}></i>
                    {item.label}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatings(prev => ({ ...prev, [item.key]: star }))}
                        className="focus:outline-none"
                      >
                        <i 
                          className={`fas fa-star ${
                            star <= ratings[item.key] ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        ></i>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What stood out? (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      tags.includes(tag.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{tag.icon}</span>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Would you recommend this driver?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center ${
                    wouldRecommend === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-thumbs-up mr-2"></i>Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center ${
                    wouldRecommend === false
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-thumbs-down mr-2"></i>No
                </button>
              </div>
            </div>

            {/* Written Review */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Write a review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with others..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="text-right text-xs text-gray-500 mt-1">
                {review.length}/500
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || overallRating === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RateBooking;

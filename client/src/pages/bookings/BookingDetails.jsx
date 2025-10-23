import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LoadingSpinner, Alert, Badge } from '../../components/common';
import bookingService from '../../services/bookingService';

const BookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data.booking);
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading booking..." />;
  }

  if (error || !booking) {
    return (
      <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert type="error" message={error || 'Booking not found'} />
          <Link to="/bookings" className="text-emerald-500 hover:underline mt-4 inline-block">
            ← Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link to="/bookings" className="inline-flex items-center text-emerald-500 hover:text-emerald-700 mb-6">
          <i className="fas fa-arrow-left mr-2"></i>Back to My Bookings
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <BookingHeader booking={booking} />
        </div>

        {/* OTP Section */}
        <OTPSection booking={booking} />

        {/* Journey Status */}
        <JourneyStatus booking={booking} />

        {/* Content will be added in next commits */}
      </div>
    </div>
  );
};

// OTP Section for Passengers
const OTPSection = ({ booking }) => {
  const copyOTP = (otp, type) => {
    navigator.clipboard.writeText(otp);
    alert(`${type} OTP copied!`);
  };

  // Pickup OTP
  if ((booking.status === 'CONFIRMED' || booking.status === 'PICKUP_PENDING') && 
      booking.verification?.pickup?.code) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <i className="fas fa-key text-2xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold">Pickup OTP</h3>
              <p className="text-sm text-blue-100">Show this to your driver at pickup</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-6xl font-bold tracking-wider">
                {booking.verification.pickup.code}
              </p>
            </div>
            <button
              onClick={() => copyOTP(booking.verification.pickup.code, 'Pickup')}
              className="ml-4 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
            >
              <i className="fas fa-copy text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-2 text-sm text-blue-100">
          <i className="fas fa-info-circle mt-0.5"></i>
          <div>
            <p className="font-semibold">Important:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Share this OTP with driver when they arrive</li>
              <li>Don't share with anyone else</li>
              <li>OTP will expire in 30 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Dropoff OTP
  if (booking.status === 'PICKED_UP' && booking.verification?.dropoff?.code) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <i className="fas fa-flag-checkered text-2xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold">Dropoff OTP</h3>
              <p className="text-sm text-purple-100">Show this to your driver at destination</p>
            </div>
          </div>
        </div>

        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-6xl font-bold tracking-wider">
                {booking.verification.dropoff.code}
              </p>
            </div>
            <button
              onClick={() => copyOTP(booking.verification.dropoff.code, 'Dropoff')}
              className="ml-4 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
            >
              <i className="fas fa-copy text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-2 text-sm text-purple-100">
          <i className="fas fa-info-circle mt-0.5"></i>
          <div>
            <p className="font-semibold">Important:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Share this OTP when you reach your destination</li>
              <li>Driver will verify before marking dropoff complete</li>
              <li>OTP will expire in 60 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Journey Status Component
const JourneyStatus = ({ booking }) => {
  if (booking.status === 'PICKUP_PENDING') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center">
          <i className="fas fa-car text-blue-500 text-2xl mr-3 animate-bounce"></i>
          <div>
            <h3 className="font-semibold text-blue-800">Driver is on the way!</h3>
            <p className="text-sm text-blue-600">Get ready with your pickup OTP</p>
          </div>
        </div>
      </div>
    );
  }

  if (booking.status === 'PICKED_UP') {
    return (
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
        <div className="flex items-center">
          <i className="fas fa-route text-purple-500 text-2xl mr-3 animate-pulse"></i>
          <div>
            <h3 className="font-semibold text-purple-800">Journey in progress</h3>
            <p className="text-sm text-purple-600">You'll need your dropoff OTP when you reach destination</p>
          </div>
        </div>
      </div>
    );
  }

  if (booking.status === 'DROPPED_OFF' || booking.status === 'COMPLETED') {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <div className="flex items-center">
          <i className="fas fa-check-circle text-green-500 text-2xl mr-3"></i>
          <div>
            <h3 className="font-semibold text-green-800">Journey completed!</h3>
            <p className="text-sm text-green-600">Hope you had a great ride. Please rate your experience.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Booking Header Component
const BookingHeader = ({ booking }) => {
  const getStatusConfig = (status, payment) => {
    const isPaid = payment?.status === 'PAID';
    
    if ((status === 'DROPPED_OFF' || status === 'PICKED_UP') && isPaid) {
      return { class: 'bg-green-100 text-green-800', icon: 'fa-check-circle', text: 'Completed' };
    }
    if (status === 'DROPPED_OFF' && !isPaid) {
      return { class: 'bg-yellow-100 text-yellow-800', icon: 'fa-clock', text: 'Payment Pending' };
    }
    
    const configs = {
      'PENDING': { class: 'bg-yellow-100 text-yellow-800', icon: 'fa-clock', text: 'Pending' },
      'CONFIRMED': { class: 'bg-blue-100 text-blue-800', icon: 'fa-check-circle', text: 'Confirmed' },
      'PICKUP_PENDING': { class: 'bg-blue-100 text-blue-800', icon: 'fa-hourglass-half', text: 'Ready for Pickup' },
      'PICKED_UP': { class: 'bg-purple-100 text-purple-800', icon: 'fa-user-check', text: 'On Board' },
      'IN_PROGRESS': { class: 'bg-blue-100 text-blue-800', icon: 'fa-car', text: 'In Progress' },
      'COMPLETED': { class: 'bg-green-100 text-green-800', icon: 'fa-check-circle', text: 'Completed' },
      'CANCELLED': { class: 'bg-red-100 text-red-800', icon: 'fa-times-circle', text: 'Cancelled' },
      'REJECTED': { class: 'bg-red-100 text-red-800', icon: 'fa-ban', text: 'Rejected' }
    };
    return configs[status] || { class: 'bg-gray-100 text-gray-800', icon: 'fa-question', text: status };
  };

  const statusConfig = getStatusConfig(booking.status, booking.payment);

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          <i className="fas fa-ticket-alt text-emerald-500 mr-2"></i>Booking Details
        </h1>
        <p className="text-gray-600">
          Booking ID: <span className="font-mono font-semibold">#{booking._id.slice(-8).toUpperCase()}</span>
        </p>
        <span className={`${statusConfig.class} px-4 py-2 rounded-full text-sm font-semibold inline-block mt-2`}>
          <i className={`fas ${statusConfig.icon} mr-2`}></i>
          {statusConfig.text}
        </span>
      </div>
    </div>
  );
};

export default BookingDetails;

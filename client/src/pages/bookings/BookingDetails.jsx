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

        {/* Content will be added in next commits */}
      </div>
    </div>
  );
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

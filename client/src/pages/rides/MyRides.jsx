import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, LoadingSpinner, Badge } from '../../components/common';
import rideService from '../../services/rideService';

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const statusFilters = [
    { key: 'all', label: 'All Rides', color: 'bg-emerald-500' },
    { key: 'active', label: 'Active', color: 'bg-green-500', icon: 'fa-check-circle' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-blue-500', icon: 'fa-route' },
    { key: 'completed', label: 'Completed', color: 'bg-purple-500', icon: 'fa-flag-checkered' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500', icon: 'fa-times-circle' }
  ];

  useEffect(() => {
    fetchRides();
  }, [currentStatus, pagination.currentPage]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.currentPage };
      if (currentStatus !== 'all') params.status = currentStatus.toUpperCase().replace('-', '_');
      
      const data = await rideService.getMyRides(params);
      setRides(data.rides || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
    } catch (err) {
      setError('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'ACTIVE': { color: 'green', icon: 'fa-check-circle' },
      'IN_PROGRESS': { color: 'blue', icon: 'fa-route' },
      'COMPLETED': { color: 'purple', icon: 'fa-flag-checkered' },
      'CANCELLED': { color: 'red', icon: 'fa-times-circle' }
    };
    const { color, icon } = config[status] || { color: 'gray', icon: 'fa-question-circle' };
    return (
      <Badge variant={color}>
        <i className={`fas ${icon} mr-1`}></i>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && rides.length === 0) {
    return <LoadingSpinner fullScreen text="Loading rides..." />;
  }

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              <i className="fas fa-car text-emerald-500 mr-3"></i>My Rides
            </h1>
            <Link to="/rides/post" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition">
              <i className="fas fa-plus-circle mr-2"></i>Post New Ride
            </Link>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter.key}
                onClick={() => { setCurrentStatus(filter.key); setPagination(p => ({ ...p, currentPage: 1 })); }}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currentStatus === filter.key 
                    ? `${filter.color} text-white` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.icon && <i className={`fas ${filter.icon} mr-2`}></i>}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Rides List */}
        <div className="space-y-6">
          {rides.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <i className="fas fa-car-side text-gray-300 text-6xl mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No rides found</h3>
              <p className="text-gray-500 mb-6">
                {currentStatus === 'all' ? "You haven't posted any rides yet" : `No ${currentStatus} rides`}
              </p>
              <Link to="/rides/post" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                <i className="fas fa-plus-circle mr-2"></i>Post Your First Ride
              </Link>
            </div>
          ) : (
            rides.map(ride => (
              <RideCard key={ride._id} ride={ride} getStatusBadge={getStatusBadge} formatDate={formatDate} onRefresh={fetchRides} />
            ))
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              {pagination.currentPage > 1 && (
                <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setPagination(p => ({ ...p, currentPage: page }))}
                  className={`px-4 py-2 rounded-lg font-semibold ${page === pagination.currentPage ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              {pagination.currentPage < pagination.totalPages && (
                <button onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Ride Card Component
const RideCard = ({ ride, getStatusBadge, formatDate, onRefresh }) => {
  const confirmedBookings = (ride.bookings || []).filter(b => ['CONFIRMED', 'COMPLETED'].includes(b.status));
  const pendingBookings = (ride.bookings || []).filter(b => b.status === 'PENDING');

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {getStatusBadge(ride.status)}
          <div className="flex flex-wrap gap-2 mt-2">
            {ride.preferences?.autoAcceptBookings && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                <i className="fas fa-bolt mr-1"></i>Auto-Approve
              </span>
            )}
            {ride.preferences?.gender === 'FEMALE_ONLY' && (
              <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">
                <i className="fas fa-female mr-1"></i>Ladies Only
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {formatDate(ride.schedule?.departureDateTime || ride.schedule?.date)}
          </p>
          {ride.vehicle?.make && (
            <p className="text-gray-700 text-sm mt-2 font-medium">
              <i className="fas fa-car text-emerald-500 mr-1"></i>
              {ride.vehicle.make} {ride.vehicle.model}
              {ride.vehicle.licensePlate && <span className="text-gray-500 ml-1">({ride.vehicle.licensePlate})</span>}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-500">₹{ride.pricing?.totalEarnings || 0}</div>
          <p className="text-gray-600 text-sm">
            {confirmedBookings.length} / {ride.pricing?.totalSeats || 0} seats booked
          </p>
        </div>
      </div>

      {/* Route */}
      <div className="border-t border-b py-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <i className="fas fa-map-marker-alt text-green-600 w-6"></i>
            <span className="ml-2 font-medium">{ride.route?.start?.name || ride.route?.start?.address || 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-400 ml-6">
            <i className="fas fa-ellipsis-v"></i>
            <span className="ml-3 text-sm">
              {ride.route?.distance ? `${ride.route.distance.toFixed(1)} km` : 'Calculating...'}
              {ride.route?.duration && ` • ${Math.round(ride.route.duration)} mins`}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <i className="fas fa-map-marker-alt text-red-600 w-6"></i>
            <span className="ml-2 font-medium">{ride.route?.destination?.name || ride.route?.destination?.address || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="text-gray-600">
          <i className="fas fa-users text-emerald-500 mr-2"></i>
          {ride.pricing?.availableSeats || 0} seats available
        </div>
        <div className="text-gray-600">
          <i className="fas fa-rupee-sign text-emerald-500 mr-2"></i>
          ₹{ride.pricing?.pricePerSeat || 0} per seat
        </div>
        {ride.vehicle?.make && (
          <div className="text-gray-800 font-semibold">
            <i className="fas fa-car text-emerald-500 mr-2"></i>
            {ride.vehicle.make} {ride.vehicle.model}
          </div>
        )}
        {ride.carbon?.carbonSaved > 0 && (
          <div className="text-green-600">
            <i className="fas fa-leaf mr-2"></i>
            {ride.carbon.carbonSaved.toFixed(1)} kg CO₂
          </div>
        )}
      </div>

      {/* Pending Requests Count */}
      {pendingBookings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <span className="text-orange-700 font-semibold">
            <i className="fas fa-user-clock mr-2"></i>
            {pendingBookings.length} pending request{pendingBookings.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="border-t pt-4 flex flex-wrap gap-3">
        <Link to={`/rides/${ride._id}`} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition">
          <i className="fas fa-eye mr-2"></i>View Details
        </Link>
        {ride.bookings?.length > 0 && (
          <Link to={`/chat/${ride._id}`} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
            <i className="fas fa-comments mr-2"></i>Chat
          </Link>
        )}
      </div>

      <p className="text-gray-400 text-xs mt-4">
        <i className="fas fa-clock mr-1"></i>Posted {new Date(ride.createdAt).toLocaleString()}
      </p>
    </div>
  );
};

export default MyRides;

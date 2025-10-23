import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, Alert, Button } from '../../components/common';
import LocationInput from '../../components/common/LocationInput';
import userService from '../../services/userService';
import rideService from '../../services/rideService';

const PostRide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    origin: null,
    destination: null,
    date: '',
    time: '',
    vehicleId: '',
    availableSeats: 4,
    totalRidePrice: '',
    instantBooking: true,
    ladiesOnly: false,
    notes: ''
  });

  const [stops, setStops] = useState([]);
  const [distance, setDistance] = useState(null);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [pricePerSeat, setPricePerSeat] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (formData.totalRidePrice && formData.availableSeats) {
      const perSeat = Math.round(formData.totalRidePrice / formData.availableSeats);
      setPricePerSeat(perSeat);
    } else {
      setPricePerSeat(null);
    }
  }, [formData.totalRidePrice, formData.availableSeats]);

  useEffect(() => {
    if (formData.origin && formData.destination) {
      calculateDistance(formData.origin, formData.destination);
    }
  }, [formData.origin, formData.destination]);

  const calculateDistance = async (origin, destination) => {
    try {
      const [fromLon, fromLat] = origin.coordinates;
      const [toLon, toLat] = destination.coordinates;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
        setDistance(distanceKm);
        
        const predicted = Math.round(parseFloat(distanceKm) * 8);
        setPredictedPrice(predicted);
        
        if (!formData.totalRidePrice) {
          setFormData(prev => ({ ...prev, totalRidePrice: predicted }));
        }
      }
    } catch (err) {
      console.error('Distance calculation error:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await userService.getProfile();
      const approvedVehicles = (data.user?.vehicles || []).filter(v => v.status === 'APPROVED');
      setVehicles(approvedVehicles);
      if (approvedVehicles.length > 0) {
        setFormData(prev => ({ ...prev, vehicleId: approvedVehicles[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.origin || !formData.destination) {
      setError('Please select valid pickup and drop-off locations');
      return;
    }

    if (!formData.vehicleId) {
      setError('Please select a vehicle');
      return;
    }

    if (!formData.totalRidePrice || formData.totalRidePrice <= 0) {
      setError('Please enter a valid total ride price');
      return;
    }

    setSubmitting(true);

    try {
      const departureTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const rideData = {
        originCoordinates: formData.origin,
        destinationCoordinates: formData.destination,
        fromLocation: formData.origin.address,
        toLocation: formData.destination.address,
        departureTime,
        vehicleId: formData.vehicleId,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: pricePerSeat,
        distance: parseFloat(distance) || 0,
        instantBooking: formData.instantBooking,
        ladiesOnly: formData.ladiesOnly,
        notes: formData.notes,
        stops: stops.filter(s => s.location).map(s => s.location)
      };

      const result = await rideService.postRide(rideData);

      if (result.success) {
        setSuccess('Ride posted successfully!');
        setTimeout(() => navigate('/rides/my-rides'), 1500);
      } else {
        setError(result.message || 'Failed to post ride');
      }
    } catch (err) {
      setError(err.message || 'Failed to post ride');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (vehicles.length === 0) {
    return (
      <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <i className="fas fa-car text-gray-300 text-6xl mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Approved Vehicles</h2>
            <p className="text-gray-600 mb-6">
              You need at least one approved vehicle to post rides.
            </p>
            <Link
              to="/user/profile"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
            >
              <i className="fas fa-plus-circle mr-2"></i>Add Vehicle
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            <i className="fas fa-plus-circle mr-3"></i>Post a New Ride
          </h1>
          <p className="opacity-90">Share your journey and earn while helping others travel</p>
        </div>

        {/* Form Placeholder - Will be completed */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-route text-emerald-500 mr-2"></i>Route Details
              </h2>

              <div className="space-y-4">
                <LocationInput
                  label="Pick-up Location *"
                  placeholder="Enter starting location"
                  icon="fa-map-marker-alt"
                  iconColor="text-green-600"
                  value={formData.origin}
                  onChange={(loc) => setFormData(prev => ({ ...prev, origin: loc }))}
                  required
                />

                <LocationInput
                  label="Drop-off Location *"
                  placeholder="Enter destination"
                  icon="fa-map-marker-alt"
                  iconColor="text-red-600"
                  value={formData.destination}
                  onChange={(loc) => setFormData(prev => ({ ...prev, destination: loc }))}
                  required
                />

                {/* Stops */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    <i className="fas fa-map-signs text-emerald-500 mr-2"></i>
                    Stops Along the Way (Optional)
                  </label>
                  <div className="space-y-2">
                    {stops.map((stop, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <LocationInput
                            placeholder="Stop location"
                            icon="fa-map-marker"
                            value={stop.location}
                            onChange={(loc) => {
                              const newStops = [...stops];
                              newStops[index].location = loc;
                              setStops(newStops);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setStops(stops.filter((_, i) => i !== index))}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition h-fit mt-8"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStops([...stops, { location: null }])}
                    className="mt-2 text-emerald-500 hover:text-emerald-700 font-semibold text-sm"
                  >
                    <i className="fas fa-plus-circle mr-1"></i>Add Stop
                  </button>
                </div>
              </div>
            </div>

            {/* More sections coming... */}
            {/* Date & Time Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-calendar-alt text-emerald-500 mr-2"></i>Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Departure Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={today}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Departure Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle & Capacity */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-car text-emerald-500 mr-2"></i>Vehicle & Capacity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Select Vehicle *</label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Choose a vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.make} {v.model} ({v.color}) - {v.licensePlate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Available Seats *</label>
                  <select
                    name="availableSeats"
                    value={formData.availableSeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, availableSeats: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-rupee-sign text-emerald-500 mr-2"></i>Pricing
              </h2>

              {/* Predicted Price */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  <i className="fas fa-calculator mr-2"></i>Predicted Total Ride Price
                </p>
                <div className="text-3xl font-bold text-blue-700">
                  {predictedPrice ? (
                    <>₹{predictedPrice} <span className="text-sm font-normal">({distance} km × ₹8)</span></>
                  ) : (
                    'Select locations first'
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Based on distance × ₹8 per km (you can adjust below)
                </p>
              </div>

              {/* Total Ride Price Input */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2 text-lg">
                  <i className="fas fa-hand-holding-usd text-green-600 mr-2"></i>
                  Your Total Ride Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold text-xl">₹</span>
                  <input
                    type="number"
                    name="totalRidePrice"
                    value={formData.totalRidePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalRidePrice: e.target.value }))}
                    min="1"
                    placeholder="Enter total ride price"
                    required
                    className="w-full pl-12 pr-4 py-4 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 text-2xl font-bold text-green-700"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  💰 Enter the total price for the entire ride (will be divided among passengers)
                </p>
              </div>

              {/* Price Per Seat Display */}
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Price per Seat (Auto-calculated)</p>
                    <p className="text-xs text-green-600">Total price ÷ Available seats</p>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {pricePerSeat ? `₹${pricePerSeat}` : '₹ -'}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                <i className="fas fa-sliders-h text-emerald-500 mr-2"></i>Preferences
              </h2>

              <div className="space-y-4">
                {/* Instant Booking */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      <i className="fas fa-bolt text-blue-600 mr-1"></i>Auto-Approve Bookings
                    </h4>
                    <p className="text-sm text-gray-600">Passengers can book without waiting for approval</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.instantBooking}
                      onChange={(e) => setFormData(prev => ({ ...prev, instantBooking: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Ladies Only */}
                {user?.gender === 'FEMALE' && (
                  <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        <i className="fas fa-female text-pink-600 mr-1"></i>Ladies Only
                      </h4>
                      <p className="text-sm text-gray-600">Only female passengers can book this ride</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ladiesOnly}
                        onChange={(e) => setFormData(prev => ({ ...prev, ladiesOnly: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Any special instructions for passengers..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                to="/user/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </Link>
              <Button type="submit" loading={submitting}>
                <i className="fas fa-paper-plane mr-2"></i>Post Ride
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostRide;

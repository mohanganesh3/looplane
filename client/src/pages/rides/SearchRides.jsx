import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Alert, Card, Badge, LoadingSpinner } from '../../components/common';
import LocationInput from '../../components/common/LocationInput';
import rideService from '../../services/rideService';
import { getRating, formatRating } from '../../utils/helpers';
import { setSearchResults, setFilters, clearSearchResults } from '../../redux/slices/ridesSlice';
import { setGlobalLoading } from '../../redux/slices/uiSlice';

const SearchRides = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get cached search results from Redux (for back navigation)
  const cachedResults = useSelector((state) => state.rides.searchResults);
  const cachedFilters = useSelector((state) => state.rides.filters);
  
  const [searchParams, setSearchParams] = useState({
    origin: cachedFilters?.origin || null,
    destination: cachedFilters?.destination || null,
    date: cachedFilters?.date || '',
    seats: cachedFilters?.seats || 1
  });
  const [results, setResults] = useState(cachedResults || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(cachedResults?.length > 0);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    if (!searchParams.origin || !searchParams.destination) {
      setError('Please select valid locations from the dropdown');
      return;
    }

    setLoading(true);
    setSearched(true);
    dispatch(setGlobalLoading(true));
    
    // Store search filters in Redux
    dispatch(setFilters(searchParams));

    try {
      const data = await rideService.searchRides(searchParams);
      const searchResults = data.rides || [];
      setResults(searchResults);
      
      // Store results in Redux for caching
      dispatch(setSearchResults(searchResults));
    } catch (err) {
      setError(err.message || 'Failed to search rides');
      setResults([]);
      dispatch(clearSearchResults());
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            <i className="fas fa-search text-emerald-500 mr-3"></i>
            Find Your Perfect Ride
          </h1>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* From Location */}
              <LocationInput
                label="From"
                placeholder="Enter pickup location"
                icon="fa-map-marker-alt"
                iconColor="text-green-600"
                value={searchParams.origin}
                onChange={(location) => setSearchParams(prev => ({ ...prev, origin: location }))}
                required
              />

              {/* To Location */}
              <LocationInput
                label="To"
                placeholder="Enter destination"
                icon="fa-map-marker-alt"
                iconColor="text-red-600"
                value={searchParams.destination}
                onChange={(location) => setSearchParams(prev => ({ ...prev, destination: location }))}
                required
              />

              {/* Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <i className="fas fa-calendar text-emerald-500 mr-2"></i>Date
                </label>
                <input
                  type="date"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, date: e.target.value }))}
                  min={today}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <i className="fas fa-users text-emerald-500 mr-2"></i>Passengers
                </label>
                <select
                  value={searchParams.seats}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="1">1 Passenger</option>
                  <option value="2">2 Passengers</option>
                  <option value="3">3 Passengers</option>
                  <option value="4">4 Passengers</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button type="submit" loading={loading} className="px-8">
                <i className="fas fa-search mr-2"></i>
                Search Rides
              </Button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {loading ? (
          <LoadingSpinner size="lg" text="Searching for rides..." className="py-12" />
        ) : searched ? (
          results.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <i className="fas fa-car-side text-gray-300 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No rides found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or check back later
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Found <span className="font-semibold">{results.length}</span> ride(s)
              </p>
              {results.map((result) => {
                // Handle both formats: result with nested ride or direct ride object
                const ride = result.ride || result;
                const rideId = ride._id;
                const riderName = result.riderDisplayName || ride.rider?.name || ride.rider?.profile?.firstName || 'Driver';
                const pricePerSeat = ride.pricing?.pricePerSeat || ride.pricePerSeat || 0;
                const availableSeats = ride.pricing?.availableSeats || ride.availableSeats || 0;
                const departureTime = ride.schedule?.departureDateTime || ride.departureTime;
                const originCity = ride.route?.start?.address || ride.origin?.city || 'Origin';
                const destCity = ride.route?.destination?.address || ride.destination?.city || 'Destination';
                const riderRating = getRating(ride.rider?.rating);
                const handleViewDetails = (e) => {
                  e.stopPropagation(); // Prevent card click
                  // Pass the searched pickup/dropoff locations to the ride details page
                  navigate(`/rides/${rideId}`, {
                    state: {
                      searchedPickup: searchParams.origin,
                      searchedDropoff: searchParams.destination,
                      searchedSeats: searchParams.seats
                    }
                  });
                };
                
                return (
                <Card key={rideId} hover className="cursor-pointer" onClick={handleViewDetails}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      {/* Route */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div>
                          <div className="text-lg font-bold text-gray-800">
                            {originCity.split(',')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(departureTime)}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center px-4">
                          <div className="flex-1 h-0.5 bg-gray-300"></div>
                          <i className="fas fa-car text-emerald-500 mx-2"></i>
                          <div className="flex-1 h-0.5 bg-gray-300"></div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {destCity.split(',')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.matchQuality || '~'}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {formatDate(departureTime)}
                        </span>
                        <span>
                          <i className="fas fa-user-circle mr-1"></i>
                          {riderName}
                        </span>
                        <span>
                          <i className="fas fa-chair mr-1"></i>
                          {availableSeats} seat(s) left
                        </span>
                        {riderRating > 0 && (
                          <span className="flex items-center">
                            <i className="fas fa-star text-yellow-400 mr-1"></i>
                            {riderRating.toFixed(1)}
                          </span>
                        )}
                        {result.carbonSaved > 0 && (
                          <span className="flex items-center text-green-600">
                            <i className="fas fa-leaf mr-1"></i>
                            {result.carbonSaved.toFixed(1)} kg CO₂
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end">
                      <div className="text-2xl font-bold text-emerald-500 mb-2">
                        ₹{pricePerSeat}
                        <span className="text-sm text-gray-500 font-normal">/seat</span>
                      </div>
                      <Button variant="primary" size="sm" onClick={handleViewDetails}>
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Match Quality Badge */}
                  {result.matchQuality && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      <Badge variant={result.matchQuality === 'EXCELLENT' || result.matchQuality === 'Excellent' ? 'success' : result.matchQuality === 'GOOD' || result.matchQuality === 'Good' ? 'info' : 'default'} size="sm">
                        {result.matchQuality} Match
                      </Badge>
                      {result.distance && (
                        <Badge variant="default" size="sm">
                          {result.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              );
              })}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default SearchRides;

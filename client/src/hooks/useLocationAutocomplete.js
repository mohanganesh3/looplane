import { useState, useEffect, useCallback } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const useLocationAutocomplete = (initialValue = '') => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LANE-Carpool-App'
          }
        }
      );
      const results = await response.json();
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query && !selectedLocation) {
        fetchSuggestions(query);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, fetchSuggestions, selectedLocation]);

  const selectLocation = (location) => {
    const shortName = getShortName(location);
    setQuery(location.display_name);
    setSelectedLocation({
      type: 'Point',
      coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
      address: location.display_name,
      city: shortName
    });
    setSuggestions([]);
  };

  const clearSelection = () => {
    setQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
  };

  const getShortName = (result) => {
    if (result.address) {
      return result.address.city ||
        result.address.town ||
        result.address.village ||
        result.address.state_district ||
        result.address.state ||
        result.name;
    }
    return result.name || result.display_name.split(',')[0];
  };

  const getLocationIcon = (type) => {
    const iconMap = {
      'city': 'fa-city',
      'town': 'fa-building',
      'village': 'fa-home',
      'state': 'fa-map',
      'administrative': 'fa-map-marked-alt',
      'road': 'fa-road',
      'railway': 'fa-train',
      'airport': 'fa-plane'
    };
    return iconMap[type] || 'fa-map-marker-alt';
  };

  return {
    query,
    setQuery,
    suggestions,
    loading,
    selectedLocation,
    selectLocation,
    clearSelection,
    getShortName,
    getLocationIcon
  };
};

export default useLocationAutocomplete;

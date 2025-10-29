import { useState } from 'react';

const SearchFilters = ({ filters, onFilterChange, onApply, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:hidden flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-gray-900">Filters</span>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Content */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block p-4 space-y-6`}>
        <h3 className="font-semibold text-gray-900 text-lg hidden md:block">Filter Rides</h3>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
          <div className="space-y-2">
            {['Morning (6AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-9PM)', 'Night (9PM-6AM)'].map((time, idx) => (
              <label key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.timeSlots?.includes(time.split(' ')[0].toLowerCase())}
                  onChange={(e) => {
                    const slot = time.split(' ')[0].toLowerCase();
                    const current = filters.timeSlots || [];
                    if (e.target.checked) {
                      onFilterChange('timeSlots', [...current, slot]);
                    } else {
                      onFilterChange('timeSlots', current.filter(t => t !== slot));
                    }
                  }}
                  className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">{time}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;

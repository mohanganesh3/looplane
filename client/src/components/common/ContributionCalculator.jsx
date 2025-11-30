import { useState, useEffect } from 'react';
import userService from '../../services/userService';

/**
 * Contribution Calculator Component
 * BlaBlaCar-style suggested price calculator for cost sharing
 * Now with interactive price slider!
 */
const ContributionCalculator = ({ 
  distanceKm = 0, 
  passengers = 1,
  onPriceCalculated = null,
  showBreakdown = true,
  showPassengerSelector = false,
  allowSlider = true,
  initialPrice = null
}) => {
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPassengers, setCustomPassengers] = useState(passengers);
  const [sliderValue, setSliderValue] = useState(null);
  const [userAdjustedSlider, setUserAdjustedSlider] = useState(false);

  // Update customPassengers when prop changes
  useEffect(() => {
    setCustomPassengers(passengers);
  }, [passengers]);

  // Reset slider when distance changes (user added/removed stop)
  useEffect(() => {
    // When distance prop changes, reset to auto-calculate mode
    setUserAdjustedSlider(false);
    setSliderValue(null);
    console.log('📍 Distance changed to:', distanceKm, '- resetting price');
  }, [distanceKm]);

  // Calculate contribution when distance or passengers change
  useEffect(() => {
    if (distanceKm > 0) {
      calculateContribution();
    }
  }, [distanceKm, customPassengers]);

  // Update slider to suggested price when calculation is ready (and user hasn't manually adjusted)
  useEffect(() => {
    if (calculation?.suggestedPrice && !userAdjustedSlider) {
      const newPrice = calculation.suggestedPrice;
      console.log('💰 Setting price to suggested:', newPrice, 'for distance:', distanceKm);
      setSliderValue(newPrice);
      if (onPriceCalculated) {
        onPriceCalculated(newPrice);
      }
    }
  }, [calculation?.suggestedPrice]);

  // Notify parent when slider value changes manually
  useEffect(() => {
    if (sliderValue !== null && onPriceCalculated) {
      onPriceCalculated(sliderValue);
    }
  }, [sliderValue]);

  const calculateContribution = async () => {
    if (distanceKm <= 0) return;
    
    setLoading(true);
    try {
      const response = await userService.getContributionCalculator(distanceKm, customPassengers);
      if (response.success) {
        setCalculation(response.calculation);
      }
    } catch (error) {
      console.error('Failed to calculate contribution:', error);
      // Fallback calculation - Fair BlaBlaCar model
      // ₹8/km running cost (Petrol ₹105/15km + ₹1 maintenance)
      const RUNNING_COST_PER_KM = 8;
      const totalTripCost = distanceKm * RUNNING_COST_PER_KM;
      const suggestedPrice = Math.round(totalTripCost / (customPassengers + 1));
      const fallback = {
        distanceKm,
        passengers: customPassengers,
        runningCostPerKm: RUNNING_COST_PER_KM,
        fuelCostPerKm: 7,
        maintenancePerKm: 1,
        fuelCost: Math.round(distanceKm * 7),
        maintenanceCost: Math.round(distanceKm * 1),
        totalTripCost: totalTripCost,
        suggestedPrice: suggestedPrice,
        priceRange: {
          min: Math.round(suggestedPrice * 0.7),  // 70% of suggested
          max: Math.round(suggestedPrice * 1.4)   // 140% of suggested
        },
        carbonSaved: (distanceKm * 0.12 * customPassengers).toFixed(2)
      };
      setCalculation(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    setUserAdjustedSlider(true); // User manually adjusted, don't auto-reset until distance changes
  };

  if (!distanceKm) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
        <i className="fas fa-calculator text-2xl"></i>
        <p className="mt-2 text-sm">Enter distance to calculate contribution</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
    );
  }

  if (!calculation) return null;

  const { 
    suggestedPrice, 
    priceRange, 
    totalTripCost,
    fuelCost,
    maintenanceCost,
    runningCostPerKm,
    fuelCostPerKm, 
    maintenancePerKm,
    carbonSaved
  } = calculation;

  const minPrice = priceRange?.min || Math.round(suggestedPrice * 0.8);
  const maxPrice = priceRange?.max || Math.round(suggestedPrice * 1.3);
  const currentPrice = sliderValue || suggestedPrice;

  // Calculate slider percentage for gradient
  const sliderPercent = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-800 flex items-center">
          <i className="fas fa-coins text-xl mr-2 text-yellow-500"></i>
          Suggested Contribution
        </h4>
      </div>

      {/* Main Price Display */}
      <div className="text-center mb-4">
        <p className="text-4xl font-bold text-green-600">
          ₹{currentPrice}
          <span className="text-lg text-gray-500 font-normal">/seat</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Fair price based on {distanceKm.toFixed(1)} km journey
        </p>
      </div>

      {/* Interactive Price Slider */}
      {allowSlider && (
        <div className="mb-4 px-2">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Min ₹{minPrice}</span>
            <span className="font-medium text-green-600">Suggested</span>
            <span>Max ₹{maxPrice}</span>
          </div>
          
          {/* Custom Slider */}
          <div className="relative">
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={currentPrice}
              onChange={handleSliderChange}
              className="w-full h-3 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${sliderPercent}%, #e5e7eb ${sliderPercent}%, #e5e7eb 100%)`
              }}
            />
            
            {/* Suggested price marker */}
            <div 
              className="absolute -top-1 w-1 h-5 bg-green-600 rounded-full pointer-events-none"
              style={{ 
                left: `${((suggestedPrice - minPrice) / (maxPrice - minPrice)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />
          </div>
          
          {/* Price indicator labels */}
          <div className="flex justify-between mt-2">
            <span className={`text-xs px-2 py-1 rounded ${currentPrice <= minPrice + 10 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
              Budget
            </span>
            <span className={`text-xs px-2 py-1 rounded ${Math.abs(currentPrice - suggestedPrice) <= 5 ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-400'}`}>
              Fair
            </span>
            <span className={`text-xs px-2 py-1 rounded ${currentPrice >= maxPrice - 10 ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
              Premium
            </span>
          </div>
        </div>
      )}

      {/* Passengers Selector - only show if enabled */}
      {showPassengerSelector && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-2 block">Number of Passengers</label>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setCustomPassengers(Math.max(1, customPassengers - 1))}
              className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              disabled={customPassengers <= 1}
            >
              <span className="text-xl">-</span>
            </button>
            <span className="text-2xl font-bold text-gray-800 w-16 text-center">
              {customPassengers} <i className="fas fa-user text-lg"></i>
            </span>
            <button
              onClick={() => setCustomPassengers(Math.min(6, customPassengers + 1))}
              className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              disabled={customPassengers >= 6}
            >
              <span className="text-xl">+</span>
            </button>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {showBreakdown && (
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h5 className="font-semibold text-gray-700 text-sm mb-2">Cost Breakdown</h5>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500"><i className="fas fa-gas-pump mr-1"></i> Fuel Cost (₹{fuelCostPerKm || 7}/km)</span>
            <span className="font-medium">₹{fuelCost || Math.round(distanceKm * 7)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500"><i className="fas fa-tools mr-1"></i> Maintenance (₹{maintenancePerKm || 1}/km)</span>
            <span className="font-medium">₹{maintenanceCost || Math.round(distanceKm * 1)}</span>
          </div>
          
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-600 font-medium"><i className="fas fa-road mr-1"></i> Total Trip Cost (₹{runningCostPerKm || 8}/km)</span>
            <span className="font-semibold">₹{totalTripCost || Math.round(distanceKm * 8)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500"><i className="fas fa-users mr-1"></i> Split between ({customPassengers + 1} people)</span>
            <span className="font-medium text-green-600">÷ {customPassengers + 1}</span>
          </div>
          
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-gray-700">Per Seat Contribution</span>
            <span className="font-bold text-green-600">₹{currentPrice}</span>
          </div>
        </div>
      )}

      {/* Carbon Savings */}
      <div className="mt-4 flex items-center justify-center bg-green-100 rounded-lg p-3">
        <i className="fas fa-seedling text-2xl text-green-500 mr-2"></i>
        <div>
          <p className="text-sm font-medium text-green-800">
            Saving {carbonSaved || (distanceKm * 0.12 * customPassengers).toFixed(1)} kg CO₂
          </p>
          <p className="text-xs text-green-600">by sharing this ride!</p>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-xs text-gray-400 text-center mt-3">
        <i className="fas fa-lightbulb mr-1"></i> This is a cost-sharing model, not a commercial fare. 
        Drivers should only recover their costs.
      </p>
    </div>
  );
};

export default ContributionCalculator;

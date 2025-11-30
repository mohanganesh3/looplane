import { useState, useEffect } from 'react';
import userService from '../../services/userService';

/**
 * Trust Score Display Component
 * Shows user's trust score with visual indicator (like BlaBlaCar)
 */
const TrustScore = ({ userId = null, compact = false }) => {
  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustScore();
  }, [userId]);

  const loadTrustScore = async () => {
    try {
      const response = await userService.getTrustScore(userId);
      if (response.success) {
        setTrustData(response.trustScore);
      }
    } catch (error) {
      console.error('Failed to load trust score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!trustData) return null;

  const { level, score, factors, levelInfo } = trustData;

  // Level colors
  const levelColors = {
    NEWCOMER: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', ring: 'ring-gray-200' },
    REGULAR: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300', ring: 'ring-blue-200' },
    EXPERIENCED: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300', ring: 'ring-green-200' },
    AMBASSADOR: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300', ring: 'ring-yellow-200' },
    EXPERT: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300', ring: 'ring-purple-200' }
  };

  const colors = levelColors[level] || levelColors.NEWCOMER;

  // Level icons - using Font Awesome classes
  const levelIcons = {
    NEWCOMER: 'fa-seedling',
    REGULAR: 'fa-star',
    EXPERIENCED: 'fa-certificate',
    AMBASSADOR: 'fa-trophy',
    EXPERT: 'fa-crown'
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full ${colors.bg} ${colors.text} text-xs font-medium`}>
        <i className={`fas ${levelIcons[level]} mr-1`}></i>
        <span>{levelInfo?.label || level}</span>
        <span className="ml-1 font-bold">{score}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Trust Score</h3>
        <div className={`flex items-center px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          <i className={`fas ${levelIcons[level]} text-xl mr-2`}></i>
          <span className="font-bold">{levelInfo?.label || level}</span>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-6">
        <div className={`relative w-32 h-32 rounded-full ${colors.bg} flex items-center justify-center ring-4 ${colors.ring}`}>
          <div className="text-center">
            <span className={`text-4xl font-bold ${colors.text}`}>{score}</span>
            <p className="text-xs text-gray-500">/100</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Score Breakdown</h4>
        
        {[
          { label: 'Profile Complete', value: factors.profileComplete, max: 20, iconClass: 'fa-user' },
          { label: 'Verification', value: factors.verificationBonus, max: 20, iconClass: 'fa-check-circle' },
          { label: 'Rating', value: factors.ratingBonus, max: 20, iconClass: 'fa-star' },
          { label: 'Experience', value: factors.experienceBonus, max: 20, iconClass: 'fa-car' },
          { label: 'Reliability', value: factors.reliabilityBonus, max: 20, iconClass: 'fa-gem' }
        ].map((factor, idx) => (
          <div key={idx} className="flex items-center">
            <i className={`fas ${factor.iconClass} w-6 text-center text-gray-500`}></i>
            <span className="flex-1 text-sm text-gray-600 ml-2">{factor.label}</span>
            <div className="w-24 bg-gray-200 rounded-full h-2 mx-2">
              <div 
                className={`h-2 rounded-full ${factor.value >= factor.max * 0.8 ? 'bg-green-500' : factor.value >= factor.max * 0.5 ? 'bg-yellow-500' : 'bg-gray-400'}`}
                style={{ width: `${(factor.value / factor.max) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-800 w-12 text-right">
              {Math.round(factor.value)}/{factor.max}
            </span>
          </div>
        ))}
      </div>

      {/* Tips to improve */}
      {score < 80 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <i className="fas fa-lightbulb mr-1"></i> <strong>Tip:</strong> {
              factors.profileComplete < 15 ? 'Complete your profile to boost your score!' :
              factors.verificationBonus < 15 ? 'Verify your documents to earn more trust!' :
              factors.ratingBonus < 15 ? 'Get more positive reviews from your trips!' :
              factors.experienceBonus < 15 ? 'Complete more rides to gain experience!' :
              'Keep up the reliable service to maintain your score!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TrustScore;

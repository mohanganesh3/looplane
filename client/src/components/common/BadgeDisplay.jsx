import { useState, useEffect } from 'react';
import userService from '../../services/userService';

/**
 * Badge Display Component
 * Shows user's earned badges and verification status (like BlaBlaCar/Uber)
 */
const BadgeDisplay = ({ userId = null, showAll = true }) => {
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      const response = await userService.getBadges(userId);
      if (response.success) {
        setBadgeData(response.badges);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (!badgeData) return null;

  const { earnedBadges, availableBadges, trustLevel, memberSince } = badgeData;

  // Badge configurations - use Font Awesome icon classes
  const badgeConfig = {
    EMAIL_VERIFIED: { iconClass: 'fa-envelope', label: 'Email Verified', color: 'bg-blue-100 text-blue-700' },
    PHONE_VERIFIED: { iconClass: 'fa-mobile-alt', label: 'Phone Verified', color: 'bg-green-100 text-green-700' },
    ID_VERIFIED: { iconClass: 'fa-id-card', label: 'ID Verified', color: 'bg-purple-100 text-purple-700' },
    LICENSE_VERIFIED: { iconClass: 'fa-car', label: 'License Verified', color: 'bg-yellow-100 text-yellow-700' },
    PROFILE_COMPLETE: { iconClass: 'fa-user-check', label: 'Profile Complete', color: 'bg-indigo-100 text-indigo-700' },
    FIRST_RIDE: { iconClass: 'fa-flag-checkered', label: 'First Ride', color: 'bg-pink-100 text-pink-700' },
    FIVE_STAR_DRIVER: { iconClass: 'fa-star', label: '5-Star Driver', color: 'bg-amber-100 text-amber-700' },
    FREQUENT_RIDER: { iconClass: 'fa-fire', label: 'Frequent Rider', color: 'bg-orange-100 text-orange-700' },
    ECO_WARRIOR: { iconClass: 'fa-seedling', label: 'Eco Warrior', color: 'bg-emerald-100 text-emerald-700' },
    SUPER_HOST: { iconClass: 'fa-trophy', label: 'Super Host', color: 'bg-yellow-100 text-yellow-700' },
    EARLY_ADOPTER: { iconClass: 'fa-rocket', label: 'Early Adopter', color: 'bg-cyan-100 text-cyan-700' },
    COMMUNITY_HELPER: { iconClass: 'fa-hands-helping', label: 'Community Helper', color: 'bg-rose-100 text-rose-700' }
  };

  // Trust level configurations
  const trustConfig = {
    NEWCOMER: { iconClass: 'fa-seedling', label: 'Newcomer', color: 'bg-gray-100 text-gray-700', desc: 'Just getting started' },
    REGULAR: { iconClass: 'fa-star', label: 'Regular', color: 'bg-blue-100 text-blue-700', desc: 'Active community member' },
    EXPERIENCED: { iconClass: 'fa-certificate', label: 'Experienced', color: 'bg-green-100 text-green-700', desc: 'Trusted by the community' },
    AMBASSADOR: { iconClass: 'fa-trophy', label: 'Ambassador', color: 'bg-yellow-100 text-yellow-700', desc: 'Top contributor' },
    EXPERT: { iconClass: 'fa-crown', label: 'Expert', color: 'bg-purple-100 text-purple-700', desc: 'Elite member' }
  };

  const trustInfo = trustConfig[trustLevel] || trustConfig.NEWCOMER;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Trust Level Badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Trust & Badges</h3>
          <p className="text-sm text-gray-500">Member since {memberSince}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${trustInfo.color}`}>
          <div className="flex items-center">
            <i className={`fas ${trustInfo.iconClass} text-2xl mr-2`}></i>
            <div>
              <p className="font-bold">{trustInfo.label}</p>
              <p className="text-xs opacity-75">{trustInfo.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
          <i className="fas fa-medal mr-2"></i> Earned Badges ({earnedBadges.length})
        </h4>
        
        {earnedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge, idx) => {
              const config = badgeConfig[badge] || { iconClass: 'fa-medal', label: badge, color: 'bg-gray-100 text-gray-700' };
              return (
                <div 
                  key={idx}
                  className={`inline-flex items-center px-3 py-2 rounded-full ${config.color} text-sm font-medium`}
                  title={config.label}
                >
                  <i className={`fas ${config.iconClass} mr-1.5`}></i>
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No badges earned yet. Complete verifications and rides to earn badges!</p>
        )}
      </div>

      {/* Available Badges (to earn) */}
      {showAll && availableBadges && availableBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
            <i className="fas fa-bullseye mr-2"></i> Badges to Earn
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableBadges.slice(0, 6).map((badge, idx) => {
              const config = badgeConfig[badge] || { iconClass: 'fa-medal', label: badge, color: 'bg-gray-100 text-gray-700' };
              return (
                <div 
                  key={idx}
                  className="inline-flex items-center px-3 py-2 rounded-full bg-gray-100 text-gray-400 text-sm font-medium opacity-60"
                  title={`Earn: ${config.label}`}
                >
                  <i className={`fas ${config.iconClass} mr-1.5 grayscale`}></i>
                  <span>{config.label}</span>
                  <i className="fas fa-lock ml-1"></i>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600">{earnedBadges.length}</p>
          <p className="text-xs text-gray-500">Badges Earned</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">
            {earnedBadges.filter(b => b.includes('VERIFIED')).length}
          </p>
          <p className="text-xs text-gray-500">Verifications</p>
        </div>
        <div>
          <i className={`fas ${trustInfo.iconClass} text-2xl text-purple-600`}></i>
          <p className="text-xs text-gray-500">{trustInfo.label}</p>
        </div>
      </div>
    </div>
  );
};

export default BadgeDisplay;

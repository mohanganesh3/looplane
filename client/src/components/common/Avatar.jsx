import { useState } from 'react';

/**
 * Avatar component with proper fallback handling
 * Displays user photo or initials if image fails to load
 */
const Avatar = ({ 
  src, 
  name = 'User', 
  size = 'md', 
  className = '',
  showOnlineStatus = false,
  isOnline = false,
  verified = false
}) => {
  const [imgError, setImgError] = useState(false);

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  const onlineIndicatorSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
    '3xl': 'w-5 h-5'
  };

  // Get initials from name
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color from name
  const getBackgroundColor = (name) => {
    const colors = [
      'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-rose-500', 'bg-amber-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const hasValidSrc = src && !imgError && src !== '/images/default-avatar.png' && src !== '';

  return (
    <div className={`relative inline-flex ${className}`}>
      {hasValidSrc ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div 
          className={`${sizeClasses[size]} ${getBackgroundColor(name)} rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Online Status Indicator */}
      {showOnlineStatus && (
        <span 
          className={`absolute bottom-0 right-0 ${onlineIndicatorSize[size]} rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}

      {/* Verified Badge */}
      {verified && (
        <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  );
};

export default Avatar;

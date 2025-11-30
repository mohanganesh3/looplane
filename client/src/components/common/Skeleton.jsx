const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  count = 1,
  circle = false,
  animation = true
}) => {
  const baseClasses = `
    bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 
    bg-[length:200%_100%]
    ${animation ? 'animate-shimmer' : ''}
    rounded
  `;

  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded',
    avatar: 'w-12 h-12 rounded-full',
    thumbnail: 'w-20 h-20 rounded-lg',
    card: 'w-full h-48 rounded-xl',
    button: 'w-24 h-10 rounded-lg',
    input: 'w-full h-12 rounded-lg'
  };

  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  const getClasses = () => {
    if (circle) {
      return `${baseClasses} rounded-full`;
    }
    return `${baseClasses} ${variants[variant] || variants.text}`;
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div 
      key={i} 
      className={`${getClasses()} ${className} ${count > 1 && i < count - 1 ? 'mb-2' : ''}`}
      style={style}
      aria-hidden="true"
    />
  ));

  return count === 1 ? items[0] : <div>{items}</div>;
};

// Preset skeleton patterns
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
    <div className="flex items-center mb-4">
      <Skeleton variant="avatar" className="mr-3" />
      <div className="flex-1">
        <Skeleton variant="text" className="mb-2" width="60%" />
        <Skeleton variant="text" width="40%" height="12px" />
      </div>
    </div>
    <Skeleton variant="text" count={3} className="mb-2" />
    <div className="flex gap-2 mt-4">
      <Skeleton variant="button" />
      <Skeleton variant="button" />
    </div>
  </div>
);

export const SkeletonListItem = ({ className = '' }) => (
  <div className={`flex items-center p-4 bg-white rounded-lg ${className}`}>
    <Skeleton variant="avatar" className="mr-4" />
    <div className="flex-1">
      <Skeleton variant="text" className="mb-2" width="70%" />
      <Skeleton variant="text" width="50%" height="12px" />
    </div>
    <Skeleton variant="button" width="80px" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
    {/* Header */}
    <div className="flex gap-4 p-4 bg-gray-50 border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" className="flex-1" height="16px" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-b-0">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonProfile = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <div className="flex items-center mb-6">
      <Skeleton circle width="80px" height="80px" className="mr-4" />
      <div className="flex-1">
        <Skeleton variant="title" className="mb-2" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton variant="text" width="30%" height="12px" className="mb-2" />
          <Skeleton variant="input" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-md p-4">
        <Skeleton variant="text" width="60%" height="12px" className="mb-2" />
        <Skeleton variant="title" width="40%" />
      </div>
    ))}
  </div>
);

export default Skeleton;

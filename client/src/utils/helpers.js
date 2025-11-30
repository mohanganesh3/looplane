// Format date for display
export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format time for display
export function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

// Safely get numeric rating from user object (handles both object and number formats)
export function getRating(ratingData) {
  if (ratingData === null || ratingData === undefined) return 0;
  if (typeof ratingData === 'number') return ratingData;
  if (typeof ratingData === 'object' && ratingData.overall !== undefined) {
    return typeof ratingData.overall === 'number' ? ratingData.overall : 0;
  }
  return 0;
}

// Safely format rating to fixed decimal places
export function formatRating(ratingData, decimals = 1) {
  const rating = getRating(ratingData);
  return rating.toFixed(decimals);
}

// Safely get rating count
export function getRatingCount(ratingData, statistics) {
  if (ratingData && typeof ratingData === 'object' && ratingData.count !== undefined) {
    return ratingData.count;
  }
  if (statistics && statistics.totalRatings !== undefined) {
    return statistics.totalRatings;
  }
  return 0;
}

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './common';

/**
 * ProtectedRoute - Route guard for authenticated users
 * Redirects to login if user is not authenticated or suspended
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, logout, refreshUser } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  // Force refresh user data on mount to check for suspension
  useEffect(() => {
    const checkUserStatus = async () => {
      if (isAuthenticated) {
        try {
          const updatedUser = await refreshUser();
          if (updatedUser) {
            // Check if suspended after refresh
            if (updatedUser.accountStatus === 'SUSPENDED' || updatedUser.isSuspended) {
              alert(`Your account has been suspended. Reason: ${updatedUser.suspensionReason || 'Policy violation'}. Please check your email for details.`);
              await logout();
              return;
            }
            if (updatedUser.accountStatus === 'DELETED') {
              alert('This account has been deleted.');
              await logout();
              return;
            }
          }
        } catch (error) {
          // If refresh fails with 403, the API interceptor will handle logout
          console.log('User status check failed:', error.message);
        }
      }
      setChecking(false);
    };
    
    checkUserStatus();
  }, [location.pathname]); // Re-check on route change

  // Check if user account is suspended or deleted (from cached data)
  useEffect(() => {
    if (user) {
      if (user.accountStatus === 'SUSPENDED' || user.isSuspended) {
        alert(`Your account has been suspended. Reason: ${user.suspensionReason || 'Policy violation'}. Please check your email for details.`);
        logout();
      } else if (user.accountStatus === 'DELETED') {
        alert('This account has been deleted.');
        logout();
      }
    }
  }, [user, logout]);

  // Show loading spinner while checking auth status
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check account status - redirect if suspended or deleted
  if (user?.accountStatus === 'SUSPENDED' || user?.isSuspended || user?.accountStatus === 'DELETED') {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and account is active
  return children;
};

export default ProtectedRoute;

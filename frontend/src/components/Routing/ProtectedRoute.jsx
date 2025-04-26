import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return <div>Loading...</div>;
  }

  if (!user) {
    // User not logged in, redirect to login page
    // Pass the current location to redirect back after login (optional)
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // Optional: Role-based access check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User logged in but does not have the required role
      // Redirect to an unauthorized page or dashboard
      console.warn(`User role ${user.role} not authorized for this route.`);
      return <Navigate to="/dashboard" replace />; // Redirect to their default dashboard
  }

  // User is authenticated (and optionally authorized), render the child route content
  return <Outlet />;
};

export default ProtectedRoute;
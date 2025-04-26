import React from 'react';
import { useAuth } from '../context/AuthContext';
import CivilianDashboard from '../components/Dashboards/CivilianDashboard'; // Create this
import VolunteerDashboard from '../components/Dashboards/VolunteerDashboard'; // Create this
import AdminDashboard from '../components/Dashboards/AdminDashboard'; // Create this

function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    // Should be handled by ProtectedRoute, but good practice
    return <p>Please log in to view the dashboard.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="mb-4">Welcome, <span className="font-semibold">{user.name}</span>!</p>
      <p className="mb-6">Your Role: <span className="capitalize font-medium p-1 px-2 rounded bg-gray-200 text-gray-700 text-sm">{user.role}</span></p>

      {/* Render specific dashboard based on user role */}
      {user.role === 'civilian' && <CivilianDashboard />}
      {user.role === 'volunteer' && <VolunteerDashboard />}
      {user.role === 'admin' && <AdminDashboard />}

    </div>
  );
}

export default DashboardPage;
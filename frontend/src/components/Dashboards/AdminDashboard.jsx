import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import CrisisCard from '../Crisis/CrisisCard'; // Can reuse for display

// Dummy Data Fallback
const dummyCrises = [
     { id: 'admin_c1', type: 'Infrastructure Damage', severity: 4, address: 'City Bridge', status: 'new', date: new Date().toISOString(), time: '09:00' },
     { id: 'admin_c2', type: 'Fire', severity: 5, address: 'Downtown Warehouse', status: 'assigned', assignedVolunteer: 'vol123', date: new Date().toISOString(), time: '11:30' },
     { id: 'admin_c3', type: 'Flood', severity: 3, address: 'West Suburbs', status: 'resolved', date: new Date(Date.now() - 86400000).toISOString(), time: '14:00' },
];
const dummyUsers = [
    { _id: 'user1', name: 'Alice Civilian', email: 'alice@test.com', role: 'civilian', createdAt: new Date().toISOString() },
    { _id: 'vol123', name: 'Bob Volunteer', email: 'bob@test.com', role: 'volunteer', createdAt: new Date().toISOString() },
    { _id: 'admin0', name: 'Admin User', email: 'admin@test.com', role: 'admin', createdAt: new Date().toISOString() },
];

function AdminDashboard() {
  const [allCrises, setAllCrises] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalCrises: 0, activeVolunteers: 0, totalUsers: 0 }); // Placeholder stats
  const [loadingCrises, setLoadingCrises] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoadingCrises(true);
    setLoadingUsers(true);
    setError('');
    let crisisError = '';
    let userError = '';

    // Fetch All Crises (using the public feed for now, ideally an admin endpoint)
    try {
        const { data } = await api.get('/crises/feed'); // Or an admin-specific endpoint
         if (data) {
            // Map to consistent format if needed
            const ran=Math.floor(Math.random() * 495) 
             setAllCrises(data.slice(ran, ran+5).map(item => ({
                id: item._id ,
                latitude: parseFloat(item.location?.coordinates?.[1]),
                longitude: parseFloat(item.location?.coordinates?.[0]),
                address: item.location || 'Unknown Address',
                type: item.DisasterType || 'Unknown',
                severity: item.severityLevel || 1,
                userName: item.userName,
                post: item.post,
                date: item.date,
                time: item.time,
                status: item.status || 'new',
                assignedVolunteer: item.assignedVolunteer // Include if available
            })));

             setStats(prev => ({ ...prev, totalCrises: data.length }));
        } else {
             crisisError = "Unexpected crisis data format.";
             setAllCrises(dummyCrises); // Fallback
        }
    } catch (err) {
        console.error("Error fetching crises:", err);
        crisisError = 'Failed to load crises. Using sample data.';
        setAllCrises(dummyCrises); // Fallback
         setStats(prev => ({ ...prev, totalCrises: dummyCrises.length }));
    } finally {
        setLoadingCrises(false);
    }

    // Fetch All Users (Needs a dedicated admin endpoint)
    try {
        console.log("fetchData: Fetching users from /api/admin/users...");
        const { data } = await api.get('/users/all'); // TODO: Ensure this endpoint exists and returns an array of users

        // --- CHANGE 2: Use the actual 'data' from the API response ---
        if (data) { // Basic check that we received an array
            console.log(`fetchData: Received ${data.length} users from API.`);
            setUsers(data); // Set state with the real user data

            // --- CHANGE 3: Calculate stats based on real 'data' ---
            setStats(prev => ({ ...prev, totalUsers: data.length }));
            // Calculate active volunteers (adjust 'isAvailable' property if needed)
            setStats(prev => ({
                 ...prev,
                 activeVolunteers: data.filter(u => u.role === 'volunteer' /* && u.isAvailable */).length // Example filter - adapt as needed
            }));
            console.log("fetchData: Users state and stats updated from API data.");

        } else {
             // Handle cases where the API might not return an array directly
             console.error("fetchData: API response for users was not an array:", data);
             userError = 'Invalid user data format received from server.';
             setUsers(dummyUsers); // Fallback to dummy on format error
             // Update stats based on dummy data as before
             setStats(prev => ({ ...prev, totalUsers: dummyUsers.length }));
             setStats(prev => ({ ...prev, activeVolunteers: dummyUsers.filter(u => u.role === 'volunteer').length }));
        }
    } catch (err) {
        console.error("Error fetching users:", err);
        userError = 'Failed to load users. Using sample data.';
        setUsers(dummyUsers); // Fallback
         setStats(prev => ({ ...prev, totalUsers: dummyUsers.length }));
         setStats(prev => ({ ...prev, activeVolunteers: dummyUsers.filter(u => u.role === 'volunteer').length }));
    } finally {
        setLoadingUsers(false);
    }

     if(crisisError || userError) {
           setError(`${crisisError} ${userError}`.trim());
       }

  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Placeholder handlers for admin actions
    const handleVerifyCrisis = (crisisId) => {
        console.log(`TODO: Verify crisis ${crisisId}`);
        toast.info(`Verify action for crisis ${crisisId} not implemented.`);
    };
    const handleAssignVolunteer = (crisisId) => {
        console.log(`TODO: Assign volunteer to crisis ${crisisId}`);
        // This would likely open a modal to select a volunteer
        toast.info(`Assign action for crisis ${crisisId} not implemented.`);
    };
     const handleBanUser = (userId) => {
        console.log(`TODO: Ban user ${userId}`);
         toast.info(`Ban action for user ${userId} not implemented.`);
    };

    
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {/* System Stats */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded shadow">
            <h4 className="text-lg font-semibold text-blue-800">Total Crises</h4>
            <p className="text-2xl font-bold text-blue-900">{loadingCrises ? '...' : stats.totalCrises}</p>
        </div>
        <div className="p-4 bg-green-100 rounded shadow">
             <h4 className="text-lg font-semibold text-green-800">Active Volunteers</h4>
            <p className="text-2xl font-bold text-green-900">{loadingUsers ? '...' : stats.activeVolunteers}</p>
        </div>
         <div className="p-4 bg-indigo-100 rounded shadow">
             <h4 className="text-lg font-semibold text-indigo-800">Total Users</h4>
            <p className="text-2xl font-bold text-indigo-900">{loadingUsers ? '...' : stats.totalUsers}</p>
        </div>
      </section>

      {/* Crisis Management */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Manage Crises</h3>
        {loadingCrises ? <p>Loading crises...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCrises.map(crisis => (
                // Extend CrisisCard or use a specific AdminCrisisCard if needed
                <div key={crisis.id} className="border p-4 rounded bg-white shadow-sm">
                     <CrisisCard crisis={crisis} />
                     {/* Admin specific actions */}
                     <div className="mt-2 pt-2 border-t flex justify-end space-x-2">
                          {(crisis.status === 'new' || crisis.status === 'unverified') && (
                             <button onClick={() => handleVerifyCrisis(crisis.id)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">Verify</button>
                          )}
                          {(crisis.status === 'new' || crisis.status === 'verified') && !crisis.assignedVolunteer && (
                             <button onClick={() => handleAssignVolunteer(crisis.id)} className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded">Assign</button>
                          )}
                          {/* Add Close/Resolve action etc. */}
                     </div>
                </div>
            ))}
          </div>
        )}
      </section>

      {/* User Management */}
      <section>
        <h3 className="text-xl font-semibold mb-3">Manage Users</h3>
         {loadingUsers ? <p>Loading users...</p> : (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-4 py-2 text-left">Name</th>
                            <th className="border px-4 py-2 text-left">Email</th>
                            <th className="border px-4 py-2 text-left">Role</th>
                             <th className="border px-4 py-2 text-left">Joined</th>
                            <th className="border px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50">
                                <td className="border px-4 py-2">{u.name}</td>
                                <td className="border px-4 py-2">{u.email}</td>
                                <td className="border px-4 py-2 capitalize">{u.role}</td>
                                <td className="border px-4 py-2 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">
                                    <button className="text-xs text-blue-600 hover:underline mr-2">View</button>
                                    <button onClick={() => handleBanUser(u._id)} className="text-xs text-red-600 hover:underline">Ban</button>
                                    {/* Add more actions: Make Admin, View Activity etc. */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </section>

    </div>
  );
}

export default AdminDashboard;
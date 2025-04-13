// src/pages/AllCrisesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import CrisisCard from '../components/Crisis/CrisisCard'; // Re-use the card component
import { useAuth } from '../context/AuthContext'; // To potentially show user-specific actions

// Dummy data for fallback
const dummyCrises = [
    { id: 'dummy1', type: 'Flood', severity: 4, latitude: 21.1458, longitude: 79.0882, address: 'Nagpur Area', date: new Date().toISOString(), time: '10:00', post: 'Heavy flooding reported near main road.', status: 'new' },
    { id: 'dummy2', type: 'Fire', severity: 5, latitude: 19.0760, longitude: 72.8777, address: 'Mumbai Suburb', date: new Date(Date.now() - 86400000).toISOString(), time: '15:30', post: 'Building fire, urgent help needed.', status: 'assigned', assignedVolunteer: 'vol123' },
    { id: 'dummy3', type: 'Power Outage', severity: 3, latitude: 28.7041, longitude: 77.1025, address: 'Delhi Sector 9', date: new Date(Date.now() - 172800000).toISOString(), time: '08:00', post: 'Extended power outage affecting multiple blocks.', status: 'new' },
    { id: 'dummy4', type: 'Medical Emergency', severity: 4, latitude: 12.9716, longitude: 77.5946, address: 'Bangalore Central', date: new Date().toISOString(), time: '11:15', post: 'Accident reported, requires ambulance.', status: 'resolved' },
     { id: 'dummy5', type: 'Gas Leak', severity: 5, latitude: 22.5726, longitude: 88.3639, address: 'Kolkata Industrial Area', date: new Date().toISOString(), time: '14:00', post: 'Strong smell of gas reported, potential leak.', status: 'new' },
];


function AllCrisesPage() {
  const { user } = useAuth(); // Get user info for potential actions
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add state for filters/pagination if needed later
  // const [filters, setFilters] = useState({ type: '', severity: '', status: ''});
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);

  const fetchCrises = useCallback(async (/* page = 1, currentFilters = {} */) => {
    setLoading(true);
    setError('');
    try {
      // TODO: Update endpoint if backend supports pagination/filtering
      // Example: const { data } = await api.get('/crises', { params: { page, limit: 10, ...currentFilters } });
      const { data } = await api.get('/crises/feed'); // Using the feed endpoint for now

      if (data.length!==0) {
          // TODO: If using pagination, update totalPages: setTotalPages(data.totalPages);
          // Map data to consistent format for CrisisCard
        //   console.log(data)
          const formattedCrises = data.map(item => ({
                id: item.id || item._id || `crisis-${Math.random()}`, // Ensure unique ID
                latitude: parseFloat(item.location?.coordinates?.[1]),
                longitude: parseFloat(item.location?.coordinates?.[0]),
                address: item.location || 'Unknown Address',
                type: item.DisasterType || 'Unknown Type',
                severity: item.severityLevel || 1,
                userName: item.userName,
                post: item.post,
                date: item.date,
                time: item.time,
                status: item.status || 'new',
                assignedVolunteer: item.assignedVolunteer,
                mediaAttached: item.mediaAttached,
                keywords: item.keywords,
                 originalId: item.originalId,
                 createdAt: item.createdAt,
                // Add any other fields needed by CrisisCard or for logic
            })); // Basic filter for valid location
            setCrises(formattedCrises);

      } else {
        console.error("Received non-array data from crisis feed:", data);
        setError("Unexpected data format received. Displaying sample data.");
        setCrises(dummyCrises); // Fallback to dummy data
      }
    } catch (err) {
      console.error("Error fetching crises:", err);
      setError('Failed to load crises. Displaying sample data.');
      setCrises(dummyCrises); // Use dummy data on error
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies like currentPage, filters if implemented

  useEffect(() => {
    fetchCrises();
    // fetchCrises(currentPage, filters); // If using pagination/filters
  }, [fetchCrises]); // Re-run if fetchCrises changes (e.g., due to filter/page changes)

  // --- Action Handlers (Example: Request Help) ---
  // Adapt from CivilianDashboard if needed
  const handleRequestHelp = async (crisisId) => {
    console.log(`Requesting help for crisis: ${crisisId}`);
    if (!user) {
        toast.error("Please log in to request help.");
        return;
    }
    if (user.role !== 'civilian') {
        toast.info("Only civilians can request help directly through this button.");
        return;
    }
    try {
        const response = await api.post(`/crises/${crisisId}/request-help`);
        toast.success(response.data.message || "Help request sent successfully! Volunteers notified.");
        // Optionally refresh data or update specific crisis status locally
        // fetchCrises();
    } catch (err) {
        console.error("Error requesting help:", err);
        toast.error(err.response?.data?.message || "Failed to send help request.");
    }
  };

  // --- Render Logic ---
  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-8">All Reported Crises</h1>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center">{error}</p>}

      {/* TODO: Add Filtering/Sorting Controls Here */}
       {/* <div className="mb-6 p-4 bg-gray-100 rounded-lg flex flex-wrap gap-4">
           <input type="text" placeholder="Filter by type..." className="px-2 py-1 border rounded"/>
           <select className="px-2 py-1 border rounded"><option value="">Severity</option></select>
           <select className="px-2 py-1 border rounded"><option value="">Status</option></select>
           <button className="bg-blue-500 text-white px-3 py-1 rounded">Apply Filters</button>
       </div> */}

      {loading ? (
        <p className="text-center text-gray-600">Loading crises...</p>
      ) : crises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crises.map((crisis) => (
            <CrisisCard
                key={crisis.id}
                crisis={crisis}
                // Pass action handlers based on user role if needed
                onRequestHelp={user?.role === 'civilian' ? handleRequestHelp : undefined}
                // onAccept={user?.role === 'volunteer' ? handleAcceptTask : undefined} // Need accept logic if applicable here
            />
          ))}
        </div>
      ) : (
         !error && <p className="text-center text-gray-600">No crises found matching the criteria.</p>
      )}

      {/* TODO: Add Pagination Controls Here */}
       {/* <div className="mt-8 flex justify-center items-center space-x-2">
           <button className="px-3 py-1 border rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>Previous</button>
           <span>Page {currentPage} of {totalPages}</span>
           <button className="px-3 py-1 border rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>Next</button>
       </div> */}
    </div>
  );
}

export default AllCrisesPage;
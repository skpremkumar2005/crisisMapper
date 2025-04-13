import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CrisisCard from '../Crisis/CrisisCard'; // Re-use CrisisCard for display

// Dummy data for fallback
const dummyCrises = [
    { id: 'dummy1', type: 'Flood', severity: 4, latitude: 21.1458, longitude: 79.0882, address: 'Nagpur Area', date: new Date().toISOString(), time: '10:00', post: 'Heavy flooding reported near main road.', status: 'new' },
    { id: 'dummy2', type: 'Fire', severity: 5, latitude: 19.0760, longitude: 72.8777, address: 'Mumbai Suburb', date: new Date(Date.now() - 86400000).toISOString(), time: '15:30', post: 'Building fire, urgent help needed.', status: 'assigned', assignedVolunteer: 'vol123' },
];

const dummyRequests = [
    { _id: 'req1', crisis: { _id: 'dummy2', type: 'Fire', address: 'Mumbai Suburb' }, status: 'en_route', volunteer: { name: 'Volunteer Bob' } },
    { _id: 'req2', crisis: { _id: 'comp1', type: 'Medical', address: 'Local Clinic' }, status: 'completed', volunteer: { name: 'Volunteer Alice' } },
]

function CivilianDashboard() {
  const { user } = useAuth();
  const [nearbyCrises, setNearbyCrises] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // Track help requests made by this user
  const [loadingCrises, setLoadingCrises] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState('');

  // Fetch nearby crises (similar to map, but maybe filtered differently)
  const fetchNearbyCrises = useCallback(async () => {
    setLoadingCrises(true);
    setError('');
    try {
      // TODO: Need a backend endpoint like /api/crises/nearby?lat=...&lon=...
      // For now, using the general feed and filtering client-side (inefficient)
      // Or just display all crises from the feed as a placeholder
      const { data } = await api.get('/crises/feed');
       if (data) {
            // Placeholder: Just show first 5 crises from feed
            const ran=Math.floor(Math.random() * 495) 
            setNearbyCrises(data.slice(ran, ran+5).map(item => ({ // Map to consistent format
                id: item._id ,
                latitude: parseFloat(item.location?.coordinates?.[1]),
                longitude: parseFloat(item.location?.coordinates?.[0]),
                address: item.location || 'Unknown Address',
                type: item.disasterType || 'Unknown',
                severity: item.severityLevel || 1,
                userName: item.userName,
                post: item.post,
                date: item.date,
                time: item.time,
                status: item.status || 'new',
            })))
        } else {
             console.error("Received non-array data from crisis feed:", data);
             setNearbyCrises(dummyCrises); // Fallback to dummy data
             setError("Couldn't load nearby crises. Showing sample data.");
        }

    } catch (err) {
      console.error("Error fetching nearby crises:", err);
      setError('Failed to load nearby crises. Displaying sample data.');
      setNearbyCrises(dummyCrises); // Use dummy data on error
    } finally {
      setLoadingCrises(false);
    }
  }, []);

   // Fetch requests initiated by this civilian
   const fetchMyRequests = useCallback(async () => {
    setLoadingRequests(true);
    setError(''); // Clear previous errors
     if (!user?._id) return; // Should not happen if protected route works

    try {
       // TODO: Need backend endpoint like /api/responses/my-requests
       // This endpoint should return Response documents where civilianRequester matches user._id
       // And populate necessary crisis and volunteer details.
       // const { data } = await api.get('/responses/my-requests');
       // setMyRequests(data);

       // Placeholder/Dummy data until backend is ready
       console.warn("Using dummy data for 'My Requests'");
       setMyRequests(dummyRequests);

    } catch (err) {
        console.error("Error fetching my requests:", err);
        setError(prev => `${prev} Failed to load your help requests. Displaying sample data.`);
        setMyRequests(dummyRequests); // Use dummy data on error
    } finally {
        setLoadingRequests(false);
    }
}, [user?._id]); // Dependency on user ID

  useEffect(() => {
    fetchNearbyCrises();
    fetchMyRequests();
  }, [fetchNearbyCrises, fetchMyRequests]);

  // Handler for requesting help from CrisisCard
  const handleRequestHelp = async (crisisId) => {
    console.log(`Requesting help for crisis: ${crisisId}`);
    try {
        // Assuming the backend endpoint /api/crises/:id/request-help handles finding volunteers
        const response = await api.post(`/crises/${crisisId}/request-help`);
        toast.success(response.data.message || "Help request sent successfully! Volunteers notified.");
        // Refresh requests after successful request
        fetchMyRequests();
    } catch (err) {
        console.error("Error requesting help:", err);
        toast.error(err.response?.data?.message || "Failed to send help request.");
    }
};

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Civilian Dashboard</h2>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {/* Section for Active/Pending Requests */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">My Help Requests</h3>
        {loadingRequests ? (
          <p>Loading your requests...</p>
        ) : myRequests.length > 0 ? (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div key={req._id} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
                <p className="font-medium">Crisis: {req.crisis?.type} at {req.crisis?.address || 'Unknown Location'}</p>
                <p>Status: <span className={`font-semibold capitalize px-2 py-0.5 rounded text-sm ${req.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{req.status?.replace('_', ' ')}</span></p>
                {req.volunteer?.name && <p>Assigned Volunteer: {req.volunteer.name}</p>}
                {/* Add estimated arrival time if available */}
                {/* If status is 'completed', show link to rate */}
                {req.status === 'completed' && (
                    <Link
                        to={`/rate/${req._id}`} // Link to the rating page with the response ID
                        className="text-blue-600 hover:underline mt-2 inline-block text-sm"
                    >
                        Rate Volunteer Performance
                    </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't made any help requests yet.</p>
        )}
      </section>

      {/* Section for Nearby Crises */}
      <section>
        <h3 className="text-xl font-semibold mb-3">Nearby Crises You Can Request Help For</h3>
        {loadingCrises ? (
          <p>Loading nearby crises...</p>
        ) : nearbyCrises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyCrises.map((crisis) => (
              <CrisisCard
                    key={crisis.id}
                    crisis={crisis}
                    onRequestHelp={handleRequestHelp} // Pass the handler function
              />
            ))}
          </div>
        ) : (
           !error && <p>No nearby crises found matching criteria, or the system is processing data.</p>
        )}
        <div className="mt-4 text-center">
             <Link to="/map" className="text-blue-600 hover:underline">View Full Crisis Map</Link>
        </div>
      </section>
    </div>
  );
}

export default CivilianDashboard;
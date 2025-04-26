import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
// Optional: Simple map component placeholder or use react-map-gl for a small static map
// import SmallMapDisplay from '../components/Map/SmallMapDisplay';

// Helper function for severity class
const getSeverityClass = (severity) => {
     switch (severity) {
        case 5: return 'bg-red-100 text-red-800 border-red-300';
        case 4: return 'bg-orange-100 text-orange-800 border-orange-300';
        case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 2: return 'bg-blue-100 text-blue-800 border-blue-300';
        case 1: return 'bg-green-100 text-green-800 border-green-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

// Dummy Data Fallback
const dummyCrisisDetail = {
    _id: 'dummyCrisis123',
    originalId: 'twitter:12345',
    userName: 'Dummy User',
    post: 'This is a detailed description of the dummy crisis event. Water levels rising rapidly in the main street area. Some houses affected.',
    location: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484], // Approx Empire State Building
      address: '123 Main St, Placeholder City'
    },
    date: new Date().toISOString(),
    time: '14:30',
    disasterType: 'Flood',
    sentiment: 'Negative',
    language: 'en',
    severityLevel: 4,
    mediaAttached: ['http://placekitten.com/300/200'],
    keywords: ['flood', 'water', 'help', 'street'],
    status: 'assigned',
    assignedVolunteer: { _id: 'vol789', name: 'Dummy Volunteer' }, // Example populated field
    createdAt: new Date(Date.now() - 3600000).toISOString(),
};

function CrisisDetailPage() {
  const { id: crisisId } = useParams(); // Get crisis ID from URL
  const { user } = useAuth();
  const navigate = useNavigate();
  const [crisis, setCrisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // Loading state for actions

  const fetchCrisisDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch details from backend endpoint /api/crises/:id
      // This endpoint should fetch from local DB if stored, or maybe proxy if needed
      const { data } = await api.get(`/crises/${crisisId}`);
      setCrisis(data);
    } catch (err) {
      console.error("Error fetching crisis details:", err);
       if (err.response?.status === 404) {
           setError('Crisis not found.');
       } else {
           setError('Failed to load crisis details. Displaying sample data.');
           setCrisis(dummyCrisisDetail); // Use dummy data as fallback
       }
    } finally {
      setLoading(false);
    }
  }, [crisisId]);

  useEffect(() => {
    fetchCrisisDetails();
  }, [fetchCrisisDetails]);

  // --- Action Handlers ---
  const handleRequestHelp = async () => {
    setActionLoading(true);
    try {
        const response = await api.post(`/crises/${crisisId}/request-help`);
        toast.success(response.data.message || "Help request sent successfully!");
        fetchCrisisDetails(); // Refresh details
    } catch (err) {
        console.error("Error requesting help:", err);
        toast.error(err.response?.data?.message || "Failed to send help request.");
    } finally {
        setActionLoading(false);
    }
  };

   // Placeholder for Volunteer accepting from this page (if needed, usually done from dashboard)
    const handleAcceptTask = async () => {
        // This requires knowing the 'responseId' related to this volunteer and crisis.
        // This might be complex to implement directly here without more context.
        // It's often better handled via the AssignmentComponent in the dashboard.
        console.warn("Accept Task action initiated from details page - requires responseId");
        toast.info("Please accept tasks via your dashboard notifications.");
        // Example if responseId was available:
        // setActionLoading(true);
        // try {
        //     await api.post(`/api/volunteers/assignments/${responseId}/accept`);
        //     toast.success("Assignment accepted!");
        //     fetchCrisisDetails(); // Refresh details
        // } catch (err) { /* ... */ }
        // setActionLoading(false);
    };

     // Placeholder for Admin actions
    const handleAdminAction = async (action) => {
        setActionLoading(true);
        console.log(`Admin action: ${action} for crisis ${crisisId}`);
        toast.info(`Admin action '${action}' not fully implemented.`);
        // Example: await api.post(`/api/admin/crises/${crisisId}/${action}`, { /* payload */ });
        // fetchCrisisDetails();
        setActionLoading(false);
    };


  // --- Render Logic ---
  if (loading) {
    return <p className="text-center mt-10">Loading crisis details...</p>;
  }

  if (error && !crisis) { // Show error only if no fallback data is available
    return <p className="text-center mt-10 text-red-600">{error}</p>;
  }

   if (!crisis) {
     // This case might occur if dummy data also fails or isn't set
     return <p className="text-center mt-10 text-red-600">Could not load crisis information.</p>;
   }

  // Formatting data for display
    const displayDate = crisis.date ? new Date(crisis.date).toLocaleString() : 'N/A';
    const severityInfo = `Severity ${crisis.severityLevel || 'N/A'}`;
    const locationText = crisis.location?.address || `${crisis.location?.coordinates?.[1]?.toFixed(4)}, ${crisis.location?.coordinates?.[0]?.toFixed(4)}` || 'Unknown Location';

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 md:p-8">
      {error && !loading && <p className="text-yellow-600 bg-yellow-100 p-3 rounded mb-4 text-sm">Warning: {error}</p>} {/* Show warning if using dummy data */}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b pb-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{crisis.disasterType || 'Crisis Event'}</h1>
            <p className="text-sm text-gray-500">{locationText}</p>
            <p className="text-sm text-gray-500">Reported: {displayDate}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityClass(crisis.severityLevel)}`}>
            {severityInfo}
        </span>
      </div>

      {/* Main Content */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Left Column: Details */}
           <div className="md:col-span-2 space-y-4">
                <div>
                     <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
                     <p className="text-gray-600 whitespace-pre-wrap">{crisis.post || 'No description provided.'}</p>
                </div>
                 {crisis.userName && (
                    <p className="text-sm text-gray-500">Reported by: {crisis.userName}</p>
                 )}
                 <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Status:</span> <span className="capitalize font-semibold">{crisis.status || 'Unknown'}</span></p>
                    <p><span className="font-medium">Language:</span> {crisis.language || 'N/A'}</p>
                     <p><span className="font-medium">Sentiment:</span> {crisis.sentiment || 'N/A'}</p>
                 </div>
                 {crisis.keywords && crisis.keywords.length > 0 && (
                     <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Keywords:</h4>
                        <div className="flex flex-wrap gap-1">
                            {crisis.keywords.map(kw => (
                                <span key={kw} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">{kw}</span>
                            ))}
                        </div>
                     </div>
                 )}
                 {crisis.assignedVolunteer && (
                     <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                         <h4 className="font-semibold text-blue-800">Assigned Volunteer</h4>
                         <p className="text-blue-700">{crisis.assignedVolunteer.name || crisis.assignedVolunteer._id}</p>
                         {/* Optionally link to volunteer profile if implemented */}
                     </div>
                 )}
           </div>

            {/* Right Column: Media & Actions */}
           <div className="space-y-6">
                {/* Map Placeholder */}
                <div>
                     <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
                     <div className="h-40 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                         {/* Integrate SmallMapDisplay here if created */}
                         Map Placeholder
                         {crisis.location?.coordinates && ` (${crisis.location.coordinates[1]?.toFixed(2)}, ${crisis.location.coordinates[0]?.toFixed(2)})`}
                     </div>
                </div>

                 {/* Media Attached */}
                {crisis.mediaAttached && crisis.mediaAttached.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Attached Media</h3>
                         <div className="flex flex-wrap gap-2">
                            {crisis.mediaAttached.map((mediaUrl, index) => (
                                <a key={index} href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block border rounded overflow-hidden hover:opacity-80">
                                     {/* Basic image display, ideally check media type */}
                                     <img src={mediaUrl} alt={`Crisis media ${index + 1}`} className="w-20 h-20 object-cover" onError={(e) => e.target.style.display = 'none'}/>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                 {/* Action Buttons */}
                 {user && (
                     <div className="pt-4 border-t">
                        <h3 className="font-semibold text-gray-700 mb-3">Actions</h3>
                         <div className="flex flex-col space-y-2">
                             {/* Civilian Action */}
                             {user.role === 'civilian' && crisis.status !== 'resolved' && crisis.status !== 'closed' && (
                                 <button
                                     onClick={handleRequestHelp}
                                     disabled={actionLoading}
                                     className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                 >
                                     {actionLoading ? 'Sending Request...' : 'Request Help for this Crisis'}
                                 </button>
                             )}
                             {/* Volunteer Action (Example - limited use here) */}
                             {user.role === 'volunteer' && crisis.status === 'new' && (
                                 <button
                                      onClick={handleAcceptTask} // This needs more logic (responseId)
                                     disabled={actionLoading}
                                     className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                 >
                                     {actionLoading ? 'Processing...' : 'Accept Task (via Dashboard Preferred)'}
                                 </button>
                             )}
                              {/* Admin Actions */}
                             {user.role === 'admin' && (
                                <div className="space-y-2">
                                    <button onClick={() => handleAdminAction('verify')} disabled={actionLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm">Verify Crisis</button>
                                     <button onClick={() => handleAdminAction('assign')} disabled={actionLoading} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm">Manually Assign</button>
                                      <button onClick={() => handleAdminAction('resolve')} disabled={actionLoading} className="w-full bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm">Mark Resolved/Closed</button>
                                </div>
                             )}
                         </div>
                     </div>
                 )}
            </div>
       </div>

        <div className="mt-8 text-center">
             <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">
                 ← Back to Previous Page
             </button>
         </div>
    </div>
  );
}

export default CrisisDetailPage;
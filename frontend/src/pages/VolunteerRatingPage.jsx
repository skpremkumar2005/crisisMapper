import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import RatingComponent from '../components/Rating/RatingComponent'; // Import the rating form

// Dummy Data Fallback
const dummyResponseData = {
    _id: 'dummyResp123',
    crisis: {
        _id: 'dummyCrisisABC',
        type: 'Medical Emergency',
        address: '123 Main St',
        date: new Date(Date.now() - 86400000).toISOString(),
        time: '10:00',
    },
    volunteer: {
        _id: 'dummyVol456',
        name: 'Helpful Volunteer',
    },
    status: 'completed',
    completedAt: new Date().toISOString(),
    // Add civilianRequester if needed for context
    civilianRequester: {
        _id: 'userCiv789',
        name: 'Grateful Civilian'
    }
};


function VolunteerRatingPage() {
  const { responseId } = useParams(); // Get response ID from URL
  const navigate = useNavigate();
  const [responseDetails, setResponseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadyRated, setAlreadyRated] = useState(false); // Flag if rating already exists

  const fetchResponseDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    setAlreadyRated(false); // Reset flag
    try {
      // TODO: Need a backend endpoint GET /api/responses/:id (or similar)
      // This should return the Response document, populating crisis and volunteer info
      const { data } = await api.get(`users/responses/${responseId}`);
      // setResponseDetails(data);

      // Placeholder / Dummy Data
      //  console.warn(`Using dummy data for response details: ${responseId}`);
       // Check if the dummy data matches the ID for simulation
        if (data) { // Match ID from CivilianDashboard dummy data or the one above
            setResponseDetails(data);
             // Simulate checking if already rated (backend should ideally do this)
             const rated = localStorage.getItem(`rated_${responseId}`);
             if(rated) setAlreadyRated(true);
        } else {
             throw new Error("Response not found (dummy data mismatch)");
        }


    } catch (err) {
      console.error("Error fetching response details:", err);
      let errMsg = 'Failed to load assignment details.';
      if (err.response?.status === 404 || err.message.includes("not found")) {
          errMsg = 'Assignment details not found.';
      } else if (err.response?.status === 403) {
          errMsg = 'You are not authorized to rate this assignment.';
      }
      setError(errMsg);
       // No fallback data here, as rating requires specific context
    } finally {
      setLoading(false);
    }
  }, [responseId]);

  useEffect(() => {
    fetchResponseDetails();
  }, [fetchResponseDetails]);

  const handleRatingSuccess = () => {
      // Called after RatingComponent successfully submits
      setAlreadyRated(true); // Mark as rated in the UI
      localStorage.setItem(`rated_${responseId}`, 'true'); // Simulate backend state with localStorage
      // Optionally navigate away after a short delay
      setTimeout(() => {
          navigate('/dashboard'); // Redirect to dashboard after rating
      }, 3000); // 3 second delay
  }

  // --- Render Logic ---
  if (loading) {
    return <p className="text-center mt-10">Loading assignment details...</p>;
  }

  if (error) {
    return (
        <div className="text-center mt-10 max-w-md mx-auto">
            <p className="text-red-600 bg-red-100 p-4 rounded mb-4">{error}</p>
             <Link to="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</Link>
        </div>
    );
  }

  if (!responseDetails) {
     return <p className="text-center mt-10">Could not load assignment information.</p>;
  }

   // Check if assignment is actually completed (redundant if backend handles this, but good client-side check)
    if (responseDetails.status !== 'completed') {
        return (
             <div className="text-center mt-10 max-w-md mx-auto">
                <p className="text-yellow-700 bg-yellow-100 p-4 rounded mb-4">This assignment is not yet marked as completed. Rating is only available after completion.</p>
                 <Link to="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</Link>
            </div>
        );
    }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Rate Volunteer Service</h1>

      {/* Display Assignment Summary */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Assignment Details</h2>
        <p><strong>Crisis Type:</strong> {responseDetails.crisis?.details || 'N/A'}</p>
        <p><strong>Location:</strong> {responseDetails.crisis?.location || 'N/A'}</p>
         <p><strong>Date Completed:</strong> {responseDetails.completedAt ? new Date(responseDetails.completedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Volunteer:</strong> {responseDetails.volunteer?.name || 'N/A'}</p>
      </div>

        {alreadyRated ? (
            <div className="text-center p-6 bg-green-100 text-green-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
                <p>You have already submitted a rating for this service.</p>
                 <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
            </div>
        ) : (
             <RatingComponent
                responseId={responseId}
                ratedVolunteerId={responseDetails.volunteer?._id} // Pass volunteer ID if available
                onRatingSuccess={handleRatingSuccess} // Pass callback function
                location={responseDetails.crisis.location}
                crisis={responseDetails.crisis._id}
            />
        )}


    </div>
  );
}

export default VolunteerRatingPage;
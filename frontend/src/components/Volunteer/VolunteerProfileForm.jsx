import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

// This component is usually part of the ProfilePage for volunteers
function VolunteerProfileForm({ initialProfileData }) {
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState(true);
  // Add other fields like transportation, etc. if needed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when initial data is loaded (passed from ProfilePage)
  useEffect(() => {
    if (initialProfileData) {
      setSkills(initialProfileData.skills?.join(', ') || '');
      setAvailability(initialProfileData.availability ?? true);
       // Set other fields
    }
  }, [initialProfileData]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const profileData = {
        skills: skills.split(',').map(s => s.trim()).filter(s => s), // Split CSV and trim/filter empty
        availability,
        // Add other fields to submit
    };

    try {
      // Use the POST /api/volunteers/profile endpoint (handles create/update)
      const { data } = await api.post('/volunteers/profile', profileData);
      toast.success('Volunteer profile updated successfully!');
      // Optionally, call a function passed via props to update the parent state (ProfilePage)
      // onUpdateSuccess(data);
    } catch (err) {
      console.error("Error updating volunteer profile:", err);
      setError(err.response?.data?.message || 'Failed to update profile.');
      toast.error(error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Volunteer Details</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Skills Input */}
      <div className="mb-4">
        <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
          Skills (comma-separated, e.g., First Aid, Driving, Translation)
        </label>
        <input
          type="text"
          id="skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="First Aid, Driving, ..."
        />
      </div>

      {/* Availability Toggle */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Availability
        </label>
        <button
            type="button" // Important: type="button" prevents form submission
            onClick={() => setAvailability(!availability)}
            className={`px-4 py-2 rounded text-white w-full md:w-auto ${availability ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
            {availability ? 'Mark as UNAVAILABLE' : 'Mark as AVAILABLE'}
        </button>
         <p className="text-xs text-gray-500 mt-1">Current status: {availability ? 'Available for assignments' : 'Not available for assignments'}</p>
      </div>

       {/* Add other form fields here (e.g., Transportation details) */}


      <button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Volunteer Details'}
      </button>
    </form>
  );
}

export default VolunteerProfileForm;
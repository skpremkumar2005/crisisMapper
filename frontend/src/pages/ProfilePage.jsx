import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VolunteerProfileForm from '../components/Volunteer/VolunteerProfileForm'; // Import the form

function ProfilePage() {
  const { user, updateUserContext } = useAuth(); // Get user and update function from context
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [locationData, setLocationData] = useState({ latitude: '', longitude: '' }); // For location update
  const [volunteerProfile, setVolunteerProfile] = useState(null); // For volunteer-specific data
  const [loading, setLoading] = useState(false);
  const [loadingVolProfile, setLoadingVolProfile] = useState(false);
  const [error, setError] = useState('');

   // Fetch volunteer profile details if user is a volunteer
   useEffect(() => {
    const fetchVolunteerProfile = async () => {
        if (user?.role === 'volunteer') {
            setLoadingVolProfile(true);
            try {
                const { data } = await api.get('/volunteers/profile');
                setVolunteerProfile(data);
            } catch (err) {
                 console.error("Error fetching volunteer profile for form:", err);
                 // Handle error - maybe show message, don't block basic profile edit
                  toast.error("Could not load volunteer-specific details.");
            } finally {
                setLoadingVolProfile(false);
            }
        }
    };
    fetchVolunteerProfile();
   }, [user?.role]); // Fetch when user role is known


  // Update form data when user context changes or editing starts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
       setLocationData({
           latitude: user.location?.coordinates?.[1] || '', // Latitude is index 1
           longitude: user.location?.coordinates?.[0] || '', // Longitude is index 0
       });
    }
  }, [user, isEditing]); // Re-populate if user changes or edit starts

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

   const handleLocationChange = (e) => {
        setLocationData({ ...locationData, [e.target.name]: e.target.value });
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
        setError('New passwords do not match.');
        return;
    }
    if (formData.newPassword && !formData.currentPassword) {
        setError('Please enter your current password to change it.');
        return;
    }

    setLoading(true);

    const updateData = {
      name: formData.name,
      // Only include email if you allow changing it (potential security implications)
      // email: formData.email,
    };

    // Include password fields only if a new password is provided
    if (formData.newPassword) {
        updateData.password = formData.newPassword;
         // Backend should ideally verify currentPassword if changing password
         // Sending currentPassword might be needed depending on backend implementation
         // updateData.currentPassword = formData.currentPassword; // If backend needs it
    }

    // Include location if provided and valid
     if (locationData.latitude && locationData.longitude) {
        const lat = parseFloat(locationData.latitude);
        const lon = parseFloat(locationData.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
             updateData.location = {
                type: 'Point',
                coordinates: [lon, lat] // [longitude, latitude]
            };
        } else {
            setError('Invalid latitude or longitude provided.');
            setLoading(false);
            return;
        }
    }


    try {
      // Use the PUT /api/users/profile endpoint
      const { data } = await api.put('/users/profile', updateData);
      updateUserContext(data); // Update AuthContext with new user info
      toast.success('Profile updated successfully!');
      setIsEditing(false); // Exit editing mode
        // Clear password fields after successful update
       setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
    } catch (err) {
      console.error("Error updating profile:", err);
       const errMsg = err.response?.data?.message || 'Failed to update profile.';
       setError(errMsg);
       toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p>Loading profile...</p>; // Or redirect if definitely not logged in
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {!isEditing ? (
        // --- Display Mode ---
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
           <div className="border-b border-gray-200 pb-4 mb-4">
               <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Role: <span className="capitalize font-semibold">{user.role}</span></p>
           </div>
           <dl>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
                </div>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                     <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                </div>
                 <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                     <dt className="text-sm font-medium text-gray-500">Current Location</dt>
                     <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                         {user.location?.coordinates ? `${user.location.coordinates[1]?.toFixed(4)}, ${user.location.coordinates[0]?.toFixed(4)}` : 'Not Set'}
                    </dd>
                </div>
                 {/* Display volunteer details if applicable */}
                {user.role === 'volunteer' && volunteerProfile && (
                    <>
                         <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Volunteer Skills</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{volunteerProfile.skills?.join(', ') || 'Not Set'}</dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-gray-500">Volunteer Availability</dt>
                            <dd className={`mt-1 text-sm sm:mt-0 sm:col-span-2 font-semibold ${volunteerProfile.availability ? 'text-green-600' : 'text-red-600'}`}>
                                {volunteerProfile.availability ? 'Available' : 'Unavailable'}
                             </dd>
                        </div>
                    </>
                )}
           </dl>
            <div className="mt-6 text-right">
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                    Edit Profile
                </button>
           </div>
        </div>

      ) : (
        // --- Edit Mode ---
        <form onSubmit={handleSubmit} className="bg-white shadow overflow-hidden sm:rounded-lg p-6 space-y-6">
            <div>
                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                 <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            {/* <div> // Email edit disabled by default - uncomment if needed
                 <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                 <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div> */}

            {/* Location Edit */}
             <fieldset className="mt-4 border-t pt-4">
                <legend className="text-sm font-medium text-gray-700">Update Location (Optional)</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                     <div>
                         <label htmlFor="latitude" className="block text-xs font-medium text-gray-600">Latitude</label>
                         <input type="number" step="any" name="latitude" id="latitude" value={locationData.latitude} onChange={handleLocationChange} placeholder="e.g., 40.7128" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                     </div>
                      <div>
                         <label htmlFor="longitude" className="block text-xs font-medium text-gray-600">Longitude</label>
                         <input type="number" step="any" name="longitude" id="longitude" value={locationData.longitude} onChange={handleLocationChange} placeholder="e.g., -74.0060" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                     </div>
                </div>
            </fieldset>

            {/* Password Change Section */}
            <fieldset className="mt-4 border-t pt-4">
                <legend className="text-sm font-medium text-gray-700">Change Password (Optional)</legend>
                {/* <div className="mt-2"> // Only include current password if backend requires verification
                     <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-600">Current Password</label>
                     <input type="password" name="currentPassword" id="currentPassword" value={formData.currentPassword} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div> */}
                <div className="mt-2">
                     <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600">New Password</label>
                     <input type="password" name="newPassword" id="newPassword" value={formData.newPassword} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                 <div className="mt-2">
                     <label htmlFor="confirmNewPassword" className="block text-xs font-medium text-gray-600">Confirm New Password</label>
                     <input type="password" name="confirmNewPassword" id="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </fieldset>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                >
                    Cancel
                </button>
                 <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      )}

      {/* Display Volunteer Profile Form if user is a volunteer and in edit mode */}
      {isEditing && user.role === 'volunteer' && (
          loadingVolProfile
            ? <p className="mt-6 text-center">Loading volunteer details...</p>
            : <VolunteerProfileForm initialProfileData={volunteerProfile} />
       )}
    </div>
  );
}

export default ProfilePage;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('civilian'); // Default role
  // Location state - simplified example, might need better input method like map click
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
       // Construct location object if lat/lon provided
       const location = (latitude && longitude) ? {
           type: 'Point',
           coordinates: [parseFloat(longitude), parseFloat(latitude)]
       } : undefined;

      await register(name, email, password, role, location);
      navigate('/dashboard'); // Redirect to dashboard after successful registration
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
        </div>
        {/* Email Input */}
        <div className="mb-4">
           <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
           <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
        </div>
        {/* Password Input */}
        <div className="mb-4">
           <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
           <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
        </div>
        {/* Confirm Password Input */}
        <div className="mb-6">
           <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">Confirm Password</label>
           <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
        </div>
        {/* Role Selection */}
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="role">Register As:</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300">
                <option value="civilian">Civilian (Seeking Help)</option>
                <option value="volunteer">Volunteer (Offering Help)</option>
            </select>
        </div>

        {/* Location Input (Basic - Needs Improvement) */}
        <p className="text-sm text-gray-600 mb-2">Optional: Enter your approximate location (allows nearby crisis alerts for volunteers).</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
             <div>
                 <label className="block text-gray-700 mb-1" htmlFor="latitude">Latitude</label>
                 <input type="number" step="any" id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g., 40.7128" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
             </div>
              <div>
                 <label className="block text-gray-700 mb-1" htmlFor="longitude">Longitude</label>
                 <input type="number" step="any" id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g., -74.0060" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"/>
             </div>
        </div>


        <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
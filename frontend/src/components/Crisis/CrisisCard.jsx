import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // To check user role

// Helper function for severity color (same as in CrisisMapPage)
const getSeverityClass = (severity) => {
    switch (severity) {
        case 5: return 'bg-red-500 border-red-700';    // High
        case 4: return 'bg-orange-400 border-orange-600';
        case 3: return 'bg-yellow-400 border-yellow-600';
        case 2: return 'bg-blue-300 border-blue-500';
        case 1: return 'bg-green-400 border-green-600';  // Low
        default: return 'bg-gray-400 border-gray-600';
    }
};

function CrisisCard({ crisis, onAccept, onRequestHelp }) {
  const { user } = useAuth();

  if (!crisis) return null; // Handle case where crisis data is missing

  // Basic data formatting (improve as needed)
  const displayDate = crisis.date ? new Date(crisis.date).toLocaleDateString() : 'N/A';
  const displayTime = crisis.time || 'N/A';
  const locationText = crisis.address || `${crisis.latitude?.toFixed(4)}, ${crisis.longitude?.toFixed(4)}` || 'Unknown Location';


  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow duration-200 bg-white relative">
      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${getSeverityClass(crisis.severity)} border-2`} title={`Severity: ${crisis.severity || 'N/A'}`}></div>
      <h3 className="text-lg font-semibold mb-1">{crisis.type || 'Unknown Crisis Type'}</h3>
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Location:</span> {locationText}
      </p>
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Reported:</span> {displayDate} at {displayTime}
      </p>
       <p className="text-sm text-gray-700 mb-3">
        <span className="font-medium">Details:</span> {crisis.post?.substring(0, 80) || 'No description available'}{crisis.post?.length > 80 ? '...' : ''}
      </p>
       {crisis.userName && (
          <p className="text-xs text-gray-500 mb-3">Reported by: {crisis.userName}</p>
       )}

      <div className="flex justify-end space-x-2 mt-2">
        <Link
            to={`/crisis/${crisis.id}`} // Assumes crisis object has an 'id' field
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
        >
            View Details
        </Link>

        {/* Action buttons based on role */}
        {user?.role === 'civilian' && onRequestHelp && (
            <button
                onClick={() => onRequestHelp(crisis.id)}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
                Request Help
            </button>
        )}
         {user?.role === 'volunteer' && onAccept && crisis.status === 'new' && ( // Example condition: volunteer can accept 'new' crises
            <button
                onClick={() => onAccept(crisis.id)} // Pass crisis ID or response ID if available
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
                Accept Task
            </button>
        )}
         {/* Add Admin actions if needed */}
      </div>
    </div>
  );
}

export default CrisisCard;
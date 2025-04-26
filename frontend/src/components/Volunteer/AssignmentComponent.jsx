import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Helper function for severity class (can be imported from a utils file)
const getSeverityClass = (severity) => {
    switch (severity) {
        case 5: return 'bg-red-500 border-red-700';
        case 4: return 'bg-orange-400 border-orange-600';
        case 3: return 'bg-yellow-400 border-yellow-600';
        case 2: return 'bg-blue-300 border-blue-500';
        case 1: return 'bg-green-400 border-green-600';
        default: return 'bg-gray-400 border-gray-600';
    }
};

function AssignmentComponent({ assignment, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [failReason, setFailReason] = useState(''); // For fail/reject reason
  const [showFailInput, setShowFailInput] = useState(false);

  if (!assignment || !assignment.crisis) return <p>Assignment data missing.</p>;

  const { _id: responseId, status, crisis } = assignment;
  const { _id: crisisId, DisasterType, severityLevel, location, post } = crisis;
 

  const handleAction = async (action) => {
    setLoading(true);
    let url = `/volunteers/assignments/${responseId}/${action}`;
    let payload = {};

    if (action === 'fail' || action === 'reject') { // Assuming 'fail' endpoint handles rejection too
        if (!failReason.trim()) {
             toast.error("Please provide a reason for failing/rejecting.");
             setLoading(false);
             return;
        }
        action = 'fail'; // Ensure endpoint is correct
        url = `/volunteers/assignments/${responseId}/fail`;
        payload = { reason: failReason };
    }

    try {
      console.log("ji")

      const { data } = await api.post(url);
      toast.success(`Assignment ${action === 'accept' ? 'accepted' : action === 'complete' ? 'marked complete' : 'updated'} successfully!`);
      setShowFailInput(false); // Hide input on success
      setFailReason(''); // Clear reason
      if (onUpdate) {
        onUpdate(); // Trigger parent component (dashboard) to refresh data
      }
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      toast.error(err.response?.data?.message || `Failed to ${action}   assignment.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm mb-4 relative">
       <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${getSeverityClass(severityLevel)} border-2`} title={`Severity: ${severityLevel}`}></div>

      <h4 className="text-lg font-medium mb-1">{DisasterType || 'Unknown Crisis Type'}</h4>
      <p className="text-sm text-gray-600 mb-1">Location: {location || 'Not specified'}</p>
      <p className="text-sm text-gray-700 mb-2">Details: {post || 'No details'}</p>
      <p className="text-sm mb-3">Status: <span className="font-semibold capitalize">{status?.replace('_', ' ')}</span></p>

        {/* Action Buttons based on Status */}
        <div className="flex flex-wrap gap-2 items-center">
             {status === 'notified' && (
                <>
                    <button
                        onClick={() => handleAction('accept')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                        {loading ? 'Accepting...' : 'Accept'}
                    </button>
                     <button
                        onClick={() => setShowFailInput(true)} // Show reason input first
                        disabled={loading || showFailInput}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                        Reject
                    </button>
                </>
             )}

             {['accepted', 'en_route', 'arrived'].includes(status) && (
                  <>
                     {/* Placeholder buttons for status updates */}
                     {status === 'accepted' && <button onClick={() => handleAction('en_route')} disabled={loading} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Mark En Route</button> }
                     {status === 'en_route' && <button onClick={() => handleAction('arrived')} disabled={loading} className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Mark Arrived</button>}

                     <button
                        onClick={() => handleAction('complete')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                         {loading ? 'Completing...' : 'Mark Complete'}
                    </button>
                     <button
                        onClick={() => setShowFailInput(true)}
                        disabled={loading || showFailInput}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                        Mark Failed
                    </button>
                  </>
             )}

             {/* Link to full details */}
              <Link
                to={`/crisis/${crisisId}`}
                className="text-xs text-gray-600 hover:underline ml-auto" // Push to right
             >
                View Full Crisis Details
             </Link>
        </div>

         {/* Input for Rejection/Failure Reason */}
        {showFailInput && (
            <div className="mt-3 pt-3 border-t">
                 <label htmlFor={`fail-reason-${responseId}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Rejection / Failure:
                </label>
                 <textarea
                    id={`fail-reason-${responseId}`}
                    rows="2"
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="e.g., Unable to reach location, Prior commitment, Task already resolved"
                ></textarea>
                 <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => handleAction('fail')} // Action is 'fail' for backend
                        disabled={loading || !failReason.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Reason'}
                    </button>
                    <button
                        onClick={() => { setShowFailInput(false); setFailReason(''); }}
                        disabled={loading}
                        className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded text-sm"
                    >
                        Cancel
                    </button>
                 </div>
            </div>
        )}
    </div>
  );
}

export default AssignmentComponent;
// src/components/Dashboards/VolunteerDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import AssignmentComponent from '../Volunteer/AssignmentComponent';

// Dummy Data Fallback - ONLY used if API fails catastrophically
const dummyProfileFallback = {
    user: { name: 'Fallback Profile', email: 'error@loading.com'},
    skills: [], availability: false, rating: 0, completedTasks: 0, failedTasks: 0,
};
const dummyAssignmentsFallback = []; // Use empty array for assignment errors


function VolunteerDashboard() {
    const { user } = useAuth();
    const socket = useSocket();
    const [profile, setProfile] = useState(null);
    const [assignments, setAssignments] = useState([]); // Start empty
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [error, setError] = useState('');

    // --- fetchData Function ---
    const fetchData = useCallback(async (triggeredBy = "mount") => { // Added trigger source for logging
        console.log(`--- VolunteerDashboard: fetchData called (Trigger: ${triggeredBy}) ---`);
        // Reset loading state for assignments specifically when fetching assignments
        setLoadingAssignments(true);
        if (triggeredBy === "mount") { // Only reset profile loading on initial mount
             setLoadingProfile(true);
        }
        // Don't clear global error immediately, append or specify source
        let fetchError = '';

        try {
            // Fetch Profile (only on mount, or explicitly if needed)
            if (triggeredBy === "mount" || triggeredBy === "profile_update") {
                try {
                    console.log("fetchData: Fetching profile...");
                    const profileResponse = await api.get('/volunteers/profile');
                    setProfile(profileResponse.data);
                    console.log("fetchData: Profile fetched successfully.");
                    setLoadingProfile(false); // Set profile loading false here
                } catch (profileErr) {
                    console.error("Error fetching volunteer profile:", profileErr);
                    fetchError += 'Failed to load profile. ';
                    setProfile(dummyProfileFallback); // Use fallback profile
                    setLoadingProfile(false);
                }
            }

            // Fetch Assignments (Always fetch assignments when fetchData is called)
            try {
                 console.log("fetchData: Fetching assignments...");
                 const assignmentsResponse = await api.get('/volunteers/assignments');
                 console.log("fetchData: Received assignments API response", assignmentsResponse); // Log raw response

                 if (Array.isArray(assignmentsResponse?.data)) {
                    console.log(`fetchData: Setting assignments state with ${assignmentsResponse.data.length} assignments from API.`);
                    setAssignments(assignmentsResponse.data);
                 } else {
                    console.error("fetchData: Received non-array data for assignments:", assignmentsResponse?.data);
                    fetchError += 'Invalid assignment data format received. ';
                    setAssignments(dummyAssignmentsFallback); // Use fallback
                 }
            } catch (assignmentErr) {
                 console.error("Error fetching volunteer assignments:", assignmentErr);
                 fetchError += 'Failed to load assignments. ';
                 setAssignments(dummyAssignmentsFallback); // Use fallback
            } finally {
                 setLoadingAssignments(false); // Assignments are done loading/erroring
            }

            // Update the main error state if any errors occurred
            if (fetchError) {
                 setError(prevError => `${prevError ? prevError + ' | ' : ''}${fetchError.trim()}`);
            }

        } catch (generalError) {
            console.error("General error during fetchData:", generalError);
            setError('An unexpected error occurred while loading dashboard data.');
            setLoadingProfile(false); // Ensure loading stops on general error
            setLoadingAssignments(false);
        }
    }, []); // Keep dependency array empty for useCallback definition

    // --- useEffect for Initial Fetch and Listeners ---
    useEffect(() => {
        console.log("VolunteerDashboard: Mount effect running.");
        fetchData("mount"); // Initial fetch

        const currentSocket = socket;
        if (currentSocket) {
            console.log('VolunteerDashboard: Socket available, setting up listeners...');

            // --- Handler Definitions ---
            const handleNewAssignment = (data) => {
                console.log('!!!! VolunteerDashboard: handleNewAssignment triggered !!!!', data);
                toast.info(`New assignment received: ${data.crisisType || 'Crisis'}! Refreshing list...`);
                // Explicitly call fetchData, triggered by the notification
                fetchData("new_assignment_notification");
            };

            const handleAssignmentUpdate = (data) => {
                console.log('!!!! VolunteerDashboard: handleAssignmentUpdate triggered !!!!', data);
                toast.info(`Assignment status updated (ID: ${data.responseId?.slice(-6)}). Refreshing list.`);
                fetchData("assignment_update");
            };

            const handleProfileUpdate = (data) => {
                console.log('!!!! VolunteerDashboard: handleProfileUpdate triggered !!!!', data);
                toast.info("Your profile details have been updated. Refreshing...");
                fetchData("profile_update");
            };

            // --- Register Listeners ---
            console.log("VolunteerDashboard: Attaching socket listeners...");
            currentSocket.on('new_assignment_notification', handleNewAssignment);
            currentSocket.on('assignment_update', handleAssignmentUpdate);
            currentSocket.on('volunteer_profile_update', handleProfileUpdate);

            // --- Cleanup Function ---
            return () => {
                console.log('VolunteerDashboard: Component unmounting or socket changing. Cleaning up listeners...');
                currentSocket.off('new_assignment_notification', handleNewAssignment);
                currentSocket.off('assignment_update', handleAssignmentUpdate);
                currentSocket.off('volunteer_profile_update', handleProfileUpdate);
            };
        } else {
            console.warn('VolunteerDashboard: Socket not available on mount. Real-time updates disabled.');
        }

    }, [socket, fetchData]); // Re-run if socket changes or fetchData reference changes (it shouldn't due to useCallback)

    // --- toggleAvailability Function (no changes needed) ---
    const toggleAvailability = async () => {
        if (!profile) return;
        const newAvailability = !profile.availability;
        try {
            const { data } = await api.post('/volunteers/profile', { availability: newAvailability });
            setProfile(data);
            toast.success(`Availability updated to: ${newAvailability ? 'Available' : 'Unavailable'}`);
        } catch (err) {
            console.error("Error updating availability:", err);
            toast.error("Failed to update availability.");
        }
    };

    // --- Filtering Assignments (add checks for assignment object) ---
    const notifiedAssignments = assignments.filter(a => a && a.status === 'notified');
    const activeAssignments = assignments.filter(a => a && ['accepted', 'en_route', 'arrived'].includes(a.status));

    // --- Callback passed to child component (add logging) ---
    const handleAssignmentUpdateCallback = useCallback(() => {
        console.log("VolunteerDashboard: handleAssignmentUpdateCallback triggered by child. Refreshing data...");
        fetchData("child_update"); // Fetch data after child component updates status
    }, [fetchData]);

     // --- Render Logic ---
     console.log('VolunteerDashboard rendering. Assignments state:', assignments); // Log state before render
     console.log('VolunteerDashboard rendering. Notified assignments:', notifiedAssignments); // Log filtered state

     const renderAssignmentList = (list, title, emptyMessage) => (
        <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">{title} ({list?.length ?? 0})</h3>
            {/* Check loading state specifically for assignments before rendering list */}
            {loadingAssignments ? <p>Loading assignments...</p> :
                list?.length > 0 ? (
                    <div className="space-y-4">
                        {list.map(assignment => (
                            assignment?._id ? ( // Ensure assignment and _id exist
                                <AssignmentComponent
                                    key={assignment._id}
                                    assignment={assignment}
                                    onUpdate={handleAssignmentUpdateCallback}
                                />
                            ) : <p key={Math.random()} className='text-red-500 text-sm'>Invalid assignment data encountered.</p> // Log invalid data
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">{emptyMessage}</p>
                )
            }
        </section>
    );


    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Volunteer Dashboard</h2>
            {/* Display general error if exists */}
            {error && !loadingAssignments && !loadingProfile && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

            {/* Profile Section */}
            {loadingProfile ? <p>Loading profile...</p> : profile && (
                 <section className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                    {/* ... (Profile details JSX as before) ... */}
                     <div className="flex justify-between items-start mb-3">
                         <div>
                             <h3 className="text-xl font-semibold">{profile.user?.name || 'Volunteer'}</h3>
                             <p className="text-sm text-gray-600">{profile.user?.email}</p>
                         </div>
                         <Link to="/profile" className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Edit Profile & Skills</Link>
                     </div>
                     <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3 text-sm">
                         <p>Skills: <span className="font-medium">{profile.skills?.join(', ') || 'Not set'}</span></p>
                         <p>Avg Rating: <span className="font-medium">{profile.rating?.toFixed(1) || 'N/A'}</span></p>
                         <p>Completed Tasks: <span className="font-medium">{profile.completedTasks ?? 'N/A'}</span></p>
                         <p>Failed Tasks: <span className="font-medium">{profile.failedTasks ?? 'N/A'}</span></p>
                     </div>
                     <div className="flex items-center space-x-3">
                         <span className="font-medium">Availability:</span>
                         <button
                             onClick={toggleAvailability}
                             className={`px-4 py-1 rounded text-white text-sm ${profile.availability ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                         >
                             {profile.availability ? 'Available (Click to Set Unavailable)' : 'Unavailable (Click to Set Available)'}
                         </button>
                     </div>
                 </section>
            )}

            {/* Assignment Sections - Use render helper */}
            {renderAssignmentList(
                notifiedAssignments,
                "New Assignment Notifications",
                "No new assignments matching your profile right now. Ensure you are marked as available."
            )}
            {renderAssignmentList(
                activeAssignments,
                "Your Active Assignments",
                "You have no active assignments."
            )}

            {/* Link to Map */}
            <div className="mt-6 text-center">
                <Link to="/map" className="text-blue-600 hover:underline">View Full Crisis Map</Link>
            </div>
        </div>
    );
}

export default VolunteerDashboard;
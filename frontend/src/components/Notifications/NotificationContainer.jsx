import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext'; // Assuming SocketContext handles listening

// This component primarily exists to *trigger* toasts based on socket events.
// The actual display is handled by the <ToastContainer /> in App.jsx.
// We listen to socket events here (if not done centrally in SocketContext).

function NotificationContainer() {
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      // --- Listen for events and show toasts ---

      // Example: New assignment notification for volunteers
      socket.on('new_assignment_notification', (data) => {
        console.log('Toast Trigger: New assignment notification', data);
        toast.info(data.message || `New crisis nearby requires assistance! Type: ${data.crisisType || 'Unknown'}`, {
          toastId: `new-assign-${data.responseId}`, // Prevent duplicate toasts for same assignment
        });
      });

      // Example: Assignment status update (generic)
      socket.on('assignment_update', (data) => {
         console.log('Toast Trigger: Assignment update', data);
         // Customize message based on status
         let message = `Assignment status updated to: ${data.status}`;
         if (data.status === 'accepted') message = `Volunteer ${data.volunteerName || data.volunteerId || ''} accepted the assignment.`;
         if (data.status === 'completed') message = `Volunteer has completed the task!`;

         toast.success(message, { toastId: `update-${data.responseId}-${data.status}` });
      });

      // Example: Notification for volunteer when they receive a rating
       socket.on('new_rating', (data) => {
            console.log('Toast Trigger: New rating received', data);
            toast.info(`You received a new rating: ${data.rating} stars!`, {
                toastId: `rating-${data.ratingId || Math.random()}`, // Need unique ID
            });
      });

      // Example: Notification for Civilian when volunteer accepts/is en route
       socket.on('volunteer_accepted', (data) => {
            console.log('Toast Trigger: Volunteer accepted', data);
            toast.success(`Volunteer ${data.volunteerName || ''} has accepted your request and is on their way!`, {
                 toastId: `vol-accept-${data.responseId}`,
            });
        });
         socket.on('volunteer_en_route', (data) => {
            console.log('Toast Trigger: Volunteer en route', data);
            toast.info(`Volunteer ${data.volunteerName || ''} is now en route.`, {
                 toastId: `vol-route-${data.responseId}`,
            });
        });


      // Add more listeners for other events...

      // Cleanup listeners on component unmount or socket change
      return () => {
        socket.off('new_assignment_notification');
        socket.off('assignment_update');
        socket.off('new_rating');
        socket.off('volunteer_accepted');
        socket.off('volunteer_en_route');
        // ... turn off other listeners
      };
    }
  }, [socket]); // Re-run effect if the socket instance changes

  // This component doesn't render anything itself,
  // as react-toastify's <ToastContainer /> handles the UI.
  return null;
}

export default NotificationContainer;
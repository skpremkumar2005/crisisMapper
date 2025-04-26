import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // To get user ID

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Get authenticated user info

    useEffect(() => {
        // Connect only if user is logged in
        if (user && user.token) {
            // Establish connection - use VITE_ prefix for Vite env vars
            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
                 // You might need to pass auth token if your backend requires it for socket connection
                 // auth: { token: user.token } // Example
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Join user-specific room after connection
                newSocket.emit('join_user_room', user._id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

             // --- Listen for specific events from the server ---
            newSocket.on('new_assignment_notification', (data) => {
                console.log('Received new assignment notification:', data);
                // TODO: Trigger a UI notification (e.g., using a toast library or custom component)
                // Example: You might use another context or event emitter to handle this globally
                // Could also update a state variable that a notification component listens to
                alert(`New Crisis Nearby: ${data.message}`); // Simple alert for now
            });

            newSocket.on('assignment_update', (data) => {
                console.log('Assignment status updated:', data);
                // TODO: Update UI related to this assignment (e.g., in a dashboard)
                alert(`Assignment ${data.responseId} status changed to: ${data.status}`);
            });

             newSocket.on('new_rating', (data) => {
                console.log('New rating received:', data);
                alert(`You received a new rating: ${data.rating} stars. Comment: ${data.comment || 'N/A'}`);
                // TODO: Update volunteer profile/dashboard display
            });

            // Add more listeners as needed...

            setSocket(newSocket);

            // Cleanup function to disconnect socket when component unmounts or user logs out
            return () => {
                console.log('Disconnecting socket...');
                newSocket.disconnect();
            };
        } else {
            // If user logs out or was never logged in, ensure socket is null
             if(socket) {
                 socket.disconnect();
                 setSocket(null);
             }
        }
    }, [user]); // Re-run effect if user state changes (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
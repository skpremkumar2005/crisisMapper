const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const volunteerRoutes = require('./routes/volunteers');
const crisisRoutes = require('./routes/crises');
const ratingRoutes = require('./routes/ratings');
// Import error handling middleware if you create one

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS Middleware - Configure as needed for production
app.use(cors()); // Allow all origins for now

// Body Parser Middleware
app.use(express.json()); // To accept JSON data in req.body

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow your frontend URL in production
        methods: ["GET", "POST"]
    }
});

// Make io accessible to controllers (e.g., for emitting events)
// Use app.set('socketio', io); and req.app.get('socketio') in controllers
app.set('socketio', io);

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Example: Join a room based on user ID upon login/connection
    // This requires the frontend to send the user ID after connecting
    socket.on('join_user_room', (userId) => {
        console.log(`User ${userId} joined room ${userId}`);
        socket.join(userId); // User joins a room named after their ID
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    // --- Placeholder for other Socket.IO events ---
    // Example: Listening for location updates from volunteers
    socket.on('volunteer_location_update', (data) => {
         // data = { volunteerId: '...', location: { lat: ..., lng: ... } }
         console.log('Volunteer location update:', data);
         // TODO: Store updated location, maybe broadcast to relevant parties (admins, assigned civilian?)
         // io.to(relevantRoom).emit('volunteer_location', data);
    });

});


// --- API Routes ---
app.get('/', (req, res) => res.send('Crisis Mapper API Running')); // Basic route check

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/crises', crisisRoutes);
app.use('/api/ratings', ratingRoutes);

// TODO: Add Error Handling Middleware (Not Found, General Errors)

const PORT = process.env.PORT || 5001;

// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
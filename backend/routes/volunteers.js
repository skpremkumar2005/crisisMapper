// backend/routes/volunteers.js
const express = require('express');
const {
    getVolunteerProfile,
    getVolunteerAssignments, // Import the new function
    updateVolunteerProfile,
    acceptAssignment,
    completeAssignment,
    failAssignment
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Protect all volunteer routes and ensure only volunteers can access them
router.use(protect, authorize('volunteer')); // Apply middleware to all routes below

// Profile routes
router.route('/profile')
    .get(getVolunteerProfile)   // Get profile details
    .post(updateVolunteerProfile); // Create or Update profile details

// Assignment routes

router.post('/assignments/:responseId/accept',(req,res,next)=>{console.log("ji");  next()}, acceptAssignment); // Route to accept
router.post('/assignments/:responseId/complete', completeAssignment); // Route to complete
router.post('/assignments/:responseId/fail', failAssignment); // Route to fail/reject
router.get('/assignments', getVolunteerAssignments); // Route to get assignments

// Add other potential volunteer-specific routes here

module.exports = router;
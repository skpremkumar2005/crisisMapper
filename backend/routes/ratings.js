const express = require('express');
const { submitRating, getVolunteerRatings } = require('../controllers/ratingController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect); // All rating routes require login

// Submit a new rating (Accessible by Civilians who requested or Admins)
// The authorization logic is inside the controller for this specific case
router.post('/submit', submitRating);

// Get ratings for a specific volunteer (Accessible by Admins or the volunteer themselves - needs controller logic adjustment for self-access)
router.get('/volunteer/:volunteerId', authorize('admin'), getVolunteerRatings); // Example: Admin only for now

module.exports = router;
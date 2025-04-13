const express = require('express');
const {
    getCrisisFeed,
    getCrisisDetails,
    requestHelp,
    assignVolunteer
} = require('../controllers/crisisController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Public route to get the main feed from your existing API
router.get('/feed', getCrisisFeed);

// Routes requiring authentication
router.use(protect);

router.get('/:id', getCrisisDetails); // Get details of a specific crisis

// Civilian requesting help
router.post('/:id/request-help', authorize('civilian'), requestHelp);

// Admin assigning a volunteer
router.post('/:id/assign', authorize('admin'), assignVolunteer);


// TODO: Add routes for filtering crises stored in the local DB (if applicable)
// e.g., router.get('/', getFilteredCrises);

module.exports = router;
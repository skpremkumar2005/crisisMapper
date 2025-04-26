const Rating = require('../models/Rating');
const Response = require('../models/Response');
const VolunteerProfile = require('../models/VolunteerProfile');

// @desc    Submit a rating for a completed response
// @route   POST /api/ratings
// @access  Private (Civilian who requested help, or Admin)
const submitRating = async (req, res) => {
    const { responseId, rating, comment, photoProofUrl ,location,crisis} = req.body;
    const raterUserId = req.user._id;

    try {
        // 1. Find the response to ensure it exists and is completed
        const response = await Response.findById(responseId);
        if (!response) {
            return res.status(404).json({ message: 'Response record not found.' });
        }

        // 2. Check if the response is actually completed
        if (response.status !== 'completed') {
            return res.status(400).json({ message: 'Cannot rate an assignment that is not completed.' });
        }

        // 3. Authorization Check: Ensure the rater is the civilian who requested OR an admin
        // This logic might need adjustment based on your exact workflow
        const isCivilianRequester = response.civilianRequester && response.civilianRequester.toString() === raterUserId.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCivilianRequester && !isAdmin) {
             return res.status(403).json({ message: 'You are not authorized to rate this response.' });
        }

        // 4. Check if a rating already exists for this response by this rater
        const existingRating = await Rating.findOne({ response: responseId, rater: raterUserId });
        if (existingRating) {
            return res.status(400).json({ message: 'You have already submitted a rating for this response.' });
        }

        // 5. Create and save the new rating
        const newRating = new Rating({
            response: responseId,
            rater: raterUserId,
            ratedVolunteer: response.volunteer, // Get volunteer ID from the response record
            rating,
            comment,
            photoProofUrl,
            location,
            crisis
        });

        await newRating.save();

        // 6. (Important but Complex) Update the Volunteer's average rating
        // This should ideally happen in a post-save hook on the Rating model (see Rating.js)
        // or be triggered here. Needs careful implementation.
        // Example (Simplified - potentially inaccurate under load):
        const allRatingsForVolunteer = await Rating.find({ ratedVolunteer: response.volunteer });
        const totalRating = allRatingsForVolunteer.reduce((acc, item) => acc + item.rating, 0);
        const averageRating = totalRating / allRatingsForVolunteer.length;
        await VolunteerProfile.findOneAndUpdate(
            { user: response.volunteer },
            { rating: averageRating.toFixed(1) } // Update average rating
        );

        // 7. TODO: Notify the volunteer they received a rating (via Socket.IO)
         const io = req.app.get('socketio');
         io.to(response.volunteer.toString()).emit('new_rating', {
             rating: newRating.rating,
             comment: newRating.comment,
             crisisId: response.crisis // Optional context
         });

        res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });

    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({ message: 'Server Error while submitting rating.' });
    }
};

// @desc    Get ratings for a specific volunteer
// @route   GET /api/ratings/volunteer/:volunteerId
// @access  Private (Maybe Admin or the Volunteer themselves)
const getVolunteerRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ ratedVolunteer: req.params.volunteerId })
                                    .populate('rater', 'name') // Show rater's name
                                    .populate('response', 'crisis'); // Show related crisis ID

        res.json(ratings);
    } catch (error) {
        console.error("Error fetching volunteer ratings:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = { submitRating, getVolunteerRatings };
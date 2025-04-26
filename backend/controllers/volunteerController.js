const mongoose = require('mongoose'); // Needed for ObjectId validation
const VolunteerProfile = require('../models/VolunteerProfile');
const User = require('../models/User');
const Response = require('../models/Response'); // For assignment logic
const Crisis = require('../models/Crisis'); // Needed for populating

// @desc    Get volunteer profile
// @route   GET /api/volunteers/profile
// @access  Private (Volunteer Only)
const getVolunteerProfile = async (req, res) => {
    try {
        const profile = await VolunteerProfile.findOne({ user: req.user._id })
            .populate('user', 'name email location role createdAt'); // Populate more user fields

        if (!profile) {
            // If no profile, maybe create a default one or return specific message
             console.log(`No profile found for volunteer ${req.user._id}, potentially create one.`);
             // Option: Create a default profile here if desired
             // const defaultProfile = new VolunteerProfile({ user: req.user._id });
             // await defaultProfile.save();
             // return res.status(201).json(defaultProfile); // Return newly created default

            // Option: Return 404
             return res.status(404).json({ message: 'Volunteer profile details not yet created. Update your profile to create it.' });
        }
        res.json(profile);
    } catch (error) {
        console.error(`Error fetching volunteer profile for user ${req.user._id}:`, error);
        res.status(500).json({ message: 'Server Error fetching profile' });
    }
};

// @desc    Get all assignments for the logged-in volunteer
// @route   GET /api/volunteers/assignments
// @access  Private (Volunteer Only)
const getVolunteerAssignments = async (req, res) => {
    try {
        const volunteerId = req.user._id;
        const assignments = await Response.find({ volunteer: volunteerId })
            .populate({
                path: 'crisis', // Populate the crisis field
                select: 'disasterType severityLevel address status post location' // Select specific fields from Crisis model
            })
             // Optionally populate civilian requester info if needed
            // .populate({
            //     path: 'civilianRequester',
            //     select: 'name' // Select only name
            // })
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json(assignments);

    } catch (error) {
        console.error(`Error fetching assignments for volunteer ${req.user._id}:`, error);
        res.status(500).json({ message: 'Server Error fetching assignments' });
    }
};


// @desc    Create or Update volunteer profile
// @route   POST /api/volunteers/profile
// @access  Private (Volunteer Only)
const updateVolunteerProfile = async (req, res) => {
    const { skills, availability /* Add other fields like transportation */ } = req.body;
    const profileFields = {};
    profileFields.user = req.user._id; // Ensure user ID is always linked

    // Process skills: ensure it's an array of non-empty strings
    if (typeof skills === 'string') {
        profileFields.skills = skills.split(',')
                                     .map(skill => skill.trim())
                                     .filter(skill => skill); // Remove empty strings
    } else if (Array.isArray(skills)) {
         profileFields.skills = skills.map(skill => String(skill).trim()) // Ensure strings
                                     .filter(skill => skill);
    }

    // Process availability: ensure it's boolean
    if (availability !== undefined && typeof availability === 'boolean') {
         profileFields.availability = availability;
    }
    // TODO: Add processing for other fields (e.g., transportation)

    try {
        // Use findOneAndUpdate with upsert:true to handle both creation and update
        const updatedProfile = await VolunteerProfile.findOneAndUpdate(
            { user: req.user._id }, // Find criteria
            { $set: profileFields }, // Data to set/update
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true } // Options
        ).populate('user', 'name email location role createdAt'); // Populate user details in response

        if (!updatedProfile) {
             throw new Error("Profile update/creation failed unexpectedly.");
        }

        // --- Emit Profile Update Notification ---
        const io = req.app.get('socketio');
        if (io) {
            const targetRoom = req.user._id.toString();
            const eventName = 'volunteer_profile_update';
            console.log(`Emitting [${eventName}] to room [${targetRoom}] after profile update.`);
            io.to(targetRoom).emit(eventName, {
                 message: "Your profile has been updated.",
                 profile: updatedProfile // Send updated profile data
            });
        }
        // --- End Notification ---

        res.json(updatedProfile); // Return the updated/created profile

    } catch (error) {
        console.error(`Error updating volunteer profile for user ${req.user._id}:`, error);
         // Handle potential validation errors
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server Error updating profile' });
    }
};


// @desc    Accept a crisis assignment
// @route   POST /api/volunteers/assignments/:responseId/accept
// @access  Private (Volunteer Only)

const acceptAssignment = async (req, res) => {
    console.log(1)
    const { responseId } = req.params;
    const volunteerUserId = req.user?._id; // Get user ID safely
    

    // --- LOGGING POINT 9 ---
    console.log(`--- [acceptAssignment] Received request ---`);
    console.log(`[acceptAssignment] Params responseId: ${responseId}`);
    console.log(`[acceptAssignment] Requesting user ID: ${volunteerUserId}`);

     if (!mongoose.Types.ObjectId.isValid(responseId)) {
        console.log('[acceptAssignment] Error: Invalid Response ID format.');
        return res.status(400).json({ message: 'Invalid Response ID format.' });
     }
     if (!volunteerUserId) {
        console.error('[acceptAssignment] Error: Volunteer User ID not found in request. Is middleware working?');
        return res.status(401).json({ message: 'Not authorized (user not found).' });
     }

    try {
        console.log(`[acceptAssignment] Finding Response with ID: ${responseId}`);
        const response = await Response.findById(responseId).populate('crisis', 'disasterType civilianRequester'); // Populate necessary fields

        // --- LOGGING POINT 10 ---
        console.log('[acceptAssignment] Found response record:', response ? response.toObject() : 'null');

        if (!response) {
            console.log('[acceptAssignment] Error: Response not found.');
            return res.status(404).json({ message: 'Assignment (Response) not found' });
        }

        // Check ownership
        const isOwner = response.volunteer?.toString() === volunteerUserId.toString();
        // --- LOGGING POINT 11 ---
        console.log(`[acceptAssignment] Ownership check: ${isOwner} (ResponseVol: ${response.volunteer}, User: ${volunteerUserId})`);
        if (!isOwner) {
             console.log('[acceptAssignment] Error: User is not owner.');
            return res.status(403).json({ message: 'Not authorized to accept this assignment' });
        }

        // Check status
        const canAccept = response.status === 'notified';
        // --- LOGGING POINT 12 ---
        console.log(`[acceptAssignment] Status check (should be 'notified'): ${canAccept} (Actual status: ${response.status})`);
        if (!canAccept) {
             console.log(`[acceptAssignment] Error: Cannot accept assignment with status ${response.status}.`);
             return res.status(400).json({ message: `Cannot accept assignment with status: ${response.status}` });
        }

        // Update response
        response.status = 'accepted';
        response.acceptedAt = Date.now();

        // --- LOGGING POINT 13 ---
        console.log('[acceptAssignment] Attempting to save updated response:', response.toObject());
        const updatedResponse = await response.save();
        console.log('[acceptAssignment] Response saved successfully.');

        // Emit Notifications (Example - ensure io is available)
        const io = req.app.get('socketio');
        if (io) {
             // --- LOGGING POINT 14 ---
             console.log(`[acceptAssignment] Emitting socket notifications for response ${updatedResponse._id}`);
             const volunteerRoom = volunteerUserId.toString();
             io.to(volunteerRoom).emit('assignment_update', { /* ... data ... */ });
             if (response.crisis?.civilianRequester) {
                 const civilianRoom = response.crisis.civilianRequester.toString();
                 io.to(civilianRoom).emit('volunteer_accepted', { /* ... data ... */ });
             }
        } else {
             console.warn("[acceptAssignment] Socket.IO instance not found. Skipping notifications.");
        }

        // --- LOGGING POINT 15 ---
        const jsonResponse = { message: 'Assignment accepted successfully', response: updatedResponse };
        console.log('[acceptAssignment] Sending success response:', jsonResponse);
        res.json(jsonResponse);

    } catch (error) {
        // --- LOGGING POINT 16 ---
        console.error(`[acceptAssignment] CRITICAL ERROR for response ${responseId} by volunteer ${volunteerUserId}:`, error);
        res.status(500).json({ message: 'Server Error accepting assignment' });
    }
};

// @desc    Complete a crisis assignment
// @route   POST /api/volunteers/assignments/:responseId/complete
// @access  Private (Volunteer Only)
const completeAssignment = async (req, res) => {
     const { responseId } = req.params;
     const volunteerUserId = req.user._id;
     // Optional: Get completion notes/details from req.body if needed
     // const { completionNotes } = req.body;

     if (!mongoose.Types.ObjectId.isValid(responseId)) {
        return res.status(400).json({ message: 'Invalid Response ID format.' });
     }

    try {
        const response = await Response.findById(responseId).populate('crisis', 'disasterType civilianRequester');

        if (!response) {
            return res.status(404).json({ message: 'Assignment (Response) not found' });
        }
        if (response.volunteer.toString() !== volunteerUserId.toString()) {
            return res.status(403).json({ message: 'Not authorized to complete this assignment' });
        }

        // Check status - can complete if accepted, en_route, arrived
        const completableStatuses = ['accepted', 'en_route', 'arrived'];
        if (!completableStatuses.includes(response.status)) {
             return res.status(400).json({ message: `Cannot complete assignment with status: ${response.status}.` });
        }

        // Update Response
        response.status = 'completed';
        response.completedAt = Date.now();
        // if (completionNotes) response.notes = completionNotes; // Example field
        const updatedResponse = await response.save();

        // Update Volunteer Profile Stats
         const updatedProfile = await VolunteerProfile.findOneAndUpdate(
             { user: volunteerUserId },
             { $inc: { completedTasks: 1 } }, // Increment completed tasks count
             { new: true } // Return updated profile if needed later
         );
         console.log(`Incremented completedTasks for volunteer ${volunteerUserId}. New count: ${updatedProfile?.completedTasks}`);


         // --- Emit Notifications ---
         const io = req.app.get('socketio');
         if (io) {
             // Notify volunteer (confirmation)
             const volunteerRoom = volunteerUserId.toString();
             io.to(volunteerRoom).emit('assignment_update', {
                message: `Assignment marked as completed!`,
                responseId: updatedResponse._id,
                status: updatedResponse.status,
                crisisId: response.crisis?._id
             });

             // Notify civilian (task done, trigger rating?)
             if (response.crisis?.civilianRequester) {
                 const civilianRoom = response.crisis.civilianRequester.toString();
                 io.to(civilianRoom).emit('task_completed', { // Specific event
                     message: `The volunteer has completed the task for ${response.crisis?.disasterType}. You can now rate their performance.`,
                     responseId: updatedResponse._id, // Needed for rating link
                     crisisId: response.crisis._id
                 });
             }
         }
         // --- End Notifications ---

        res.json({ message: 'Assignment marked as completed successfully', response: updatedResponse });
    } catch (error) {
        console.error(`Error completing assignment ${responseId} by volunteer ${volunteerUserId}:`, error);
        res.status(500).json({ message: 'Server Error completing assignment' });
    }
};

// @desc    Fail/Reject a crisis assignment
// @route   POST /api/volunteers/assignments/:responseId/fail
// @access  Private (Volunteer Only)
const failAssignment = async (req, res) => {
     const { responseId } = req.params;
     const volunteerUserId = req.user._id;
     const { reason } = req.body; // Reason is required

     if (!mongoose.Types.ObjectId.isValid(responseId)) {
        return res.status(400).json({ message: 'Invalid Response ID format.' });
     }
     if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
         return res.status(400).json({ message: 'A reason is required when failing/rejecting an assignment.' });
     }

    try {
        const response = await Response.findById(responseId).populate('crisis', 'disasterType civilianRequester');

        if (!response) {
            return res.status(404).json({ message: 'Assignment (Response) not found' });
        }
        if (response.volunteer.toString() !== volunteerUserId.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this assignment' });
        }

        // Check status - cannot fail completed or already failed/rejected task
        const modifiableStatuses = ['notified', 'accepted', 'en_route', 'arrived'];
        if (!modifiableStatuses.includes(response.status)) {
             return res.status(400).json({ message: `Cannot fail/reject assignment with status: ${response.status}.` });
        }

        const previousStatus = response.status; // Store previous status for logic/notification

        // Update Response
        response.status = 'failed'; // Using 'failed' for both rejection and mid-task failure
        response.failedReason = reason.trim();
        // Clear acceptance/completion times if failing after acceptance
        response.acceptedAt = undefined;
        response.completedAt = undefined;

        const updatedResponse = await response.save();

        // Update Volunteer Profile Stats
        const updatedProfile = await VolunteerProfile.findOneAndUpdate(
             { user: volunteerUserId },
             { $inc: { failedTasks: 1 } }, // Increment failed tasks count
             { new: true }
         );
         console.log(`Incremented failedTasks for volunteer ${volunteerUserId}. New count: ${updatedProfile?.failedTasks}`);
         // TODO: Implement penalty logic if needed based on profile.failedTasks

         // --- Emit Notifications ---
         const io = req.app.get('socketio');
         if (io) {
            // Notify volunteer (confirmation)
            const volunteerRoom = volunteerUserId.toString();
            io.to(volunteerRoom).emit('assignment_update', {
               message: `Assignment marked as failed/rejected. Reason: ${reason}`,
               responseId: updatedResponse._id,
               status: updatedResponse.status,
               crisisId: response.crisis?._id
            });

            // Notify civilian (task failed)
             if (response.crisis?.civilianRequester) {
                 const civilianRoom = response.crisis.civilianRequester.toString();
                 // Send different message based on whether it was rejected outright or failed mid-task
                 const failureMessage = previousStatus === 'notified'
                    ? `Your request for ${response.crisis?.disasterType} could not be accepted by the volunteer. Reason: ${reason}`
                    : `The volunteer encountered an issue and could not complete the task for ${response.crisis?.disasterType}. Reason: ${reason}`;

                 io.to(civilianRoom).emit('task_failed', { // Specific event
                     message: failureMessage,
                     responseId: updatedResponse._id,
                     crisisId: response.crisis._id
                 });
             }
            // TODO: Potentially notify admins or trigger re-assignment logic here
             console.warn(`Assignment ${responseId} failed by volunteer ${volunteerUserId}. Reason: ${reason}. Consider re-assignment.`);
         }
         // --- End Notifications ---


        res.json({ message: 'Assignment marked as failed/rejected successfully', response: updatedResponse });
    } catch (error) {
        console.error(`Error failing/rejecting assignment ${responseId} by volunteer ${volunteerUserId}:`, error);
        res.status(500).json({ message: 'Server Error processing assignment failure/rejection' });
    }
};


module.exports = {
    getVolunteerProfile,
    getVolunteerAssignments, // Add the new function
    updateVolunteerProfile,
    acceptAssignment,
    completeAssignment,
    failAssignment
};
const axios = require('axios');
const Crisis = require('../models/Crisis'); // If storing locally
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const Response = require('../models/Response');
const mongoose = require('mongoose'); // May need ObjectId if not already imported

require('dotenv').config();

// @desc    Fetch crisis data from the existing API
// @route   GET /api/crises/feed
// @access  Public (or Private depending on your needs)
const getCrisisFeed = async (req, res) => {
    try {
        const response = await Crisis.find();
  
        // TODO: Potentially process/filter/store this data before sending to frontend
        // For now, just proxy it
        res.json(response);
    } catch (error) {
        console.error('Error fetching from existing API:', error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
            console.error("Headers:", error.response.headers);
            res.status(error.response.status).json({ message: 'Error fetching data from source API', details: error.response.data });
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Request:", error.request);
            res.status(504).json({ message: 'No response received from source API' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
            res.status(500).json({ message: 'Failed to fetch crisis feed', error: error.message });
        }
    }
};

// @desc    Get details for a specific crisis (assuming stored locally)
// @route   GET /api/crises/:id
// @access  Private
const getCrisisDetails = async (req, res) => {
    try {
        const crisis = await Crisis.findById(req.params.id); //.populate('assignedVolunteer', 'name email'); // Populate if needed

        if (!crisis) {
            return res.status(404).json({ message: 'Crisis not found' });
        }
        res.json(crisis);
    } catch (error) {
        console.error("Error getting crisis details:", error);
        // Handle potential CastError if ID format is invalid
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Crisis ID format' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Civilian requests help for a specific crisis (Placeholder)
// @route   POST /api/crises/:id/request-help
// @access  Private (Civilian Only)
const requestHelp = async (req, res) => {
    const crisisId = req.params.id;
    const civilianUserId = req.user._id; // From auth middleware

    // Validate input ID format early
    if (!mongoose.Types.ObjectId.isValid(crisisId)) {
        return res.status(400).json({ message: 'Invalid Crisis ID format.' });
    }

    try {
        // 1. Validate the crisis exists
        const crisis = await Crisis.findById(crisisId);
       
        if (!crisis) {
            console.error(`requestHelp failed: Crisis with ID ${crisisId} not found.`);
            return res.status(404).json({ message: 'Crisis not found' });
        }

        // Add check: Ensure crisis is in a state where help can be requested
        const helpRequestableStatuses = ['new', 'verified', 'notifications_sent']; // Define statuses where help is okay
        if (!helpRequestableStatuses.includes(crisis.status)) {
            console.warn(`requestHelp attempt on crisis ${crisisId} with status ${crisis.status}.`);
            // Maybe allow if assigned but no one accepted yet? Depends on workflow.
            return res.status(400).json({ message: `Help cannot be requested for this crisis (current status: ${crisis.status}).` });
        }


        // 2. Find ALL users with the role 'volunteer'
        console.log("Finding all volunteers...");
      // Step 1: Get volunteers with availability = true and select 'user' field
        let volunteerUsers = await VolunteerProfile.find({ availability: true }).select('user');
        // console.log(volunteerUsers)
        // Step 2: Extract only the user IDs
        const userIds = volunteerUsers.map(volunteer => volunteer.user);
        
        // Step 3: Find users by their IDs
        const allVolunteers = await User.find({ _id: { $in:  userIds} }).select('_id name');
    


        if (!allVolunteers || allVolunteers.length === 0) {
            console.warn(`requestHelp: No registered volunteers found in the system for crisis ${crisisId}`);
            return res.status(404).json({ message: 'There are currently no registered volunteers.' });
        }
        console.log(`Found ${allVolunteers.length} volunteers.`);

        // 3. Get Socket.IO instance
        const io = req.app.get('socketio');
        if (!io) {
            console.error("requestHelp failed: Socket.IO instance not found on app object.");
            return res.status(500).json({ message: 'Internal server error (Socket configuration).' });
        }

        // 4. Process each volunteer: Create Response record (if needed) & send notification
        let notificationCount = 0;
        const responseProcessingPromises = allVolunteers.map(async (volunteer) => {
            try {
                // Check if a Response record already exists for this pairing
                const existingResponse = await Response.findOne({
                    crisis: crisisId,
                    volunteer: volunteer._id
                });

                let responseToSend = existingResponse; // Use existing if found

                if (!existingResponse) {
                    // If no existing response, create a new one
                    const newResponse = new Response({
                        crisis: crisisId,
                        volunteer: volunteer._id,
                        civilianRequester: civilianUserId,
                        status: 'notified', // Status indicates notification attempt
                    });
                    await newResponse.save();
                    responseToSend = newResponse; // Use the newly created one
                    console.log(`Created new Response record for volunteer ${volunteer._id} and crisis ${crisisId}`);
                } else {
                    // Optional: If response exists, maybe update timestamp or ensure status is 'notified'?
                    // For now, we just use the existing one and re-notify (or you could skip emit below)
                    console.log(`Response record already exists for volunteer ${volunteer._id} and crisis ${crisisId}. Re-notifying.`);
                }

                // Ensure we have a valid response object before emitting
                if (!responseToSend) {
                    console.warn(`Could not find or create Response object for volunteer ${volunteer._id}. Skipping notification.`);
                    return null;
                }

                // Emit notification to the specific volunteer's room
                const targetRoom = volunteer._id.toString();
                const eventName = 'new_assignment_notification';
                const eventData = {
                    message: `New crisis requires assistance! (${crisis.DisasterType || 'Unknown Type'})`,
                    crisisId: crisisId,
                    crisisType: crisis.DisasterType,
                    crisisSeverity: crisis.severityLevel, // Send severity too
                    responseId: responseToSend._id // Use the ID of the found/created response
                };
                // console.log(crisis["Disaster Type"] )
                
                console.log(`Notifying volunteer ${targetRoom} (${volunteer.name || 'N/A'}) for crisis ${crisisId}. Event: ${eventName}`);
                io.to(targetRoom).emit(eventName, eventData);
                notificationCount++; // Increment count as notification was sent
                return responseToSend; // Return the relevant response document

            } catch (individualError) {
                // Log error for specific volunteer processing but continue with others
                console.error(`Error processing notification for volunteer ${volunteer._id} (Name: ${volunteer.name || 'N/A'}):`, individualError);
                return null; // Indicate failure for this volunteer
            }
        });

        // Wait for all processing (DB operations and emits)
        await Promise.all(responseProcessingPromises);

        // Optional: Update crisis status after sending notifications?
        // crisis.status = 'notifications_sent';
        // await crisis.save();

        console.log(`Notifications sent to ${notificationCount} volunteers for crisis ${crisisId}.`);
        // Send success response back to the requesting civilian
        res.status(200).json({ message: `Help request sent. ${notificationCount} volunteers have been notified.` });

    } catch (error) {
        // Catch errors from initial Crisis.findById or other general errors
        console.error("Error in requestHelp function:", error);
        res.status(500).json({ message: 'Server Error while processing help request.' });
    }
};

// Placeholder for Admin actions, e.g., manually assigning a crisis
// @desc    Admin assigns a volunteer to a crisis
// @route   POST /api/crises/:id/assign
// @access  Private (Admin Only)
const assignVolunteer = async (req, res) => {
    const { volunteerId } = req.body;
    const crisisId = req.params.id;
    const adminUserId = req.user._id; // ID of the admin performing the action

    // 1. Validate inputs
    if (!volunteerId || !crisisId) {
        return res.status(400).json({ message: 'Both crisisId and volunteerId are required in the request.' });
    }

    // Optional: Validate if IDs are valid MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(crisisId) || !mongoose.Types.ObjectId.isValid(volunteerId)) {
        return res.status(400).json({ message: 'Invalid Crisis ID or Volunteer ID format.' });
    }

    try {
        // 2. Find Crisis and Volunteer User concurrently
        const [crisis, volunteerUser] = await Promise.all([
            Crisis.findById(crisisId),
            User.findById(volunteerId)
        ]);

        // --- Validation Checks ---
        if (!crisis) {
            return res.status(404).json({ message: `Crisis not found with ID: ${crisisId}` });
        }
        if (!volunteerUser) {
            return res.status(404).json({ message: `Volunteer user not found with ID: ${volunteerId}` });
        }
        if (volunteerUser.role !== 'volunteer') {
            return res.status(400).json({ message: `User ${volunteerUser.name || volunteerId} is not registered as a volunteer.` });
        }

        // 3. Check if crisis is assignable (e.g., not already resolved/closed)
        const assignableStatuses = ['new', 'verified', 'notifications_sent', 'assigned']; // Allow reassignment
        if (!assignableStatuses.includes(crisis.status)) {
            return res.status(400).json({ message: `Crisis cannot be assigned (current status: ${crisis.status}).` });
        }

        // Optional: Check if volunteer is marked as available (admin might override, just log warning)
        // const volunteerProfile = await VolunteerProfile.findOne({ user: volunteerId });
        // if (volunteerProfile && !volunteerProfile.availability) {
        //     console.warn(`Admin ${adminUserId} is assigning crisis ${crisisId} to volunteer ${volunteerId} who is marked as unavailable.`);
        // }

        // Check if already assigned to this same volunteer
        if (crisis.assignedVolunteer && crisis.assignedVolunteer.toString() === volunteerId.toString() && crisis.status === 'assigned') {
             return res.status(400).json({ message: `Volunteer ${volunteerUser.name} is already assigned to this crisis.` });
        }

        // --- Create/Update Response Record ---
        // Find existing response or create a new one if admin assigns directly
        const responseUpdate = {
            status: 'accepted', // Treat admin assignment as implicitly accepted by volunteer system-wise
            acceptedAt: Date.now(),
            // You could potentially add a field like 'assignedByAdmin: adminUserId' for auditing
        };
        const updatedResponse = await Response.findOneAndUpdate(
            { crisis: crisisId, volunteer: volunteerId }, // Find criteria
            { $set: responseUpdate }, // Data to set/update
            { new: true, upsert: true, setDefaultsOnInsert: true } // Options: return updated doc, create if not found, apply schema defaults on insert
        );

        if (!updatedResponse) {
             // Should not happen with upsert:true unless DB error
            throw new Error("Failed to create or update response record.");
        }

        // --- Update Crisis Status ---
        const previousAssignee = crisis.assignedVolunteer; // Store previous assignee if any
        crisis.status = 'assigned';
        crisis.assignedVolunteer = volunteerId;
        await crisis.save();

        // --- Notify Assigned Volunteer ---
        const io = req.app.get('socketio');
        if (io) {
            const targetRoom = volunteerId.toString();
            const eventName = 'new_assignment_notification'; // Reusing the notification event
            const eventData = {
                message: `An Administrator has assigned you to a crisis.`,
                crisisId: crisisId,
                crisisType: crisis.DisasterType,
                responseId: updatedResponse._id // Pass the response ID for potential actions
            };
            console.log(`Notifying volunteer ${targetRoom} about manual assignment by admin ${adminUserId} (Crisis: ${crisisId})`);
            io.to(targetRoom).emit(eventName, eventData);

            // Optional: Notify previously assigned volunteer if reassigned
            if (previousAssignee && previousAssignee.toString() !== volunteerId.toString()) {
                const previousTargetRoom = previousAssignee.toString();
                 console.log(`Notifying previous volunteer ${previousTargetRoom} about reassignment (Crisis: ${crisisId})`);
                 io.to(previousTargetRoom).emit('assignment_update', { // Use a generic update event
                     message: `Your assignment for crisis ${crisis.DisasterType} (ID: ${crisisId.toString().slice(-6)}) has been reassigned by an admin.`,
                     responseId: updatedResponse._id, // Maybe find the *old* responseId? Might need adjustment.
                     status: 'reassigned' // Custom status or simply 'cancelled'
                 });
            }

        } else {
            console.error("AssignVolunteer Warning: Socket.IO instance not found. Cannot notify volunteer(s).");
            // Assignment completed, but notification failed. Might need manual follow-up.
        }

        // --- Success Response ---
        console.log(`Admin ${adminUserId} successfully assigned volunteer ${volunteerId} to crisis ${crisisId}`);
        res.status(200).json({
            message: `Volunteer ${volunteerUser.name} successfully assigned to crisis.`,
            crisis: crisis, // Send back the updated crisis object
            response: updatedResponse // Send back the created/updated response object
        });

    } catch (error) {
        console.error(`Error assigning volunteer ${volunteerId} to crisis ${crisisId} by admin ${adminUserId}:`, error);
        res.status(500).json({ message: 'Server error during assignment process.' });
    }
};


module.exports = {
    getCrisisFeed,
    getCrisisDetails,
    requestHelp,
    assignVolunteer,
    // Add functions for filtering crises (based on type, location, severity from DB if stored)
};
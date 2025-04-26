const mongoose = require('mongoose');

const VolunteerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String }],
  availability: { type: Boolean, default: false }, // Simple availability flag
  // Add more fields: transportation, equipment, etc.
  rating: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  failedTasks: { type: Number, default: 0 },
  // Consider storing location here too if it differs from User base location
});

module.exports = mongoose.model('VolunteerProfile', VolunteerProfileSchema);
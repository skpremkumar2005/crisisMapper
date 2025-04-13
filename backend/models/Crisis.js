const mongoose = require('mongoose');

// Example Schema if you want to store crisis data from your API locally
// Adjust fields based on the EXACT structure of localhost:3040/api response
const CrisisSchema = new mongoose.Schema({
  // originalId: { type: String, required: true, }, 
  userName: { type: String },
  post: { type: String },
  location: {
    type: { type: String,  },
    coordinates: { type: [Number], required: true, index: '2dsphere' } // [longitude, latitude]
  },
  address: { type: String }, // Store resolved address if available
  date: { type: Date },
  time: { type: String }, // Consider storing as part of Date
  disasterType: { type: String },
  sentiment: { type: String },
  language: { type: String },
  severityLevel: { type: Number, min: 1, max: 5 }, // Example levels
  mediaAttached: [{ type: String }], // URLs
  keywords: [{ type: String }],
  status: { type: String, enum: ['new', 'assigned', 'resolved', 'closed'], default: 'new' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: "none" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Crisis', CrisisSchema);
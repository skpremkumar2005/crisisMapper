const mongoose = require('mongoose');



const RatingSchema = new mongoose.Schema({
  response: { type: mongoose.Schema.Types.ObjectId, ref: 'Response', required: true },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  photoProofUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  location:{type:String},
  // Add these fields
  crisis: { type: mongoose.Schema.Types.ObjectId, ref: 'Crisis' }, // or whatever your Crisis model is called
  // volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


// Optional: Middleware to update volunteer's average rating after save
RatingSchema.post('save', async function(doc) {
  // Calculate and update average rating on VolunteerProfile
  // This requires careful implementation to avoid race conditions and ensure accuracy
  console.log(`Rating saved for volunteer ${doc.ratedVolunteer}. Need to update average.`);
  // Add logic here to find VolunteerProfile and update average rating
});


module.exports = mongoose.model('Rating', RatingSchema);
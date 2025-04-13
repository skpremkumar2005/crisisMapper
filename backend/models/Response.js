const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  crisis: { type: mongoose.Schema.Types.ObjectId, ref: 'Crisis', required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  civilianRequester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If initiated by civilian request
  status: {
    type: String,
    enum: ['notified', 'accepted', 'rejected', 'en_route', 'arrived', 'completed', 'failed'],
    default: 'notified',
  },
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  failedReason: { type: String }, // If status is 'failed'
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Response', ResponseSchema);
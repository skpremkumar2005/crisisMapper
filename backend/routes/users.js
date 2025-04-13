const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/authController'); // Re-using from authController for simplicity
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/profile').get(getUserProfile).put(updateUserProfile);
router.get('/all',async(req,res)=>{
    res.json( await User.find())
})
module.exports = router;
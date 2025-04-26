const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/authController'); // Re-using from authController for simplicity
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { default: resquestasked } = require('../controllers/usercontroller');
const Response = require('../models/Response');
const router = express.Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/profile').get(getUserProfile).put(updateUserProfile);
router.get('/all',async(req,res)=>{
    res.json( await User.find())
})
router.get('/helps',protect,async(req,res)=>{
    try{
        // console.log(1)
        // console.log(req.user)
        // const user=await User.findById(req.user.id);
        // if(!user)return res.status(400).json("user not found");
        const help=await Response.find({ civilianRequester:req.user._id }).populate({
            path: 'crisis', // Populate the crisis field
            select: 'disasterType severityLevel address status post location' // Select specific fields from Crisis model
        }) .populate({
            path: 'volunteer', // Populate the crisis field
            // select: 'disasterType severityLevel address status post location' // Select specific fields from Crisis model
        })
        // const h=help.civilianRequester.include(user._id);
        res.status(200).json(help);
    }
    catch(e){
        res.status(500).json("server error");
    }
});
router.get('/responses/:id',protect,async(req,res)=>{
    try{
         console.log(req.params)
        // const user=await User.findById(req.user.id);
        // if(!user)return res.status(400).json("user not found");
        const help=await Response.findById(req.params.id).populate({
            path: 'crisis', // Populate the crisis field
            select: 'disasterType severityLevel address status post location' // Select specific fields from Crisis model
        }) .populate({
            path: 'volunteer', // Populate the crisis field
            // select: 'disasterType severityLevel address status post location' // Select specific fields from Crisis model
        })
        // const h=help.civilianRequester.include(user._id);
        res.status(200).json(help);
    }
    catch(e){
        res.status(500).json("server error");
    }
});
module.exports = router;
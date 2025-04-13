const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile'); // Import VolunteerProfile
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, location } = req.body; // Include role and location

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'civilian', // Default to civilian if not provided
      location // Store location if provided during registration
    });

    // If the user is a volunteer, create a basic profile
    if (user.role === 'volunteer') {
      await VolunteerProfile.create({ user: user._id });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server Error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    // req.user is set by the 'protect' middleware
    const user = await User.findById(req.user._id).select('-password'); // Exclude password

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
            createdAt: user.createdAt
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile (e.g., name, location)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email; // Be cautious allowing email changes
        if (req.body.password) {
            // Ensure password hashing middleware runs if password changes
            user.password = req.body.password;
        }
        // Update location if provided
        if (req.body.location && req.body.location.coordinates) {
             user.location = {
                type: 'Point',
                coordinates: req.body.location.coordinates // Expect [longitude, latitude]
             }
        }

        try {
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                location: updatedUser.location,
                token: generateToken(updatedUser._id), // Optionally issue a new token if needed
            });
        } catch (error) {
            console.error("Profile Update Error:", error);
            // Handle potential duplicate email error if email was changed
            if (error.code === 11000) {
                 return res.status(400).json({ message: 'Email already in use.' });
            }
            res.status(500).json({ message: 'Error updating profile' });
        }

    } else {
        res.status(404).json({ message: 'User not found' });
    }
};


module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
/**
 * @file authController.js
 * @description Controllers managing authorization actions (registering users, logging in, retrieving authenticated profiles).
 */

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (ADMIN or TEACHER)
 * @route   POST /api/auth/register
 * @access  Public (Open for bootstrapping/testing. Can be restricted to ADMIN only in production)
 */
const registerUser = async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    // 1. Check if all required fields are provided
    if (!fullName || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all required fields (fullName, email, password)');
    }

    // 2. Check if user already exists in the database
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address');
    }

    // 3. Prevent arbitrary role injection if desired, or validate input role
    const assignedRole = role && ['ADMIN', 'TEACHER'].includes(role.toUpperCase()) 
      ? role.toUpperCase() 
      : 'TEACHER'; // Defaults to TEACHER if invalid or not specified

    // 4. Create new user (password is hashed automatically in User schema pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role: assignedRole,
    });

    if (user) {
      // 5. Send success response including JWT
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role),
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data received');
    }
  } catch (error) {
    next(error); // Forward error to central error handler middleware
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Check for email and password
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    // 2. Locate user and explicitly select password (since select: false is on in Schema)
    const user = await User.findOne({ email }).select('+password');

    // 3. Verify user exists and passwords match
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role),
        },
      });
    } else {
      // Return 401 Unauthorized for security obfuscation (vague error message for bad credentials)
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    // req.user has already been resolved and attached by the protect middleware
    if (!req.user) {
      res.status(404);
      throw new Error('User profile not found');
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};

/**
 * @file authRoutes.js
 * @description Express routing paths for authentication controllers.
 * Maps endpoints to logical business actions.
 */

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public route to register a new user
router.post('/register', registerUser);

// Public route to authenticate user credentials
router.post('/login', loginUser);

// Private route to get currently authenticated user details
router.get('/me', protect, getUserProfile);

module.exports = router;

/**
 * @file authMiddleware.js
 * @description Authentication middleware that verifies if incoming requests carry a valid JSON Web Token.
 * Places the verified user object on the request as `req.user`.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes from unauthenticated access.
 * Checks for a Bearer token in the Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header is present and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Decode token payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user profile from database excluding password and assign it to req.user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user no longer exists',
        });
      }

      // Proceed to the next middleware or route controller
      next();
    } catch (error) {
      console.error(`[Auth Middleware Error] ${error.message}`);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed',
      });
    }
  }

  // If no token was found
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };

/**
 * @file roleMiddleware.js
 * @description Authorization middleware to enforce Role-Based Access Control (RBAC).
 * Restricts access to routes depending on the authenticated user's role.
 */

/**
 * Restricts access to specified roles.
 * Must be used AFTER the `protect` middleware as it relies on `req.user`.
 * @param {...string} roles - The list of roles allowed to access the endpoint (e.g. 'ADMIN', 'TEACHER').
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user object is present (meaning they went through protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, login session missing',
      });
    }

    // Check if the user's role matches any of the authorized roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    // Role is valid, proceed
    next();
  };
};

module.exports = { authorize };

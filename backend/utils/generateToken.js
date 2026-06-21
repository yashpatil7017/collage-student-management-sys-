/**
 * @file generateToken.js
 * @description Helper utility to sign and issue JSON Web Tokens (JWT) for authenticated users.
 * Packs user ID and role details into the cryptographically secure token payload.
 */

const jwt = require('jsonwebtoken');

/**
 * Signs and generates a JSON Web Token.
 * @param {string} id - The MongoDB user ID.
 * @param {string} role - The role of the user (ADMIN or TEACHER).
 * @returns {string} The signed JWT string.
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d', // Token remains valid for 30 days
    }
  );
};

module.exports = generateToken;

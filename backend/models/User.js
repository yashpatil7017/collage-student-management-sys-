/**
 * @file User.js
 * @description Mongoose schema definition and model for the User entity.
 * Handles data properties, roles (ADMIN, TEACHER), password encryption via bcryptjs,
 * and profile identification utilities.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents returning password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['ADMIN', 'TEACHER'],
        message: '{VALUE} is not a valid role. Allowed roles are ADMIN and TEACHER.',
      },
      default: 'TEACHER',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

/**
 * Pre-save Middleware Hook.
 * Encrypts the password field using bcryptjs before saving,
 * but only if the password field is modified or newly created.
 */
userSchema.pre('save', async function (next) {
  // If the password is not modified, skip hashing and move to next middleware
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Custom Instance Method.
 * Compares an entered candidate password with the hashed password stored in the database.
 * @param {string} enteredPassword - The plain text password entered by the user.
 * @returns {Promise<boolean>} True if password matches, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

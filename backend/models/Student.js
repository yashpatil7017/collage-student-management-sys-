/**
 * @file Student.js
 * @description Mongoose schema definition and model for the Student entity.
 * Supports fields: name, rollNumber, department, year, email, phone, address,
 * and tracks the administrator who created the student record.
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the student\'s full name'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide a unique roll number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Please specify the student\'s department (e.g. Computer Science, Mechanical)'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Please specify the student\'s current academic year (e.g., 1, 2, 3, 4)'],
      min: [1, 'Academic year cannot be less than 1'],
      max: [5, 'Academic year cannot exceed 5'],
    },
    email: {
      type: String,
      required: [true, 'Please provide a unique student email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact number'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide the student\'s residential address'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student must be linked to the creator (Admin)'],
    },
  },
  {
    timestamps: true, // Auto manages createdAt and updatedAt fields
  }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;

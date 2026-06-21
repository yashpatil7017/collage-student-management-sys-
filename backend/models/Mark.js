/**
 * @file Mark.js
 * @description Mongoose schema definition and model for the Marks entity.
 * Details properties such as studentId (reference to Student), subject, marksObtained,
 * maxMarks, semester, and tracks the user (ADMIN/TEACHER) who logged the marks.
 */

const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide the student ID reference'],
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject (e.g. Mathematics, Physics)'],
      trim: true,
    },
    marksObtained: {
      type: Number,
      required: [true, 'Please specify the marks obtained by the student'],
      min: [0, 'Marks obtained cannot be less than 0'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Please specify the maximum marks for this subject'],
      min: [1, 'Maximum marks must be at least 1'],
    },
    semester: {
      type: Number,
      required: [true, 'Please specify the semester (e.g. 1, 2, 3, 4)'],
      min: [1, 'Semester cannot be less than 1'],
      max: [8, 'Semester cannot exceed 8'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marks must be linked to the creator (Teacher or Admin)'],
    },
  },
  {
    timestamps: true, // Auto manages createdAt and updatedAt fields
  }
);

// Validation validation hook (ensure marksObtained doesn't exceed maxMarks)
markSchema.pre('save', function (next) {
  if (this.marksObtained > this.maxMarks) {
    const err = new Error(`Validation Error: Marks obtained (${this.marksObtained}) cannot exceed maximum marks (${this.maxMarks})`);
    return next(err);
  }
  next();
});

const Mark = mongoose.model('Mark', markSchema);

module.exports = Mark;

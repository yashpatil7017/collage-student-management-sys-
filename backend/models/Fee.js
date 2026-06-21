/**
 * @file Fee.js
 * @description Mongoose schema definition and model for the Fee entity.
 * Details properties such as studentId (reference to Student), totalAmount, paidAmount,
 * dueAmount, paymentStatus, paymentDates, and a nested paymentHistory array.
 * Automatically computes balances and status using pre-save middleware hooks.
 */

const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Please specify the transaction payment amount'],
    min: [1, 'Payment amount must be at least 1'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ['CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER'],
    default: 'ONLINE',
  },
});

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide the student ID reference'],
      unique: true, // Ensuring each student has a single fee profile
    },
    totalAmount: {
      type: Number,
      required: [true, 'Please specify the total fee amount'],
      min: [0, 'Total fee amount cannot be less than 0'],
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'],
      default: 'UNPAID',
    },
    paymentHistory: [paymentHistorySchema],
    paymentDates: [
      {
        type: Date,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Fee record must be linked to the creator (Admin)'],
    },
  },
  {
    timestamps: true, // Auto manages createdAt and updatedAt fields
  }
);

/**
 * Pre-save Middleware Hook.
 * Automatically calculates paidAmount, dueAmount, paymentStatus, and paymentDates
 * before saving document to MongoDB.
 */
feeSchema.pre('save', function (next) {
  // 1. Calculate paidAmount by summing all recorded transactions in history
  this.paidAmount = this.paymentHistory.reduce((sum, item) => sum + item.amount, 0);

  // 2. Ensure paidAmount does not exceed the total fee amount
  if (this.paidAmount > this.totalAmount) {
    const err = new Error(
      `Validation Error: Accumulated payments (${this.paidAmount}) cannot exceed the total fee amount (${this.totalAmount})`
    );
    return next(err);
  }

  // 3. Compute remaining due amount
  this.dueAmount = this.totalAmount - this.paidAmount;

  // 4. Automatically set payment status based on balances
  if (this.paidAmount === 0) {
    this.paymentStatus = 'UNPAID';
  } else if (this.paidAmount === this.totalAmount) {
    this.paymentStatus = 'PAID';
  } else {
    this.paymentStatus = 'PARTIALLY_PAID';
  }

  // 5. Keep the flat paymentDates array in sync with paymentHistory transactions
  this.paymentDates = this.paymentHistory.map((item) => item.date);

  next();
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;

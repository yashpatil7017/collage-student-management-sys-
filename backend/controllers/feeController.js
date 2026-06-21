/**
 * @file feeController.js
 * @description Controllers for Fee operations. Implements full CRUD.
 * Supports specialized payment collection actions to satisfy Teacher limited update access.
 */

const Fee = require('../models/Fee');
const Student = require('../models/Student');

/**
 * @desc    Create a new fee structure for a student
 * @route   POST /api/fees
 * @access  Private (ADMIN only)
 */
const createFee = async (req, res, next) => {
  const { studentId, totalAmount } = req.body;

  try {
    // 1. Validation check
    if (!studentId || totalAmount === undefined) {
      res.status(400);
      throw new Error('Please provide both studentId and totalAmount');
    }

    // 2. Verify referenced student exists in database
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error(`Referenced student with ID '${studentId}' does not exist`);
    }

    // 3. Verify fee structure doesn't already exist for this student
    const feeExists = await Fee.findOne({ studentId });
    if (feeExists) {
      res.status(400);
      throw new Error('A fee structure already exists for this student. Use update or collect payment instead.');
    }

    // 4. Create Fee
    const fee = await Fee.create({
      studentId,
      totalAmount,
      createdBy: req.user._id,
    });

    const populatedFee = await Fee.findById(fee._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(201).json({
      success: true,
      message: 'Student fee structure established successfully',
      data: populatedFee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all student fee structures
 * @route   GET /api/fees
 * @access  Private (ADMIN, TEACHER)
 */
const getFees = async (req, res, next) => {
  try {
    const queryObject = {};

    if (req.query.studentId) {
      queryObject.studentId = req.query.studentId;
    }
    if (req.query.paymentStatus) {
      queryObject.paymentStatus = req.query.paymentStatus;
    }

    const feesList = await Fee.find(queryObject)
      .populate('studentId')
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feesList.length,
      message: 'Student fee profiles retrieved successfully',
      data: feesList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single student fee profile by ID
 * @route   GET /api/fees/:id
 * @access  Private (ADMIN, TEACHER)
 */
const getFeeById = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    if (!fee) {
      res.status(404);
      throw new Error('Student fee record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Student fee record retrieved successfully',
      data: fee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a student fee structure (Master modifications like totalAmount)
 * @route   PUT /api/fees/:id
 * @access  Private (ADMIN only)
 */
const updateFee = async (req, res, next) => {
  const { totalAmount, studentId } = req.body;

  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      res.status(404);
      throw new Error('Student fee record not found');
    }

    // 1. Verify new student exists if changing reference
    if (studentId && studentId !== fee.studentId.toString()) {
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404);
        throw new Error(`Referenced student with ID '${studentId}' does not exist`);
      }
      fee.studentId = studentId;
    }

    // 2. Update properties (Saving triggers recalculations in pre-save hook)
    if (totalAmount !== undefined) fee.totalAmount = totalAmount;

    const updatedFee = await fee.save();

    const populatedUpdatedFee = await Fee.findById(updatedFee._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(200).json({
      success: true,
      message: 'Student fee structure updated successfully',
      data: populatedUpdatedFee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record a new payment transaction (Adding to payment history)
 * @route   POST /api/fees/:id/payments
 * @access  Private (ADMIN, TEACHER - Satisfies limited teacher update access)
 */
const recordPayment = async (req, res, next) => {
  const { amount, method } = req.body;

  try {
    // 1. Validation check
    if (amount === undefined || amount <= 0) {
      res.status(400);
      throw new Error('Please specify a positive payment amount');
    }

    // 2. Find Fee profile
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      res.status(404);
      throw new Error('Student fee record not found');
    }

    // 3. Append payment details to history
    // (Saving will execute pre-save hook, auto-calculating dueAmount, paidAmount, paymentStatus, paymentDates)
    fee.paymentHistory.push({
      amount: Number(amount),
      method: method || 'ONLINE',
      date: new Date(),
    });

    const updatedFee = await fee.save();

    const populatedUpdatedFee = await Fee.findById(updatedFee._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(200).json({
      success: true,
      message: 'Payment transaction logged successfully',
      data: populatedUpdatedFee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a student fee structure record
 * @route   DELETE /api/fees/:id
 * @access  Private (ADMIN only)
 */
const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      res.status(404);
      throw new Error('Student fee record not found');
    }

    await Fee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student fee structure deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  recordPayment,
  deleteFee,
};

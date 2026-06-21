/**
 * @file marksController.js
 * @description Controllers for Marks operations. Implements full CRUD with Mongoose reference
 * population (populating Student data) and business rule checks.
 */

const Mark = require('../models/Mark');
const Student = require('../models/Student');

/**
 * @desc    Log new marks for a student
 * @route   POST /api/marks
 * @access  Private (ADMIN, TEACHER)
 */
const createMark = async (req, res, next) => {
  const {
    studentId,
    subject,
    marksObtained,
    maxMarks,
    semester,
  } = req.body;

  try {
    // 1. Validation check for required fields
    if (!studentId || !subject || marksObtained === undefined || !maxMarks || !semester) {
      res.status(400);
      throw new Error('Please provide all required fields: studentId, subject, marksObtained, maxMarks, semester');
    }

    // 2. Validate student reference exists in database
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error(`Referenced student with ID '${studentId}' does not exist`);
    }

    // 3. Create new mark record
    const mark = await Mark.create({
      studentId,
      subject,
      marksObtained,
      maxMarks,
      semester,
      createdBy: req.user._id, // Tracks who entered the marks
    });

    // Populate student data for response
    const populatedMark = await Mark.findById(mark._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(201).json({
      success: true,
      message: 'Marks recorded successfully',
      data: populatedMark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all marks records with population
 * @route   GET /api/marks
 * @access  Private (ADMIN, TEACHER)
 */
const getMarks = async (req, res, next) => {
  try {
    const queryObject = {};

    // Support filtering by studentId or semester directly via query parameters
    if (req.query.studentId) {
      queryObject.studentId = req.query.studentId;
    }
    if (req.query.semester) {
      queryObject.semester = req.query.semester;
    }
    if (req.query.subject) {
      queryObject.subject = new RegExp(req.query.subject, 'i');
    }

    // Retrieve records, populate referenced Student and creator User documents
    const marksList = await Mark.find(queryObject)
      .populate('studentId')
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: marksList.length,
      message: 'Marks list retrieved successfully',
      data: marksList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single marks record by ID
 * @route   GET /api/marks/:id
 * @access  Private (ADMIN, TEACHER)
 */
const getMarkById = async (req, res, next) => {
  try {
    const mark = await Mark.findById(req.params.id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    if (!mark) {
      res.status(404);
      throw new Error('Marks record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Marks record retrieved successfully',
      data: mark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a marks record
 * @route   PUT /api/marks/:id
 * @access  Private (ADMIN, TEACHER)
 */
const updateMark = async (req, res, next) => {
  const {
    studentId,
    subject,
    marksObtained,
    maxMarks,
    semester,
  } = req.body;

  try {
    const mark = await Mark.findById(req.params.id);

    if (!mark) {
      res.status(404);
      throw new Error('Marks record not found');
    }

    // 1. Verify student exists if reference is modified
    if (studentId && studentId !== mark.studentId.toString()) {
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404);
        throw new Error(`Referenced student with ID '${studentId}' does not exist`);
      }
      mark.studentId = studentId;
    }

    // 2. Perform score boundary check if either are modified
    const nextMarksObtained = marksObtained !== undefined ? marksObtained : mark.marksObtained;
    const nextMaxMarks = maxMarks !== undefined ? maxMarks : mark.maxMarks;
    if (nextMarksObtained > nextMaxMarks) {
      res.status(400);
      throw new Error(`Validation Error: Marks obtained (${nextMarksObtained}) cannot exceed maximum marks (${nextMaxMarks})`);
    }

    // 3. Update parameters
    if (subject) mark.subject = subject;
    if (marksObtained !== undefined) mark.marksObtained = marksObtained;
    if (maxMarks !== undefined) mark.maxMarks = maxMarks;
    if (semester) mark.semester = semester;

    const updatedMark = await mark.save();

    // Populate for clean feedback
    const populatedUpdatedMark = await Mark.findById(updatedMark._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(200).json({
      success: true,
      message: 'Marks record updated successfully',
      data: populatedUpdatedMark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a student marks record
 * @route   DELETE /api/marks/:id
 * @access  Private (ADMIN only - Role restriction enforced via routing layer)
 */
const deleteMark = async (req, res, next) => {
  try {
    const mark = await Mark.findById(req.params.id);

    if (!mark) {
      res.status(404);
      throw new Error('Marks record not found');
    }

    // Remove from database
    await Mark.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Marks record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMark,
  getMarks,
  getMarkById,
  updateMark,
  deleteMark,
};

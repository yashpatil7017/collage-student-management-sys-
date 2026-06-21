/**
 * @file studentController.js
 * @description Controllers for Student operations. Implements full CRUD with validation
 * and flexible search functionality (by name and/or rollNumber).
 */

const Student = require('../models/Student');

/**
 * @desc    Create a new student record
 * @route   POST /api/students
 * @access  Private (ADMIN only)
 */
const createStudent = async (req, res, next) => {
  const {
    name,
    rollNumber,
    department,
    year,
    email,
    phone,
    address,
  } = req.body;

  try {
    // 1. Basic validation check for all required fields
    if (
      !name ||
      !rollNumber ||
      !department ||
      !year ||
      !email ||
      !phone ||
      !address
    ) {
      res.status(400);
      throw new Error('Please provide all required fields: name, rollNumber, department, year, email, phone, address');
    }

    // 2. Validate rollNumber unique constraint beforehand
    const rollNumberExists = await Student.findOne({ rollNumber });
    if (rollNumberExists) {
      res.status(400);
      throw new Error(`Roll number '${rollNumber}' is already assigned to a student`);
    }

    // 3. Validate email unique constraint beforehand
    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error(`Email '${email}' is already registered for a student`);
    }

    // 4. Create the student record, attaching creator (ADMIN user ID)
    const student = await Student.create({
      name,
      rollNumber,
      department,
      year,
      email,
      phone,
      address,
      createdBy: req.user._id, // Set the logged in user as the creator
    });

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all student records with search capabilities (by name or rollNumber)
 * @route   GET /api/students
 * @access  Private (ADMIN, TEACHER)
 */
const getStudents = async (req, res, next) => {
  try {
    let queryObject = {};

    // 1. Implementation of flexible search criteria
    if (req.query.search) {
      // General search querying name OR rollNumber
      const searchRegex = new RegExp(req.query.search, 'i');
      queryObject.$or = [
        { name: searchRegex },
        { rollNumber: searchRegex }
      ];
    } else {
      // Specific searching
      if (req.query.name) {
        queryObject.name = new RegExp(req.query.name, 'i');
      }
      if (req.query.rollNumber) {
        // Match exact or partial match (case-insensitive)
        queryObject.rollNumber = new RegExp(req.query.rollNumber, 'i');
      }
    }

    // Also allow filtering by department or year directly
    if (req.query.department) {
      queryObject.department = new RegExp(req.query.department, 'i');
    }
    if (req.query.year) {
      queryObject.year = req.query.year;
    }

    // 2. Query DB and populate creator details
    const students = await Student.find(queryObject)
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 }); // Newest records first

    res.status(200).json({
      success: true,
      count: students.length,
      message: 'Students list retrieved successfully',
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student record by ID
 * @route   GET /api/students/:id
 * @access  Private (ADMIN, TEACHER)
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      'createdBy',
      'fullName email role'
    );

    if (!student) {
      res.status(404);
      throw new Error('Student record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Student record retrieved successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a student record
 * @route   PUT /api/students/:id
 * @access  Private (ADMIN only)
 */
const updateStudent = async (req, res, next) => {
  const {
    name,
    rollNumber,
    department,
    year,
    email,
    phone,
    address,
  } = req.body;

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student record not found');
    }

    // 1. If email or roll number is being changed, check if they are already in use
    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const emailExists = await Student.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error(`Email '${email}' is already in use by another student`);
      }
      student.email = email;
    }

    if (rollNumber && rollNumber.toUpperCase() !== student.rollNumber.toUpperCase()) {
      const rollExists = await Student.findOne({ rollNumber });
      if (rollExists) {
        res.status(400);
        throw new Error(`Roll number '${rollNumber}' is already in use by another student`);
      }
      student.rollNumber = rollNumber;
    }

    // 2. Assign standard update values if provided
    if (name) student.name = name;
    if (department) student.department = department;
    if (year) student.year = year;
    if (phone) student.phone = phone;
    if (address) student.address = address;

    // 3. Save the modified document
    const updatedStudent = await student.save();

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a student record
 * @route   DELETE /api/students/:id
 * @access  Private (ADMIN only)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student record not found');
    }

    // Remove the student record from database
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};

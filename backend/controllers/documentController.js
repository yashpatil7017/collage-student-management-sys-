/**
 * @file documentController.js
 * @description Controllers for Document operations. Implements full CRUD,
 * reference population, and programmatic generation logic based on document types (BONAFIDE, TRANSFER_CERTIFICATE, MARKSHEET).
 */

const Document = require('../models/Document');
const Student = require('../models/Student');
const Mark = require('../models/Mark');

/**
 * @desc    Generate and store a new student document
 * @route   POST /api/documents
 * @access  Private (ADMIN, TEACHER)
 */
const generateDocument = async (req, res, next) => {
  const { studentId, documentType, customData } = req.body;

  try {
    // 1. Validation check
    if (!studentId || !documentType) {
      res.status(400);
      throw new Error('Please specify both studentId and documentType');
    }

    // 2. Verify referenced student exists in database
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error(`Referenced student with ID '${studentId}' does not exist`);
    }

    let documentData = {};

    // 3. Programmatic auto-compilation based on documentType selection
    if (documentType === 'BONAFIDE') {
      // Compile standard Bonafide details from Student records
      documentData = {
        title: 'BONAFIDE CERTIFICATE',
        certifyText: `This is to certify that ${student.name}, bearing roll number ${student.rollNumber}, is a bonafide student of the department of ${student.department}, current year ${student.year}, in the College Student Management System.`,
        purpose: customData && customData.purpose ? customData.purpose : 'General Academic Purpose',
        issueDate: new Date(),
      };
    } else if (documentType === 'TRANSFER_CERTIFICATE') {
      // Compile standardized Transfer details
      documentData = {
        title: 'TRANSFER CERTIFICATE',
        studentName: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        reasonForLeaving: customData && customData.reasonForLeaving ? customData.reasonForLeaving : 'Course Completed',
        characterAndConduct: customData && customData.characterAndConduct ? customData.characterAndConduct : 'Good',
        issueDate: new Date(),
      };
    } else if (documentType === 'MARKSHEET') {
      // Compile subject scores from database by querying Mark collection
      const marks = await Mark.find({ studentId });
      
      const academicSemester = customData && customData.semester ? Number(customData.semester) : null;
      // Filter marks by semester if provided
      const filteredMarks = academicSemester 
        ? marks.filter(item => item.semester === academicSemester)
        : marks;

      const marksDetails = filteredMarks.map(item => ({
        subject: item.subject,
        marksObtained: item.marksObtained,
        maxMarks: item.maxMarks,
        semester: item.semester,
      }));

      const totalObtained = filteredMarks.reduce((sum, item) => sum + item.marksObtained, 0);
      const totalMax = filteredMarks.reduce((sum, item) => sum + item.maxMarks, 0);
      const aggregatePercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

      documentData = {
        title: 'ACADEMIC PERFORMANCE SHEET',
        studentName: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        academicYear: student.year,
        semester: academicSemester || 'All Semesters',
        marks: marksDetails,
        totalObtained,
        totalMax,
        percentage: `${aggregatePercentage}%`,
        issueDate: new Date(),
      };
    }

    // 4. Create document record (pre-setting a unique download path using temporary ID placeholder)
    const docIdPlaceholder = new mongoose.Types.ObjectId();
    const document = await Document.create({
      _id: docIdPlaceholder,
      studentId,
      documentType,
      documentData,
      documentUrl: `/api/documents/${docIdPlaceholder}/download`,
      createdBy: req.user._id,
    });

    const populatedDoc = await Document.findById(document._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(201).json({
      success: true,
      message: `${documentType} document generated successfully`,
      data: populatedDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all generated document records
 * @route   GET /api/documents
 * @access  Private (ADMIN, TEACHER)
 */
const getDocuments = async (req, res, next) => {
  try {
    const queryObject = {};

    if (req.query.studentId) {
      queryObject.studentId = req.query.studentId;
    }
    if (req.query.documentType) {
      queryObject.documentType = req.query.documentType;
    }

    const docsList = await Document.find(queryObject)
      .populate('studentId')
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: docsList.length,
      message: 'Generated documents list retrieved successfully',
      data: docsList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get generated document details by ID
 * @route   GET /api/documents/:id
 * @access  Private (ADMIN, TEACHER)
 */
const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    if (!document) {
      res.status(404);
      throw new Error('Document record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Document record retrieved successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a generated document record metadata
 * @route   PUT /api/documents/:id
 * @access  Private (ADMIN, TEACHER)
 */
const updateDocument = async (req, res, next) => {
  const { customData, studentId, documentType } = req.body;

  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document record not found');
    }

    // 1. Verify student exists if changing reference
    if (studentId && studentId !== document.studentId.toString()) {
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404);
        throw new Error(`Referenced student with ID '${studentId}' does not exist`);
      }
      document.studentId = studentId;
    }

    // 2. Allow updating base properties
    if (documentType) document.documentType = documentType;
    if (customData) {
      // Merge or overwrite metadata payload
      document.documentData = {
        ...document.documentData,
        ...customData,
        lastModified: new Date(),
      };
    }

    const updatedDocument = await document.save();

    const populatedUpdatedDoc = await Document.findById(updatedDocument._id)
      .populate('studentId')
      .populate('createdBy', 'fullName email role');

    res.status(200).json({
      success: true,
      message: 'Document record updated successfully',
      data: populatedUpdatedDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a generated document record
 * @route   DELETE /api/documents/:id
 * @access  Private (ADMIN only)
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      res.status(404);
      throw new Error('Document record not found');
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};

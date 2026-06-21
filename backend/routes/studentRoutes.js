/**
 * @file studentRoutes.js
 * @description Express routing paths for student management controllers.
 * Enforces authentication on all routes, restricts state-altering actions (POST, PUT, DELETE)
 * strictly to ADMIN role, and permits TEACHER role to have read-only access (GET).
 */

const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all student routes beneath this point (requires logged-in user)
router.use(protect);

// GET /api/students - Retrieve all student records with search/filter (ADMIN and TEACHER allowed)
// POST /api/students - Create a new student record (ADMIN access ONLY)
router
  .route('/')
  .get(authorize('ADMIN', 'TEACHER'), getStudents)
  .post(authorize('ADMIN'), createStudent);

// GET /api/students/:id - Fetch single student record (ADMIN and TEACHER allowed)
// PUT /api/students/:id - Update student record details (ADMIN access ONLY)
// DELETE /api/students/:id - Delete student record (ADMIN access ONLY)
router
  .route('/:id')
  .get(authorize('ADMIN', 'TEACHER'), getStudentById)
  .put(authorize('ADMIN'), updateStudent)
  .delete(authorize('ADMIN'), deleteStudent);

module.exports = router;

/**
 * @file marksRoutes.js
 * @description Express routing paths for marks management controllers.
 * Enforces session authentication via protect middleware.
 * - ADMIN and TEACHER roles are authorized to create (POST), retrieve (GET), and modify (PUT) scores.
 * - Only ADMIN roles are authorized to delete (DELETE) marks records.
 */

const express = require('express');
const router = express.Router();
const {
  createMark,
  getMarks,
  getMarkById,
  updateMark,
  deleteMark,
} = require('../controllers/marksController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all marks routes beneath this point (requires logged-in user)
router.use(protect);

// GET /api/marks - Retrieve all marks logs (ADMIN and TEACHER allowed)
// POST /api/marks - Log new student marks (ADMIN and TEACHER allowed)
router
  .route('/')
  .get(authorize('ADMIN', 'TEACHER'), getMarks)
  .post(authorize('ADMIN', 'TEACHER'), createMark);

// GET /api/marks/:id - Retrieve specific mark details (ADMIN and TEACHER allowed)
// PUT /api/marks/:id - Update student marks (ADMIN and TEACHER allowed)
// DELETE /api/marks/:id - Delete student marks record (ADMIN access ONLY)
router
  .route('/:id')
  .get(authorize('ADMIN', 'TEACHER'), getMarkById)
  .put(authorize('ADMIN', 'TEACHER'), updateMark)
  .delete(authorize('ADMIN'), deleteMark);

module.exports = router;

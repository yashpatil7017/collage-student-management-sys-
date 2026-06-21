/**
 * @file documentRoutes.js
 * @description Express routing paths for document generation controllers.
 * Enforces session authentication via protect middleware.
 * - ADMIN and TEACHER roles are authorized to generate (POST), retrieve (GET), and modify (PUT) document records.
 * - Only ADMIN roles are authorized to delete (DELETE) generated document records.
 */

const express = require('express');
const router = express.Router();
const {
  generateDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all document routes beneath this point (requires logged-in user)
router.use(protect);

// GET /api/documents - Retrieve all generated documents list (ADMIN and TEACHER allowed)
// POST /api/documents - Programmatically generate a new document record (ADMIN and TEACHER allowed)
router
  .route('/')
  .get(authorize('ADMIN', 'TEACHER'), getDocuments)
  .post(authorize('ADMIN', 'TEACHER'), generateDocument);

// GET /api/documents/:id - Fetch single generated document detail (ADMIN and TEACHER allowed)
// PUT /api/documents/:id - Modify generated document details/metadata (ADMIN and TEACHER allowed)
// DELETE /api/documents/:id - Delete generated document record (ADMIN access ONLY)
router
  .route('/:id')
  .get(authorize('ADMIN', 'TEACHER'), getDocumentById)
  .put(authorize('ADMIN', 'TEACHER'), updateDocument)
  .delete(authorize('ADMIN'), deleteDocument);

module.exports = router;

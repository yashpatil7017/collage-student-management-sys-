/**
 * @file feeRoutes.js
 * @description Express routing paths for fee management controllers.
 * Enforces session authentication via protect middleware.
 * - ADMIN roles are authorized for full access (POST, PUT, DELETE).
 * - TEACHER roles are authorized for read access (GET) and payment logs (POST to /:id/payments).
 */

const express = require('express');
const router = express.Router();
const {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  recordPayment,
  deleteFee,
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all fee routes beneath this point (requires logged-in user)
router.use(protect);

// GET /api/fees - Retrieve all fee logs (ADMIN and TEACHER allowed)
// POST /api/fees - Establish new fee structure (ADMIN access ONLY)
router
  .route('/')
  .get(authorize('ADMIN', 'TEACHER'), getFees)
  .post(authorize('ADMIN'), createFee);

// GET /api/fees/:id - Fetch fee record by ID (ADMIN and TEACHER allowed)
// PUT /api/fees/:id - Modify master fee structure details (ADMIN access ONLY)
// DELETE /api/fees/:id - Delete fee record (ADMIN access ONLY)
router
  .route('/:id')
  .get(authorize('ADMIN', 'TEACHER'), getFeeById)
  .put(authorize('ADMIN'), updateFee)
  .delete(authorize('ADMIN'), deleteFee);

// POST /api/fees/:id/payments - Record a payment transaction (ADMIN and TEACHER allowed)
router
  .route('/:id/payments')
  .post(authorize('ADMIN', 'TEACHER'), recordPayment);

module.exports = router;

/**
 * @file dashboardRoutes.js
 * @description Express routing paths for dashboard metrics controllers.
 * Enforces session authentication via protect middleware.
 * - Both ADMIN and TEACHER roles are authorized to query dashboard statistics (GET).
 */

const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all dashboard routes beneath this point (requires logged-in user)
router.use(protect);

// GET /api/dashboard - Retrieve consolidated system dashboard metrics (ADMIN and TEACHER allowed)
router.get('/', authorize('ADMIN', 'TEACHER'), getDashboardMetrics);

module.exports = router;

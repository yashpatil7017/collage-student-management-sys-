/**
 * @file server.js
 * @description Main entry point for the MERN College Student Management System backend server.
 * Instantiates the Express application, configures global middlewares,
 * connects to MongoDB, registers API endpoints, and sets up error handling.
 */

// Load environment variables early in the lifecycle
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Initialize database connection
connectDB();

const app = express();

/**
 * Global Middlewares Setup
 */

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming requests with JSON payloads (replaces bodyParser)
app.use(express.json());

// Parse URL-encoded payloads (useful for form submissions)
app.use(express.urlencoded({ extended: true }));

/**
 * Route Mounts
 */

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'College Student Management System API is fully operational',
    timestamp: new Date(),
  });
});

// Authentication and profiles routing
app.use('/api/auth', require('./routes/authRoutes'));

// Student profiles and database records management routing
app.use('/api/students', require('./routes/studentRoutes'));

// Student academic marks and score tracking routing
app.use('/api/marks', require('./routes/marksRoutes'));

// Student fee structures and transaction history routing
app.use('/api/fees', require('./routes/feeRoutes'));

// Student document generation routing (BONAFIDE, TRANSFER_CERTIFICATE, MARKSHEET)
app.use('/api/documents', require('./routes/documentRoutes'));

// Consolidated metrics dashboard routing
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

/**
 * Fallback Error Handlers
 */

// Handle requests matching no registered route path
app.use(notFound);

// Standardize error formats for internal server exceptions and Mongoose failures
app.use(errorHandler);

/**
 * Server Orchestration
 */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `[Server] College Student Management System Backend listening in '${process.env.NODE_ENV}' mode on port ${PORT}`
  );
});

// Capture unhandled promise rejections and exit server gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Promise Rejection] Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

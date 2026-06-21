/**
 * @file errorMiddleware.js
 * @description Centralized error-handling middlewares.
 * Handles 404 Not Found situations and formats operational exceptions into clean JSON responses.
 */

/**
 * Catches any request that does not match a registered route and returns a 404 error.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Catch-all error handling middleware for formatting exceptions.
 */
const errorHandler = (err, req, res, next) => {
  // Use existing response status code or default to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found: Invalid database identifier';
  }

  // Handle Mongoose duplicate key error (e.g. unique field conflicts)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedFields = Object.keys(err.keyValue).join(', ');
    message = `Duplicate field value entered: A record with this ${duplicatedFields} already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Return standard JSON response
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };

/**
 * @file db.js
 * @description MongoDB connection setup using Mongoose.
 * Provides functions to establish a robust connection to the MongoDB instance
 * and handles connection error events.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using the MONGO_URI from the environment variables.
 * Exits the process with failure code if connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Error] Database connection failed: ${error.message}`);
    // Exit process with failure code (1)
    process.exit(1);
  }
};

module.exports = connectDB;

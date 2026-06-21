/**
 * @file dashboardController.js
 * @description Controller for generating rich system dashboard metrics.
 * Uses high-performance MongoDB aggregation pipelines to calculate statistics
 * including fee collections, pending balances, department grade averages, and pending grading activities.
 */

const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Mark = require('../models/Mark');
const Document = require('../models/Document');

/**
 * @desc    Get dashboard metrics and system summaries
 * @route   GET /api/dashboard
 * @access  Private (ADMIN, TEACHER)
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Metric: totalStudents (Count of Student documents)
    const totalStudents = await Student.countDocuments();

    // 2. Metrics: totalFeesCollected and totalFeesPending
    // Uses aggregation pipeline on the Fee collection
    const feeTotals = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: '$dueAmount' },
        },
      },
    ]);

    const totalFeesCollected = feeTotals.length > 0 ? feeTotals[0].totalCollected : 0;
    const totalFeesPending = feeTotals.length > 0 ? feeTotals[0].totalPending : 0;

    // 3. Metric: averageMarksByDept
    // Uses lookup and group aggregation pipelines to compute the average marks percentage for each department
    const averageMarksByDept = await Mark.aggregate([
      {
        $lookup: {
          from: 'students', // Collection name in MongoDB (plural)
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        $unwind: '$student',
      },
      {
        $group: {
          _id: '$student.department',
          avgPercentage: {
            $avg: {
              $multiply: [
                { $divide: ['$marksObtained', '$maxMarks'] },
                100,
              ],
            },
          },
        },
      },
      {
        $project: {
          department: '$_id',
          avgPercentage: { $round: ['$avgPercentage', 2] },
          _id: 0,
        },
      },
      {
        $sort: { avgPercentage: -1 }, // Highest average percentage first
      },
    ]);

    // 4. Metric: pendingMarksEntries
    // Identifies students who do not have any registered grades logged in the Mark collection
    const pendingMarksEntries = await Student.aggregate([
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'studentId',
          as: 'marks',
        },
      },
      {
        $match: {
          marks: { $size: 0 }, // Students with zero grade records logged
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          rollNumber: 1,
          department: 1,
          year: 1,
        },
      },
    ]);

    // 5. Metric: recentActivities
    // Pulls recent database logs (registered students, fee collections, generated documents)
    const recentStudents = await Student.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name rollNumber department createdAt');

    const recentDocs = await Document.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('studentId', 'name rollNumber')
      .select('documentType documentUrl createdAt');

    // Retrieve recent transaction history entries across all student fee profiles
    const recentPaymentsList = await Fee.aggregate([
      { $unwind: '$paymentHistory' },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $sort: { 'paymentHistory.date': -1 },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          _id: 0,
          studentName: '$student.name',
          rollNumber: '$student.rollNumber',
          amount: '$paymentHistory.amount',
          method: '$paymentHistory.method',
          date: '$paymentHistory.date',
        },
      },
    ]);

    // Consolidate recent logs into structured activity feedback
    const recentActivities = [];

    recentStudents.forEach((stud) => {
      recentActivities.push({
        type: 'STUDENT_REGISTRATION',
        description: `New student '${stud.name}' (${stud.rollNumber}) registered in ${stud.department}.`,
        timestamp: stud.createdAt,
      });
    });

    recentDocs.forEach((doc) => {
      recentActivities.push({
        type: 'DOCUMENT_GENERATION',
        description: `Generated '${doc.documentType}' certificate for '${doc.studentId ? doc.studentId.name : 'Unknown Student'}'.`,
        timestamp: doc.createdAt,
      });
    });

    recentPaymentsList.forEach((pay) => {
      recentActivities.push({
        type: 'FEE_PAYMENT',
        description: `Collected fee payment of ${pay.amount} via ${pay.method} for '${pay.studentName}'.`,
        timestamp: pay.date,
      });
    });

    // Sort combined activities by date descending
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const finalRecentActivities = recentActivities.slice(0, 5); // Return top 5 activities

    // 6. Return response payload
    res.status(200).json({
      success: true,
      message: 'Dashboard metrics compiled successfully',
      data: {
        summary: {
          totalStudents,
          totalFeesCollected,
          totalFeesPending,
          pendingMarksCount: pendingMarksEntries.length,
        },
        averageMarksByDept,
        pendingMarksEntries,
        recentActivities: finalRecentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};

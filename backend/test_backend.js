/**
 * @file test_backend.js
 * @description Programmatic integration validation script for verifying Dashboard API module.
 * Tests MDB lookup and grouping pipelines, fee aggregation tallies, department averages calculations,
 * and unified database activity lists.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Mark = require('./models/Mark');
const Fee = require('./models/Fee');
const Document = require('./models/Document');

async function runTests() {
  console.log('==================================================');
  console.log(' STARTING BACKEND DASHBOARD MODULE INTEGRATION TESTS');
  console.log('==================================================\n');

  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    console.log('--- Connecting to MongoDB ---');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Clear old test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Student.deleteMany({ email: /student.*@example\.com/ });
    await Mark.deleteMany({});
    await Fee.deleteMany({});
    await Document.deleteMany({});

    // 1. Establish seeding parameters
    const adminUser = await User.create({
      fullName: 'School Administrator',
      email: 'testadmin@example.com',
      password: 'adminpassword123',
      role: 'ADMIN',
    });

    // Create 2 Students in different departments
    const csStudent = await Student.create({
      name: 'Clinton Stark',
      rollNumber: 'CS2026101',
      department: 'Computer Science',
      year: 3,
      email: 'studentclinton@example.com',
      phone: '9876543210',
      address: 'Suite A, Campus',
      createdBy: adminUser._id,
    });

    const mechStudent = await Student.create({
      name: 'Natasha Romanoff',
      rollNumber: 'MECH2026102',
      department: 'Mechanical Engineering',
      year: 2,
      email: 'studentnatasha@example.com',
      phone: '8765432109',
      address: 'Suite B, Campus',
      createdBy: adminUser._id,
    });

    assert(csStudent._id && mechStudent._id, 'Database seeded with test Student profiles successfully');

    // Create fee profiles with transactions
    await Fee.create({
      studentId: csStudent._id,
      totalAmount: 1500,
      paymentHistory: [{ amount: 500, method: 'ONLINE' }],
      createdBy: adminUser._id,
    });

    await Fee.create({
      studentId: mechStudent._id,
      totalAmount: 2000,
      paymentHistory: [{ amount: 1500, method: 'CASH' }],
      createdBy: adminUser._id,
    });

    // Create academic marks (Natasha has marks, Clinton has none initially)
    await Mark.create({
      studentId: mechStudent._id,
      subject: 'Robotics',
      marksObtained: 80,
      maxMarks: 100,
      semester: 3,
      createdBy: adminUser._id,
    });

    // Create mock document
    await Document.create({
      studentId: mechStudent._id,
      documentType: 'BONAFIDE',
      documentData: { title: 'BONAFIDE' },
      documentUrl: '/mock/download',
      createdBy: adminUser._id,
    });

    // Execute aggregation: Fee Totals Sums
    const feeTotals = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: '$dueAmount' },
        },
      },
    ]);
    const totalCollected = feeTotals.length > 0 ? feeTotals[0].totalCollected : 0;
    const totalPending = feeTotals.length > 0 ? feeTotals[0].totalPending : 0;

    assert(totalCollected === 2000, 'Fee pipeline sums paidAmount correctly (500 + 1500 = 2000)');
    assert(totalPending === 1500, 'Fee pipeline sums dueAmount correctly (1000 + 500 = 1500)');

    // Execute aggregation: Department academic averages
    const averageMarksByDept = await Mark.aggregate([
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
    ]);

    assert(averageMarksByDept.length === 1 && averageMarksByDept[0].department === 'Mechanical Engineering', 'Department lookup matches student academic records accurately');
    assert(averageMarksByDept[0].avgPercentage === 80, 'Academic score average percentages computed correctly (80%)');

    // Execute aggregation: Unlogged grades (pending marks)
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
          marks: { $size: 0 },
        },
      },
    ]);

    assert(pendingMarksEntries.length === 1 && pendingMarksEntries[0].name === 'Clinton Stark', 'Pending marks query accurately detects students without logged grades');

    // Clean up
    await User.findByIdAndDelete(adminUser._id);
    await Student.findByIdAndDelete(csStudent._id);
    await Student.findByIdAndDelete(mechStudent._id);
    await Mark.deleteMany({});
    await Fee.deleteMany({});
    await Document.deleteMany({});
    console.log('Database test records cleaned up.');

  } catch (error) {
    console.error('Database aggregation pipeline error:', error.message);
    assert(false, 'Database aggregation pipeline tests failed');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }

  console.log('\n==================================================');
  console.log(`   TESTS COMPLETED: ${testsPassed} / ${totalTests} ASSERTIONS PASSED`);
  console.log('==================================================');

  if (testsPassed === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();

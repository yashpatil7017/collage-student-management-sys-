/**
 * @file Document.js
 * @description Mongoose schema definition and model for the Document entity.
 * Supports document types: BONAFIDE, TRANSFER_CERTIFICATE, and MARKSHEET.
 * Includes Mongoose reference links to Student and creator User.
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide the student ID reference'],
    },
    documentType: {
      type: String,
      required: [true, 'Please specify the document type'],
      enum: {
        values: ['BONAFIDE', 'TRANSFER_CERTIFICATE', 'MARKSHEET'],
        message: '{VALUE} is not a valid document type. Allowed types are BONAFIDE, TRANSFER_CERTIFICATE, and MARKSHEET.',
      },
    },
    documentData: {
      type: mongoose.Schema.Types.Mixed, // Stores specific key-value metadata depending on document type
      required: [true, 'Please provide the document metadata payload'],
    },
    documentUrl: {
      type: String,
      required: [true, 'Please specify the generated document URL/download path'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Document must be linked to the creator (Teacher or Admin)'],
    },
  },
  {
    timestamps: true, // Auto manages createdAt and updatedAt fields
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

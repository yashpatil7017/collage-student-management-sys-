import React, { useState, useEffect } from 'react';
import documentService from '../services/documentService';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Documents = () => {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control States
  const [showGenModal, setShowGenModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedDoc, setViewedDoc] = useState(null);

  // Form: Document Generation States
  const [studentId, setStudentId] = useState('');
  const [documentType, setDocumentType] = useState('BONAFIDE');
  const [purpose, setPurpose] = useState('General Academic Purpose');
  const [reasonForLeaving, setReasonForLeaving] = useState('Course Completed');
  const [characterAndConduct, setCharacterAndConduct] = useState('Good');
  const [semester, setSemester] = useState('1');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getAll();
      if (res && res.success) {
        setDocuments(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load generated document rosters.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getAll();
      if (res && res.success) {
        setStudents(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStudents();
  }, []);

  const openGenModal = () => {
    setStudentId(students.length > 0 ? students[0]._id : '');
    setDocumentType('BONAFIDE');
    setPurpose('General Academic Purpose');
    setReasonForLeaving('Course Completed');
    setCharacterAndConduct('Good');
    setSemester('1');
    setShowGenModal(true);
  };

  const openViewModal = (doc) => {
    setViewedDoc(doc);
    setShowViewModal(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!studentId || !documentType) {
      return toast.error('Please select both student and document template type.');
    }

    // Dynamic custom data payload mapping to backend expectations
    const customData = {};
    if (documentType === 'BONAFIDE') {
      customData.purpose = purpose;
    } else if (documentType === 'TRANSFER_CERTIFICATE') {
      customData.reasonForLeaving = reasonForLeaving;
      customData.characterAndConduct = characterAndConduct;
    } else if (documentType === 'MARKSHEET') {
      customData.semester = parseInt(semester);
    }

    const loaderId = toast.loading('Compiling and generating certificate document...');
    try {
      const res = await documentService.generate({
        studentId,
        documentType,
        customData,
      });

      if (res && res.success) {
        toast.success(`${documentType} Certificate compiled successfully!`, { id: loaderId });
        setShowGenModal(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error compiling certificate.', { id: loaderId });
    }
  };

  const handleDelete = async (id, type) => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the compiled '${type}' document from the database?`);
    if (!confirmDelete) return;

    const loaderId = toast.loading('Purging compiled document...');
    try {
      const res = await documentService.delete(id);
      if (res && res.success) {
        toast.success('Document purged successfully.', { id: loaderId });
        fetchDocuments();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to purge document.', { id: loaderId });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="documents-wrapper">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px', fontFamily: 'Poppins' }}>Campus Document Generation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Generate Bonafide certificates, Transfer forms, and aggregated academic transcripts instantly.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openGenModal}>
          <span>📄</span> Compile Student Certificate
        </button>
      </div>

      {/* RENDER ACTIVE DOCUMENTS */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Assembling active campus certificate ledger...</div>
      ) : (
        <div className="table-container">
          {documents.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No certificates compiled yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Roll Number</th>
                  <th>Certificate Type</th>
                  <th>Compiled Date</th>
                  <th>Authorized By</th>
                  <th style={{ textAlign: 'center' }}>Document Panel</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id}>
                    <td style={{ fontWeight: '600' }}>
                      {doc.studentId ? doc.studentId.name : <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Deleted Student</span>}
                    </td>
                    <td><code>{doc.studentId ? doc.studentId.rollNumber : 'N/A'}</code></td>
                    <td>
                      <span className={`badge ${doc.documentType === 'MARKSHEET' ? 'badge-paid' : doc.documentType === 'BONAFIDE' ? 'badge-role' : 'badge-partial'}`}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {doc.createdBy ? `${doc.createdBy.fullName} (${doc.createdBy.role})` : 'System'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--primary) 0%, rgba(99, 102, 241, 0.8) 100%)', boxShadow: 'none' }}
                        onClick={() => openViewModal(doc)}
                      >
                        👁️ View & Print
                      </button>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn action-btn-delete" 
                            onClick={() => handleDelete(doc._id, doc.documentType)}
                            title="Delete Generated Document"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* OVERLAY DIALOG: Generation Form */}
      {showGenModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Dynamic Student Document</h3>
              <button className="modal-close" onClick={() => setShowGenModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleGenerate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="doc-student-select">Select Student</label>
                  <select
                    id="doc-student-select"
                    className="form-control"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  >
                    {students.length === 0 ? (
                      <option value="">No registered students found</option>
                    ) : (
                      students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} ({student.rollNumber})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="doc-type-select">Document Template Type</label>
                  <select
                    id="doc-type-select"
                    className="form-control"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  >
                    <option value="BONAFIDE">BONAFIDE CERTIFICATE (Enrollment Proof)</option>
                    <option value="TRANSFER_CERTIFICATE">TRANSFER CERTIFICATE (Leaving Form)</option>
                    <option value="MARKSHEET">MARKSHEET (Transcript Compilation)</option>
                  </select>
                </div>

                {/* Conditional Sub-forms based on Document Type selection */}
                {documentType === 'BONAFIDE' && (
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" htmlFor="bonafide-purpose">Purpose of Document</label>
                    <input
                      id="bonafide-purpose"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Visa application, Internship clearance, Bus pass"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                    />
                  </div>
                )}

                {documentType === 'TRANSFER_CERTIFICATE' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="tc-reason">Reason for Leaving</label>
                      <input
                        id="tc-reason"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Course Completed, Higher Studies, Personal Reasons"
                        value={reasonForLeaving}
                        onChange={(e) => setReasonForLeaving(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" htmlFor="tc-conduct">Character and Conduct</label>
                      <select
                        id="tc-conduct"
                        className="form-control"
                        value={characterAndConduct}
                        onChange={(e) => setCharacterAndConduct(e.target.value)}
                        required
                      >
                        <option value="Good">Good</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Exemplary">Exemplary</option>
                      </select>
                    </div>
                  </>
                )}

                {documentType === 'MARKSHEET' && (
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" htmlFor="marksheet-semester">Semester Target</label>
                    <select
                      id="marksheet-semester"
                      className="form-control"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      required
                    >
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">3rd Semester</option>
                      <option value="4">4th Semester</option>
                      <option value="5">5th Semester</option>
                      <option value="6">6th Semester</option>
                      <option value="7">7th Semester</option>
                      <option value="8">8th Semester</option>
                    </select>
                  </div>
                )}

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Compile Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY DIALOG: Stylized Frame Document Viewer */}
      {showViewModal && viewedDoc && (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '800px', backgroundColor: '#ffffff', color: '#1e293b' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <h3 className="modal-title" style={{ color: '#1e293b' }}>Compiled Student Certificate View</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#1e293b', borderColor: '#cbd5e1' }} onClick={handlePrint}>
                  🖨️ Print
                </button>
                <button className="modal-close" style={{ color: '#64748b' }} onClick={() => setShowViewModal(false)}>×</button>
              </div>
            </div>

            <div className="modal-body print-area" style={{ padding: '40px' }}>
              {/* BRAND HEADER IN PRINT */}
              <div className="certificate-seal-border">
                <div style={{ textAlign: 'center', borderBottom: '2px double #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2.5rem' }}>🏛️</span>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins', marginTop: '6px', textTransform: 'uppercase' }}>
                    SkyBrisk Institute of Technology
                  </h1>
                  <p style={{ color: '#475569', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    ACCREDITED STATE UNIVERSITY • CAMPUS REGISTRY ARCHIVES
                  </p>
                </div>

                {/* 1. BONAFIDE DOCUMENT */}
                {viewedDoc.documentType === 'BONAFIDE' && (
                  <div style={{ fontFamily: 'Georgia, serif', lineHeight: '1.8' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', textDecoration: 'underline', marginBottom: '30px' }}>
                      {viewedDoc.documentData.title}
                    </h2>
                    
                    <p style={{ fontSize: '1.1rem', textIndent: '40px', marginBottom: '24px', textAlign: 'justify' }}>
                      {viewedDoc.documentData.certifyText}
                    </p>

                    <p style={{ fontSize: '1.1rem', marginBottom: '40px' }}>
                      This certificate is programmatically compiled and issued at the request of the student for the purpose of:{' '}
                      <strong>{viewedDoc.documentData.purpose}</strong>.
                    </p>
                  </div>
                )}

                {/* 2. TRANSFER CERTIFICATE */}
                {viewedDoc.documentType === 'TRANSFER_CERTIFICATE' && (
                  <div style={{ fontFamily: 'Georgia, serif', lineHeight: '1.8' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', textDecoration: 'underline', marginBottom: '30px' }}>
                      {viewedDoc.documentData.title}
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', fontSize: '1.1rem', marginBottom: '40px' }}>
                      <div>1. Name of Student: <strong>{viewedDoc.documentData.studentName}</strong></div>
                      <div>2. Student Roll Number: <code>{viewedDoc.documentData.rollNumber}</code></div>
                      <div>3. Academic Department: <strong>{viewedDoc.documentData.department}</strong></div>
                      <div>4. Character and Conduct: <strong>{viewedDoc.documentData.characterAndConduct}</strong></div>
                      <div>5. Reason for Leaving: <em>{viewedDoc.documentData.reasonForLeaving}</em></div>
                    </div>

                    <p style={{ fontSize: '1.05rem', textAlign: 'justify', marginBottom: '40px' }}>
                      This is to certify that the student listed above has cleared all campus outstanding dues and is honorably discharged from the rolls of this institution.
                    </p>
                  </div>
                )}

                {/* 3. MARKSHEET DOCUMENT */}
                {viewedDoc.documentType === 'MARKSHEET' && (
                  <div style={{ fontFamily: 'sans-serif' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.35rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>
                      {viewedDoc.documentData.title}
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>Student Name: <strong>{viewedDoc.documentData.studentName}</strong></div>
                      <div>Roll Number: <code>{viewedDoc.documentData.rollNumber}</code></div>
                      <div>Department: <strong>{viewedDoc.documentData.department}</strong></div>
                      <div>Academic Year: <strong>Year {viewedDoc.documentData.academicYear}</strong></div>
                      <div>Semester: <strong style={{ color: '#6366f1' }}>{viewedDoc.documentData.semester}</strong></div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '0.95rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Subject/Course</th>
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Semester</th>
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Marks Secured</th>
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Max Marks</th>
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Status Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!viewedDoc.documentData.marks || viewedDoc.documentData.marks.length === 0) ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                              No grading records found logged for this student.
                            </td>
                          </tr>
                        ) : (
                          viewedDoc.documentData.marks.map((mk, i) => {
                            const isPass = mk.marksObtained >= (mk.maxMarks * 0.4);
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{mk.subject}</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Sem {mk.semester}</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '600' }}>{mk.marksObtained}</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{mk.maxMarks}</td>
                                <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '600', color: isPass ? '#10b981' : '#ef4444' }}>
                                  {isPass ? 'PASS' : 'FAIL'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                        <tr style={{ backgroundColor: '#f8fafc', fontWeight: '700', borderTop: '2px solid #cbd5e1' }}>
                          <td colSpan="2" style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Cumulative Aggregates:</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#10b981' }}>{viewedDoc.documentData.totalObtained}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{viewedDoc.documentData.totalMax}</td>
                          <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#6366f1', fontSize: '1rem' }}>
                            {viewedDoc.documentData.percentage}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SIGNATURE SECTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px', fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontStyle: 'italic', color: '#64748b', height: '24px', fontFamily: 'Cursive' }}>Harshwardhan</div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #1e293b', width: '180px', paddingTop: '4px' }}>
                      Office Registrar
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Registry Seal Verified</span>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontStyle: 'italic', color: '#64748b', height: '24px' }}></div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #1e293b', width: '180px', paddingTop: '4px' }}>
                      Dean of Academics
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Campus Dean Seal Verified</span>
                  </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Generated on {new Date(viewedDoc.createdAt).toLocaleDateString()} • Verified cryptographic ID: {viewedDoc._id}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn btn-secondary" style={{ color: '#1e293b', borderColor: '#cbd5e1' }} onClick={() => setShowViewModal(false)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Injection Styles for Gold Frames and Printing support */}
      <style dangerouslySetInnerHTML={{__html: `
        .certificate-seal-border {
          border: 4px double #b45309;
          padding: 30px;
          border-radius: 4px;
          position: relative;
          background-color: #fdfdfb;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .modal-overlay, .modal-content {
            background-color: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />
    </div>
  );
};

export default Documents;

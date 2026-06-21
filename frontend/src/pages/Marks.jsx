import React, { useState, useEffect } from 'react';
import marksService from '../services/marksService';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Marks = () => {
  const { isAdmin } = useAuth();
  const [marksLogs, setMarksLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [semester, setSemester] = useState('1');

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const res = await marksService.getAll();
      if (res && res.success) {
        setMarksLogs(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load active academic scores ledger.');
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
    fetchMarks();
    fetchStudents();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setStudentId(students.length > 0 ? students[0]._id : '');
    setSubject('');
    setMarksObtained('');
    setMaxMarks('100');
    setSemester('1');
    setShowModal(true);
  };

  const openEditModal = (log) => {
    setIsEditing(true);
    setSelectedId(log._id);
    setStudentId(log.studentId?._id || '');
    setSubject(log.subject);
    setMarksObtained(log.marksObtained.toString());
    setMaxMarks(log.maxMarks.toString());
    setSemester(log.semester.toString());
    setShowModal(true);
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();

    if (!studentId || !subject || !marksObtained || !maxMarks || !semester) {
      return toast.error('Please fill in all form inputs.');
    }

    const obtainedNum = parseFloat(marksObtained);
    const maxNum = parseFloat(maxMarks);

    if (obtainedNum < 0 || maxNum <= 0) {
      return toast.error('Marks must be positive numbers.');
    }

    if (obtainedNum > maxNum) {
      return toast.error('Marks obtained cannot exceed maximum exam marks.');
    }

    const marksPayload = {
      studentId,
      subject,
      marksObtained: obtainedNum,
      maxMarks: maxNum,
      semester: parseInt(semester),
    };

    const loaderId = toast.loading(isEditing ? 'Syncing academic logs...' : 'Logging student scores...');
    try {
      let res;
      if (isEditing) {
        res = await marksService.update(selectedId, marksPayload);
      } else {
        res = await marksService.create(marksPayload);
      }

      if (res && res.success) {
        toast.success(isEditing ? 'Academic grade updated!' : 'Student marks logged successfully!', { id: loaderId });
        setShowModal(false);
        fetchMarks();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error occurred while saving.', { id: loaderId });
    }
  };

  const handleDeleteMarks = async (id, subject, studentName) => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the '${subject}' marks log for student '${studentName}'?`);
    if (!confirmDelete) return;

    const loaderId = toast.loading('Deleting academic score...');
    try {
      const res = await marksService.delete(id);
      if (res && res.success) {
        toast.success('Marks entry deleted successfully.', { id: loaderId });
        fetchMarks();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete marks entry.', { id: loaderId });
    }
  };

  return (
    <div className="marks-wrapper">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px', fontFamily: 'Poppins' }}>Student Marks Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Log exam scores, record subject grades, and check student pass parameters.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <span>✏️</span> Log Student Marks
        </button>
      </div>

      {/* LEDGER DISPLAY */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Assembling active campus academic grades ledger...</div>
      ) : (
        <div className="table-container">
          {marksLogs.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No grading logs recorded in the ledger yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student Profile</th>
                  <th>Roll Number</th>
                  <th>Subject Course</th>
                  <th>Semester</th>
                  <th>Marks Obtained</th>
                  <th>Grade Rating</th>
                  <th style={{ textAlign: 'center' }}>Managed By</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marksLogs.map((log) => {
                  const pct = ((log.marksObtained / log.maxMarks) * 100).toFixed(1);
                  let badgeClass = 'badge-paid'; // Green
                  let ratingText = 'PASS (EXCELLENT)';
                  if (parseFloat(pct) < 40) {
                    badgeClass = 'badge-unpaid'; // Red
                    ratingText = 'FAIL (RE-EXAM)';
                  } else if (parseFloat(pct) < 65) {
                    badgeClass = 'badge-partial'; // Orange
                    ratingText = 'PASS (SATISFACTORY)';
                  }

                  return (
                    <tr key={log._id}>
                      <td style={{ fontWeight: '600' }}>
                        {log.studentId ? log.studentId.name : <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Deleted Student</span>}
                      </td>
                      <td><code>{log.studentId ? log.studentId.rollNumber : 'N/A'}</code></td>
                      <td style={{ fontWeight: '500' }}>{log.subject}</td>
                      <td>Semester {log.semester}</td>
                      <td>
                        <span style={{ fontWeight: '700' }}>{log.marksObtained}</span> / {log.maxMarks} 
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>({pct}%)</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{ratingText}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {log.createdBy ? log.createdBy.fullName : 'System'}
                      </td>
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn action-btn-edit" 
                            onClick={() => openEditModal(log)}
                            title="Edit Grade Entry"
                          >
                            ✏️
                          </button>
                          {isAdmin && (
                            <button 
                              className="action-btn action-btn-delete" 
                              onClick={() => handleDeleteMarks(log._id, log.subject, log.studentId?.name || 'Unknown')}
                              title="Delete Grade Entry"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* OVERLAY GRADING MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? 'Modify Student Marks Log' : 'Log New Student Marks'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveMarks}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label" htmlFor="student-select">Select Student</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="form-control" 
                      value={students.find(s => s._id === studentId)?.name || 'Loading Student...'} 
                      disabled 
                    />
                  ) : (
                    <select
                      id="student-select"
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
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="subject-input">Course/Subject Title</label>
                  <input
                    id="subject-input"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Artificial Intelligence"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="marks-obtained">Marks Obtained</label>
                    <input
                      id="marks-obtained"
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="e.g. 85"
                      value={marksObtained}
                      onChange={(e) => setMarksObtained(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="max-marks">Maximum Exam Marks</label>
                    <input
                      id="max-marks"
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="e.g. 100"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" htmlFor="semester-select">Academic Semester</label>
                  <select
                    id="semester-select"
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

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Log Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks;

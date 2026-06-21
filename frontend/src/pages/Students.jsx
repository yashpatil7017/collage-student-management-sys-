import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Students = () => {
  const { isAdmin } = useAuth();
  
  // Roster States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // View Student Modal Control
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedStudent, setViewedStudent] = useState(null);

  // Edit/Create Modal Control
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form input states
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Fetch student listings
  const fetchStudentsList = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll();
      if (res && res.success) {
        setStudents(res.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not retrieve student list records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsList();
  }, []);

  // Filter & Search computation
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());
      
    const matchesDept = deptFilter === '' || student.department.toLowerCase() === deptFilter.toLowerCase();
    const matchesYear = yearFilter === '' || student.year.toString() === yearFilter;
    
    return matchesSearch && matchesDept && matchesYear;
  });

  // Unique departments helper for dropdown filters
  const uniqueDepartments = Array.from(
    new Set(students.map((s) => s.department).filter(Boolean))
  );

  // Pagination calculations
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Sync page index if bounds are exceeded after filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, yearFilter]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDeptFilter('');
    setYearFilter('');
    setCurrentPage(1);
    toast.success('Filters cleared successfully.');
  };

  // Profile View trigger
  const handleOpenViewModal = (student) => {
    setViewedStudent(student);
    setShowViewModal(true);
  };

  // Form utilities
  const openCreateModal = () => {
    if (!isAdmin) return;
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setRollNumber('');
    setDepartment('');
    setYear('1');
    setEmail('');
    setPhone('');
    setAddress('');
    setShowFormModal(true);
  };

  const openEditModal = (student, e) => {
    e.stopPropagation(); // Avoid triggering openViewModal on row click
    if (!isAdmin) return;
    setIsEditing(true);
    setSelectedId(student._id);
    setName(student.name);
    setRollNumber(student.rollNumber);
    setDepartment(student.department);
    setYear(student.year.toString());
    setEmail(student.email);
    setPhone(student.phone);
    setAddress(student.address);
    setShowFormModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!name || !rollNumber || !department || !year || !email || !phone || !address) {
      return toast.error('Please complete all form inputs.');
    }

    const studentPayload = {
      name,
      rollNumber,
      department,
      year: parseInt(year),
      email,
      phone,
      address,
    };

    const loaderId = toast.loading(isEditing ? 'Syncing student details...' : 'Adding student profile...');
    try {
      let res;
      if (isEditing) {
        res = await studentService.update(selectedId, studentPayload);
      } else {
        res = await studentService.create(studentPayload);
      }

      if (res && res.success) {
        toast.success(isEditing ? 'Student profile updated!' : 'Student registered successfully!', { id: loaderId });
        setShowFormModal(false);
        fetchStudentsList();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error occurred while saving.', { id: loaderId });
    }
  };

  const handleDeleteStudent = async (id, studentName, e) => {
    e.stopPropagation(); // Avoid triggering openViewModal on row click
    if (!isAdmin) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the profile of '${studentName}'? This action cannot be undone.`);
    if (!confirmDelete) return;

    const loaderId = toast.loading('Purging student profile...');
    try {
      const res = await studentService.delete(id);
      if (res && res.success) {
        toast.success(`Profile of '${studentName}' deleted successfully.`, { id: loaderId });
        fetchStudentsList();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete student.', { id: loaderId });
    }
  };

  return (
    <div className="students-wrapper">
      {/* HEADER BAR */}
      <div className="students-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px', fontFamily: 'Poppins' }}>Student Roster Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            List, register, search, and view detailed profiles of students enrolled.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>➕</span> Add New Student
          </button>
        )}
      </div>

      {/* SEARCH AND ADVANCED FILTERS PANEL */}
      <div className="filters-panel-card">
        <div className="filters-grid">
          {/* Text search */}
          <div className="filter-item search-input-box">
            <span className="input-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, roll no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input-control"
            />
          </div>

          {/* Department Filter */}
          <div className="filter-item">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="filter-select-control"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Year level filter */}
          <div className="filter-item">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="filter-select-control"
            >
              <option value="">All Year Levels</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Utility Reset */}
          {(search || deptFilter || yearFilter) && (
            <button type="button" className="btn btn-secondary filter-clear-btn" onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW ROSTER */}
      {loading ? (
        <div className="flex-center" style={{ padding: '60px', minHeight: '30vh' }}>
          <div className="custom-spinner" />
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Loading student rosters...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            {currentStudents.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '8px' }}>No student records found.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try refining your search queries or active dropdown filters.</p>
              </div>
            ) : (
              <table className="custom-table responsive-student-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Year Level</th>
                    <th>Phone</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map((student) => (
                    <tr 
                      key={student._id} 
                      onClick={() => handleOpenViewModal(student)} 
                      style={{ cursor: 'pointer' }}
                      className="hoverable-row"
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="table-avatar">
                            {student.name.charAt(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{student.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="roll-number-code">{student.rollNumber}</code>
                      </td>
                      <td>
                        <span className="dept-tag">{student.department}</span>
                      </td>
                      <td>
                        <span className="year-tag">Year {student.year}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{student.phone}</td>
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn action-btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewModal(student);
                            }}
                            title="View Detailed Profile"
                          >
                            👁️
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button 
                                className="action-btn action-btn-edit" 
                                onClick={(e) => openEditModal(student, e)} 
                                title="Edit Student Details"
                              >
                                ✏️
                              </button>
                              <button 
                                className="action-btn action-btn-delete" 
                                onClick={(e) => handleDeleteStudent(student._id, student.name, e)} 
                                title="Delete Student Profile"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* DYNAMIC PAGINATION CONTROLLER */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing <span className="bold">{indexOfFirstItem + 1}</span> to{' '}
                <span className="bold">{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
                <span className="bold">{totalItems}</span> students
              </div>
              <div className="pagination-pages">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  ◀ Prev
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-nav-btn"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 1. DETAILED VIEW MODAL OVERLAY (All Roles)                     */}
      {/* ============================================================== */}
      {showViewModal && viewedStudent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-student-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Student Profile Card</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            
            <div className="modal-body student-profile-body">
              {/* Profile Avatar Card */}
              <div className="profile-banner">
                <div className="profile-banner-avatar">
                  {viewedStudent.name.charAt(0)}
                </div>
                <h3 className="profile-banner-name">{viewedStudent.name}</h3>
                <span className="profile-banner-roll">{viewedStudent.rollNumber}</span>
              </div>

              {/* Core Attributes */}
              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="p-label">Department</span>
                  <span className="p-value highlight-text">{viewedStudent.department}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="p-label">Academic Year</span>
                  <span className="p-value">Year {viewedStudent.year} (Semester {viewedStudent.year * 2 - 1} / {viewedStudent.year * 2})</span>
                </div>
                <div className="profile-detail-item">
                  <span className="p-label">Email Address</span>
                  <span className="p-value">{viewedStudent.email}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="p-label">Phone Contact</span>
                  <span className="p-value">{viewedStudent.phone}</span>
                </div>
                <div className="profile-detail-item full-width">
                  <span className="p-label">Residential Address</span>
                  <span className="p-value address-value">{viewedStudent.address}</span>
                </div>
              </div>

              {/* Relational Metadata */}
              <div className="profile-meta-footer">
                <div className="meta-row">
                  <span>Enrolled By:</span>
                  <span style={{ fontWeight: '600' }}>
                    {viewedStudent.createdBy?.fullName || 'Academic Admin'} ({viewedStudent.createdBy?.role || 'ADMIN'})
                  </span>
                </div>
                <div className="meta-row">
                  <span>Registration Date:</span>
                  <span>{new Date(viewedStudent.createdAt).toLocaleDateString()} at {new Date(viewedStudent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close Profile
              </button>
              {isAdmin && (
                <button 
                  className="btn btn-primary" 
                  onClick={(e) => {
                    setShowViewModal(false);
                    openEditModal(viewedStudent, e);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FORM MODAL OVERLAY (Admin Only CRUD)                       */}
      {/* ============================================================== */}
      {showFormModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? 'Modify Student Details' : 'Register New Student Profile'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-name">Full Name</label>
                  <input
                    id="student-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Stephen Strange"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="student-roll">Unique Roll Number</label>
                  <input
                    id="student-roll"
                    type="text"
                    className="form-control"
                    placeholder="e.g. CS2026402"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled={isEditing}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-dept">Department</label>
                    <input
                      id="student-dept"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="student-year">Year level</label>
                    <select
                      id="student-year"
                      className="form-control"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-email">Email Address</label>
                    <input
                      id="student-email"
                      type="email"
                      className="form-control"
                      placeholder="e.g. student@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="student-phone">Contact Phone</label>
                    <input
                      id="student-phone"
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" htmlFor="student-addr">Residential Address</label>
                  <textarea
                    id="student-addr"
                    className="form-control"
                    placeholder="Residential street, state, postal code"
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled side injection for filters, profile overlays & tables */}
      <style dangerouslySetInnerHTML={{__html: `
        .filters-panel-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 24px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 16px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }

        .search-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-box .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .filter-input-control {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px 10px 40px;
          color: var(--text-main);
          width: 100%;
          font-size: 0.9rem;
          transition: var(--transition-fast);
        }

        .filter-input-control:focus {
          outline: none;
          border-color: var(--primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .filter-select-control {
          background-color: var(--bg-surface-light);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-main);
          width: 100%;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .filter-clear-btn {
          font-size: 0.9rem;
          padding: 10px 16px;
          color: var(--danger) !important;
          border: 1px solid var(--danger-border) !important;
          background-color: var(--danger-bg) !important;
        }

        /* Hover row table */
        .hoverable-row {
          transition: var(--transition-fast);
        }
        .hoverable-row:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }

        .table-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: var(--accent-admin-bg);
          border: 1px solid var(--accent-admin-border);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .roll-number-code {
          background-color: rgba(255, 255, 255, 0.04);
          padding: 3px 6px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          color: var(--text-main);
        }

        .dept-tag {
          font-weight: 500;
          color: var(--text-main);
        }

        .year-tag {
          background-color: var(--bg-surface-light);
          border: 1px solid var(--border-color);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Pagination styles */
        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pagination-info {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .pagination-info .bold {
          font-weight: 600;
          color: var(--text-main);
        }

        .pagination-pages {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .page-nav-btn {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.85rem;
          transition: var(--transition-fast);
        }

        .page-nav-btn:hover:not(:disabled) {
          color: var(--text-main);
          border-color: var(--primary);
        }

        .page-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-num-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }

        .page-num-btn:hover {
          border-color: var(--primary);
          color: var(--text-main);
        }

        .page-num-btn.active {
          background-color: var(--primary);
          border-color: var(--primary);
          color: var(--text-dark);
        }

        /* View student details styles */
        .student-profile-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 20px;
        }

        .profile-banner-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--accent-admin-bg);
          border: 2px solid var(--accent-admin-border);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .profile-banner-name {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          margin: 0 0 4px 0;
          color: var(--text-main);
        }

        .profile-banner-roll {
          font-family: monospace;
          background-color: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .profile-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .profile-detail-item.full-width {
          grid-column: span 2;
        }

        .profile-detail-item .p-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-detail-item .p-value {
          font-size: 0.95rem;
          color: var(--text-main);
          font-weight: 500;
        }

        .profile-detail-item .highlight-text {
          color: var(--primary);
          font-weight: 600;
        }

        .profile-detail-item .address-value {
          color: var(--text-muted);
          line-height: 1.4;
          font-size: 0.9rem;
        }

        .profile-meta-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .profile-meta-footer .meta-row {
          display: flex;
          justify-content: space-between;
        }

        .custom-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default Students;

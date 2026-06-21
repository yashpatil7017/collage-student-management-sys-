import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { isAdmin, isTeacher, user } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch core dashboard metrics
      const res = await dashboardService.getMetrics();
      if (res && res.success) {
        setMetrics(res.data);
      } else {
        toast.error('Could not compile system statistics.');
      }

      // If user is a teacher, fetch full student records for detailed summary cards
      if (reqRoleIsTeacher()) {
        const studentRes = await studentService.getAll();
        if (studentRes && studentRes.success) {
          setStudents(studentRes.data || []);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const reqRoleIsTeacher = () => {
    return user?.role === 'TEACHER';
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="custom-spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Assembling campus metrics aggregates...</p>
        <style dangerouslySetInnerHTML={{__html: `
          .custom-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.05);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  const { summary, averageMarksByDept = [], pendingMarksEntries = [], recentActivities = [] } = metrics || {};

  return (
    <div className="dashboard-wrapper">
      {/* HEADER SECTION */}
      <div className="dashboard-welcome" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px', fontFamily: 'Poppins' }}>
            {isAdmin ? 'Campus Operational Hub' : 'Educator Workspace'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isAdmin 
              ? 'Real-time financial and student metrics synced via Mongoose aggregation.'
              : `Logged in as ${user?.fullName || 'Teacher'} • Academic and Student rosters.`}
          </p>
        </div>
        <div className="role-indicator-badge">
          Role: <span className="role-badge-text">{user?.role}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. ADMIN DASHBOARD VIEW                                        */}
      {/* ============================================================== */}
      {isAdmin && (
        <>
          {/* Metrics summary grid */}
          <div className="metrics-grid">
            <div className="metric-card" onClick={() => navigate('/students')} style={{ cursor: 'pointer' }}>
              <div className="metric-info">
                <h3>Registered Students</h3>
                <div className="value">{summary?.totalStudents ?? 0}</div>
              </div>
              <div className="metric-icon">👨‍🎓</div>
            </div>

            <div className="metric-card" onClick={() => navigate('/fees')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--success)' }}>
              <div className="metric-info">
                <h3>Total Fees Collected</h3>
                <div className="value" style={{ color: 'var(--success)' }}>
                  ${summary?.totalFeesCollected ?? 0}
                </div>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>💵</div>
            </div>

            <div className="metric-card" onClick={() => navigate('/fees')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--danger)' }}>
              <div className="metric-info">
                <h3>Total Fees Pending</h3>
                <div className="value" style={{ color: 'var(--danger)' }}>
                  ${summary?.totalFeesPending ?? 0}
                </div>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>💳</div>
            </div>
          </div>

          {/* Stats layout */}
          <div className="dashboard-grid">
            {/* Left Column: Academic averages */}
            <div className="grid-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <section className="dashboard-section-card">
                <h3 className="section-card-title">Academic Score Averages by Department</h3>
                <div className="section-card-body" style={{ marginTop: '20px' }}>
                  {averageMarksByDept.length === 0 ? (
                    <p className="no-data-msg">No department average logs computed yet.</p>
                  ) : (
                    averageMarksByDept.map((dept, index) => (
                      <div key={index} className="custom-progress-container">
                        <div className="custom-progress-info">
                          <span style={{ fontWeight: '500' }}>{dept.department}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{dept.avgPercentage}%</span>
                        </div>
                        <div className="custom-progress-bar-bg">
                          <div 
                            className="custom-progress-bar-fill" 
                            style={{ width: `${dept.avgPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Recent Activities Timeline */}
            <div className="grid-right-col">
              <section className="dashboard-section-card" style={{ height: '100%' }}>
                <h3 className="section-card-title">Recent Database Activities</h3>
                
                <div className="activity-timeline" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                  <div className="timeline-connector-bar" />
                  
                  {recentActivities.length === 0 ? (
                    <p className="no-data-msg">No recent system activities found.</p>
                  ) : (
                    recentActivities.map((act, index) => {
                      let actEmoji = '⚙️';
                      let borderCol = 'var(--border-color)';
                      if (act.type === 'STUDENT_REGISTRATION') {
                        actEmoji = '👨‍🎓';
                        borderCol = 'var(--primary)';
                      } else if (act.type === 'FEE_PAYMENT') {
                        actEmoji = '💵';
                        borderCol = 'var(--success)';
                      } else if (act.type === 'DOCUMENT_GENERATION') {
                        actEmoji = '📄';
                        borderCol = '#38bdf8';
                      }

                      return (
                        <div key={index} className="timeline-item" style={{ display: 'flex', gap: '14px', position: 'relative', zIndex: '2' }}>
                          <div 
                            className="timeline-item-icon" 
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--bg-surface-light)', 
                              border: `2px solid ${borderCol}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              flexShrink: '0'
                            }}
                          >
                            {actEmoji}
                          </div>
                          <div className="timeline-item-content">
                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{act.description}</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. TEACHER DASHBOARD VIEW                                      */}
      {/* ============================================================== */}
      {isTeacher && (
        <>
          {/* Metrics summary grid */}
          <div className="metrics-grid">
            <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="metric-info">
                <h3>Assigned Students</h3>
                <div className="value" style={{ color: 'var(--primary)' }}>
                  {students.length}
                </div>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--accent-teacher-bg)', color: 'var(--primary)', borderColor: 'var(--accent-teacher-border)' }}>👨‍🎓</div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="metric-info">
                <h3>Pending Marks</h3>
                <div className="value" style={{ color: 'var(--warning)' }}>
                  {pendingMarksEntries.length}
                </div>
              </div>
              <div className="metric-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning-border)' }}>📝</div>
            </div>
          </div>

          <div className="dashboard-grid teacher-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '30px' }}>
            {/* Pending Marks list */}
            <section className="dashboard-section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 className="section-card-title">Pending Marks Logs</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Registered student profiles with no grades entered in the academic score sheets.
                  </p>
                </div>
                <button onClick={() => navigate('/marks')} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                  Open Marks Sheet 📝
                </button>
              </div>

              <div className="table-container" style={{ margin: '16px 0 0 0' }}>
                {pendingMarksEntries.length === 0 ? (
                  <p className="no-data-msg" style={{ padding: '24px' }}>All students have academic marks registered successfully.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll Number</th>
                        <th>Department</th>
                        <th>Current Year</th>
                        <th style={{ textAlign: 'center' }}>Grading Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMarksEntries.slice(0, 5).map((student) => (
                        <tr key={student._id}>
                          <td style={{ fontWeight: '600' }}>{student.name}</td>
                          <td>{student.rollNumber}</td>
                          <td>
                            <span className="dept-pill">{student.department}</span>
                          </td>
                          <td>Year {student.year}</td>
                          <td style={{ textAlign: 'center' }}>
                            <Link to="/marks" className="table-action-link">
                              Enter Marks →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {pendingMarksEntries.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Showing 5 of {pendingMarksEntries.length} pending records.
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Student summary cards grid */}
          <section className="dashboard-section-card" style={{ marginBottom: '30px' }}>
            <h3 className="section-card-title" style={{ marginBottom: '6px' }}>Student Profile Summary Cards</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Overview roster of student data details, courses, and phone numbers.
            </p>

            {students.length === 0 ? (
              <p className="no-data-msg" style={{ padding: '40px' }}>No student records exist in the database.</p>
            ) : (
              <div className="student-summary-cards-grid">
                {students.map((student) => (
                  <div key={student._id} className="student-summary-card">
                    <div className="card-header">
                      <div className="avatar-holder">
                        {student.name.charAt(0)}
                      </div>
                      <div className="title-holder">
                        <h4>{student.name}</h4>
                        <span className="roll-sub">{student.rollNumber}</span>
                      </div>
                    </div>

                    <div className="card-body-details">
                      <div className="detail-row">
                        <span className="label">Department:</span>
                        <span className="val-badge">{student.department}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Academic Year:</span>
                        <span className="value">Year {student.year}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value text-truncate" title={student.email}>{student.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Phone:</span>
                        <span className="value">{student.phone}</span>
                      </div>
                      <div className="detail-row text-block">
                        <span className="label">Address:</span>
                        <span className="value address-val">{student.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Styled side injection for custom items */}
      <style dangerouslySetInnerHTML={{__html: `
        .role-indicator-badge {
          background-color: var(--bg-surface-light);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 6px 16px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        
        .role-badge-text {
          color: var(--primary);
          font-weight: 700;
        }

        .dashboard-section-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
        }
        
        .section-card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .no-data-msg {
          color: var(--text-muted);
          font-size: 0.9rem;
          text-align: center;
          padding: 10px 0;
        }

        .timeline-connector-bar {
          position: absolute;
          left: 17px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background-color: var(--border-color);
          zIndex: 1;
        }

        .dept-pill {
          background-color: var(--accent-teacher-bg);
          color: var(--primary);
          border: 1px solid var(--accent-teacher-border);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .table-action-link {
          color: var(--primary);
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: underline;
          transition: var(--transition-fast);
        }
        .table-action-link:hover {
          color: var(--primary-hover);
        }

        /* Student summary cards layout */
        .student-summary-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .student-summary-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 20px;
          transition: var(--transition-normal);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .student-summary-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }

        .student-summary-card .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 12px;
        }

        .student-summary-card .avatar-holder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent-teacher-bg);
          color: var(--primary);
          border: 1px solid var(--accent-teacher-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .student-summary-card .title-holder h4 {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-main);
          font-weight: 600;
        }

        .student-summary-card .roll-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .student-summary-card .card-body-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.85rem;
        }

        .student-summary-card .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .student-summary-card .detail-row.text-block {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          margin-top: 4px;
        }

        .student-summary-card .detail-row .label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .student-summary-card .detail-row .value {
          color: var(--text-main);
          font-weight: 500;
        }

        .student-summary-card .detail-row .val-badge {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          color: var(--text-main);
        }

        .student-summary-card .detail-row .address-val {
          color: var(--text-muted);
          line-height: 1.4;
          font-size: 0.8rem;
        }
        
        .text-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
      `}} />
    </div>
  );
};

export default Dashboard;

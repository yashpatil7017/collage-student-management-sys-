import React, { useState, useEffect } from 'react';
import feeService from '../services/feeService';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Fees = () => {
  const { isAdmin } = useAuth();
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals controllers
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [isEditingFee, setIsEditingFee] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  // Form: Create / Edit Fee Profile
  const [studentId, setStudentId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Form: Collect Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await feeService.getAll();
      if (res && res.success) {
        setFees(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Could not load tuition ledger logs.');
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
    fetchFees();
    fetchStudents();
  }, []);

  // Summary Metrics calculations
  const totalExpected = fees.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = fees.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalPending = fees.reduce((acc, curr) => acc + curr.dueAmount, 0);

  const openCreateFeeModal = () => {
    if (!isAdmin) return;
    setIsEditingFee(false);
    setSelectedFee(null);
    setStudentId(students.length > 0 ? students[0]._id : '');
    setTotalAmount('');
    setShowFeeModal(true);
  };

  const openEditFeeModal = (fee) => {
    if (!isAdmin) return;
    setIsEditingFee(true);
    setSelectedFee(fee);
    setStudentId(fee.studentId?._id || '');
    setTotalAmount(fee.totalAmount.toString());
    setShowFeeModal(true);
  };

  const openPaymentModal = (fee) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.dueAmount.toString()); // Default to collecting the full due amount
    setPaymentMethod('ONLINE');
    setShowPaymentModal(true);
  };

  const openHistoryModal = (fee) => {
    setSelectedFee(fee);
    setShowHistoryModal(true);
  };

  const handleSaveFee = async (e) => {
    e.preventDefault();

    if (!studentId || !totalAmount) {
      return toast.error('Please input expected total billing tuition.');
    }

    const totalNum = parseFloat(totalAmount);
    if (totalNum <= 0) {
      return toast.error('Fee amount must be a positive number.');
    }

    const feePayload = {
      studentId,
      totalAmount: totalNum,
    };

    const loaderId = toast.loading(isEditingFee ? 'Syncing fee structures...' : 'Creating fee ledger profile...');
    try {
      let res;
      if (isEditingFee) {
        res = await feeService.update(selectedFee._id, feePayload);
      } else {
        res = await feeService.create(feePayload);
      }

      if (res && res.success) {
        toast.success(isEditingFee ? 'Fee structures adjusted!' : 'Student fee profile established successfully!', { id: loaderId });
        setShowFeeModal(false);
        fetchFees();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error occurred while saving.', { id: loaderId });
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();

    if (!paymentAmount || !paymentMethod) {
      return toast.error('Please fill in amount and payment method.');
    }

    const amtNum = parseFloat(paymentAmount);
    if (amtNum <= 0) {
      return toast.error('Payment amount must be greater than zero.');
    }

    if (amtNum > selectedFee.dueAmount) {
      return toast.error(`Payment amount cannot exceed the pending due balance of $${selectedFee.dueAmount}`);
    }

    const paymentPayload = {
      amount: amtNum,
      method: paymentMethod,
    };

    const loaderId = toast.loading('Logging transaction payment details...');
    try {
      const res = await feeService.collectPayment(selectedFee._id, paymentPayload);
      if (res && res.success) {
        toast.success('Tuition transaction payment logged successfully!', { id: loaderId });
        setShowPaymentModal(false);
        fetchFees();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error occurred during payment logging.', { id: loaderId });
    }
  };

  const handleDeleteFee = async (id, studentName) => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the fee structure logs for student '${studentName}'?`);
    if (!confirmDelete) return;

    const loaderId = toast.loading('Purging fee record...');
    try {
      const res = await feeService.delete(id);
      if (res && res.success) {
        toast.success('Fee record profile deleted successfully.', { id: loaderId });
        fetchFees();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete fee log.', { id: loaderId });
    }
  };

  return (
    <div className="fees-wrapper">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '4px', fontFamily: 'Poppins' }}>Tuition Invoicing & Billing</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Set tuition quotas, log campus payments, and track outstanding balances.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateFeeModal}>
            <span>💳</span> Establish Student Fee Profile
          </button>
        )}
      </div>

      {/* BILLING SUMMARY CARDS */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-info">
            <h3>Expected Tuition</h3>
            <div className="value">${totalExpected}</div>
          </div>
          <div className="metric-icon">📑</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="metric-info">
            <h3>Collected Balances</h3>
            <div className="value" style={{ color: 'var(--success)' }}>${totalCollected}</div>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>💵</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="metric-info">
            <h3>Outstanding Balances</h3>
            <div className="value" style={{ color: 'var(--danger)' }}>${totalPending}</div>
          </div>
          <div className="metric-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>💸</div>
        </div>
      </div>

      {/* LEDGER DISPLAY */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Assembling active campus billing ledger...</div>
      ) : (
        <div className="table-container">
          {fees.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No student billing profiles logged yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Roll Number</th>
                  <th>Tuition Expected</th>
                  <th>Tuition Paid</th>
                  <th>Remaining Due</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Transactions</th>
                  <th style={{ textAlign: 'center' }}>Receipt Action</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  let statusBadge = 'badge-unpaid';
                  let statusText = 'UNPAID';
                  if (fee.paymentStatus === 'PAID') {
                    statusBadge = 'badge-paid';
                    statusText = 'PAID';
                  } else if (fee.paymentStatus === 'PARTIALLY_PAID') {
                    statusBadge = 'badge-partial';
                    statusText = 'PARTIAL';
                  }

                  return (
                    <tr key={fee._id}>
                      <td style={{ fontWeight: '600' }}>
                        {fee.studentId ? fee.studentId.name : <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Deleted Student</span>}
                      </td>
                      <td><code>{fee.studentId ? fee.studentId.rollNumber : 'N/A'}</code></td>
                      <td>${fee.totalAmount}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '600' }}>${fee.paidAmount}</td>
                      <td style={{ color: fee.dueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600' }}>
                        ${fee.dueAmount}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>{statusText}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => openHistoryModal(fee)}
                        >
                          📜 ({fee.paymentHistory?.length || 0}) Logs
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--primary-teacher) 0%, rgba(13, 148, 136, 0.8) 100%)', boxShadow: 'none' }}
                          onClick={() => openPaymentModal(fee)}
                          disabled={fee.dueAmount === 0}
                        >
                          💰 Collect
                        </button>
                      </td>
                      
                      {isAdmin && (
                        <td>
                          <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                            <button 
                              className="action-btn action-btn-edit" 
                              onClick={() => openEditFeeModal(fee)}
                              title="Edit Bill Expected"
                            >
                              ✏️
                            </button>
                            <button 
                              className="action-btn action-btn-delete" 
                              onClick={() => handleDeleteFee(fee._id, fee.studentId?.name || 'Unknown')}
                              title="Delete Billing Profile"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* OVERLAY DIALOG: Create / Edit Fee Profile (Admin Only) */}
      {showFeeModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isEditingFee ? 'Adjust Student Expected Tuition' : 'Establish Student Fee Profile'}
              </h3>
              <button className="modal-close" onClick={() => setShowFeeModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveFee}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="fee-student-select">Select Student</label>
                  {isEditingFee ? (
                    <input 
                      type="text" 
                      className="form-control" 
                      value={selectedFee?.studentId?.name || 'Loading Student...'} 
                      disabled 
                    />
                  ) : (
                    <select
                      id="fee-student-select"
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

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" htmlFor="fee-total-expected">Expected Tuition Amount ($)</label>
                  <input
                    id="fee-total-expected"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingFee ? 'Save Changes' : 'Establish Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY DIALOG: Collect Tuition Payment */}
      {showPaymentModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Tuition Receipt Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCollectPayment}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Recording payment transaction for student <strong>{selectedFee.studentId?.name}</strong>. 
                  Due outstanding balance is <strong style={{ color: 'var(--danger)' }}>${selectedFee.dueAmount}</strong>.
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="pay-amount-input">Amount to Pay ($)</label>
                  <input
                    id="pay-amount-input"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedFee.dueAmount}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label" htmlFor="pay-method-select">Payment Channel / Method</label>
                  <select
                    id="pay-method-select"
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="ONLINE">ONLINE (Stripe / Bank Wire)</option>
                    <option value="CASH">CASH (Campus Registry Office)</option>
                    <option value="CARD">CARD (POS Terminal)</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER (Direct Deposit)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary-teacher)' }}>
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY DIALOG: Transactions Log History */}
      {showHistoryModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Tuition Receipts Ledger Logs</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
                Transaction history logs for student: <strong>{selectedFee.studentId?.name || 'Unknown'}</strong>
              </p>

              {(!selectedFee.paymentHistory || selectedFee.paymentHistory.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                  No payment transactions logged for this fee profile.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedFee.paymentHistory.map((history, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        backgroundColor: 'var(--bg-surface-light)', 
                        padding: '14px 16px', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--success)' }}>
                          +${history.amount}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          📅 {new Date(history.date).toLocaleString()}
                        </div>
                      </div>
                      <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                        💳 {history.method}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;

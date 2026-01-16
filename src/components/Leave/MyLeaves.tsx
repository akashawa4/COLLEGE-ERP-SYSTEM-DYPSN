import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Search, Download, Eye, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../firebase/firestore';
import { userService } from '../../firebase/firestore';
import { LeaveRequest } from '../../types';
import { saveAs } from 'file-saver';
import { getAvailableSemesters, isValidSemesterForYear, getDefaultSemesterForYear } from '../../utils/semesterMapping';

const YEARS = ['1st', '2nd', '3rd', '4th'];
const DIVS = ['A', 'B', 'C'];

// Demo student leave data for teachers/HOD view
const generateDemoStudentLeaves = (year: string, sem: string, div: string): LeaveRequest[] => {
  const demoStudents = [
    { id: 'STU001', name: 'Rahul Sharma', rollNumber: `${year.charAt(0)}${div}001` },
    { id: 'STU002', name: 'Priya Patel', rollNumber: `${year.charAt(0)}${div}002` },
    { id: 'STU003', name: 'Amit Kumar', rollNumber: `${year.charAt(0)}${div}003` },
    { id: 'STU004', name: 'Sneha Gupta', rollNumber: `${year.charAt(0)}${div}004` },
    { id: 'STU005', name: 'Vikram Singh', rollNumber: `${year.charAt(0)}${div}005` },
    { id: 'STU006', name: 'Anjali Verma', rollNumber: `${year.charAt(0)}${div}006` },
  ];

  const leaveTypes = ['SL', 'CL', 'OD', 'ML', 'OTH'];
  const statuses = ['pending', 'approved', 'rejected', 'returned'];
  const reasons = [
    'Medical appointment scheduled',
    'Family function attendance',
    'Not feeling well due to fever',
    'Personal emergency at home',
    'College fest participation at another college',
    'Sports competition participation',
    'Technical workshop attendance',
    'Interview for internship',
  ];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return demoStudents.map((student, index) => {
    const status = statuses[index % statuses.length];
    const fromDate = new Date(currentYear, currentMonth, 5 + index * 3);
    const toDate = new Date(currentYear, currentMonth, 6 + index * 3 + (index % 2));
    const daysCount = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      id: `LV${year.charAt(0)}${sem}${div}${String(index + 1).padStart(3, '0')}`,
      userId: student.id,
      userName: student.name,
      rollNumber: student.rollNumber,
      leaveType: leaveTypes[index % leaveTypes.length] as any,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      daysCount,
      reason: reasons[index % reasons.length],
      status: status as any,
      submittedAt: new Date(currentYear, currentMonth, 3 + index).toISOString(),
      currentApprovalLevel: status === 'pending' ? (index % 2 === 0 ? 'Teacher' : 'HOD') : undefined,
      approvalFlow: ['Teacher', 'HOD'],
      approvedBy: status === 'approved' ? 'Prof. Sarah Johnson' : undefined,
      approvedAt: status === 'approved' ? new Date(currentYear, currentMonth, 7 + index).toISOString() : undefined,
      remarks: status === 'rejected' ? 'Insufficient documentation provided' : (status === 'returned' ? 'Please provide more details' : undefined),
      year,
      sem,
      div,
      department: 'Computer Engineering',
    } as LeaveRequest;
  });
};

interface ReapplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalLeave: LeaveRequest;
  onSubmit: (data: any) => void;
}

const ReapplyLeaveModal: React.FC<ReapplyLeaveModalProps> = ({ isOpen, onClose, originalLeave, onSubmit }) => {
  const [formData, setFormData] = useState({
    leaveType: originalLeave.leaveType,
    fromDate: originalLeave.fromDate,
    toDate: originalLeave.toDate,
    reason: originalLeave.reason,
    reapplyReason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveTypes = [
    { id: 'SL', name: 'Sick Leave', balance: 5 },
    { id: 'CL', name: 'Casual Leave', balance: 3 },
    { id: 'OD', name: 'On Duty', balance: 2 },
    { id: 'ML', name: 'Medical Leave', balance: 2 },
    { id: 'OTH', name: 'Other', balance: 0 }
  ];

  const calculateDays = () => {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const daysRequested = calculateDays();
      const submitData = {
        ...formData,
        daysCount: daysRequested
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting reapply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Reapply Leave Request</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Original Request Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-amber-900 mb-2">Original Request (Rejected/Returned)</h4>
            <div className="text-sm text-amber-800">
              <p><strong>Request ID:</strong> {originalLeave.id}</p>
              <p><strong>Original Reason:</strong> {originalLeave.reason}</p>
              <p><strong>Status:</strong> {originalLeave.status}</p>
              {originalLeave.remarks && (
                <p><strong>Rejection Remarks:</strong> {originalLeave.remarks}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type *</label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                <input
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date *</label>
                <input
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Days Count Display */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total Days:</strong> {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide a detailed reason for your leave request"
                required
              />
            </div>

            {/* Reapply Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Why are you reapplying? (Optional)</label>
              <textarea
                value={formData.reapplyReason}
                onChange={(e) => setFormData({ ...formData, reapplyReason: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain any changes or additional information for this reapplication"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Reapply Leave</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MyLeaves: React.FC = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReapplyModal, setShowReapplyModal] = useState(false);
  const [leaveToReapply, setLeaveToReapply] = useState<LeaveRequest | null>(null);
  // Add year/sem/div state for teacher/HOD
  const [year, setYear] = useState('1st');
  const [sem, setSem] = useState('1');
  const [div, setDiv] = useState(DIVS[0]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>(getAvailableSemesters('1'));

  // Handle year change to update available semesters
  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const normalizedYear = newYear.replace(/(st|nd|rd|th)/i, '');
    const newAvailableSemesters = getAvailableSemesters(normalizedYear);
    setAvailableSemesters(newAvailableSemesters);

    // If current semester is not valid for new year, reset to first available
    if (!isValidSemesterForYear(normalizedYear, sem)) {
      const defaultSem = getDefaultSemesterForYear(normalizedYear);
      setSem(defaultSem);
    }
  };

  // Load leave requests with optimized loading and timeout
  useEffect(() => {
    const loadLeaveRequests = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Loading timeout. Please try again.');
      }, 30000); // 30 seconds timeout

      try {
        if (user.role === 'teacher' || user.role === 'hod') {
          // Fetch leaves assigned to this teacher/HOD
          const assignedLeaves = await leaveService.getLeaveRequestsByApprover(user.id);
          
          // Also fetch from hierarchical leave collection for the currently selected class and month
          const subject = 'General';
          const now = new Date();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const yearForMonth = String(now.getFullYear());

          // Use full year label (e.g., '2nd') for department-aware hierarchical path
          const classLeaves = await leaveService.getClassLeavesByMonth(
            year,
            sem,
            div,
            subject,
            month,
            yearForMonth,
            user.department || undefined
          ).catch(() => []);

          // Combine assigned leaves with class leaves, removing duplicates
          const allLeaves = [...assignedLeaves];
          const classLeaveIds = new Set(allLeaves.map(l => l.id));
          
          // Add class leaves that aren't already in assigned leaves
          classLeaves.forEach(leave => {
            if (!classLeaveIds.has(leave.id)) {
              // Only add if it matches the selected filters or is assigned to this teacher
              const assignedTo = (leave as any).assignedTo;
              if (!assignedTo || assignedTo.id === user.id || assignedTo.email === user.email) {
                allLeaves.push(leave);
              }
            }
          });

          // Restrict to teacher's department if present on records
          const filtered = allLeaves.filter(l => {
            // Include if no department filter or matches teacher's department
            const deptMatch = !l.department || l.department === user.department;
            // Also include if assigned to this teacher
            const assignedTo = (l as any).assignedTo;
            const isAssigned = assignedTo && (assignedTo.id === user.id || assignedTo.email === user.email);
            return deptMatch || isAssigned;
          });

          // If no real data, use demo data
          if (filtered.length === 0) {
            const demoLeaves = generateDemoStudentLeaves(year, sem, div);
            setLeaveRecords(demoLeaves);
          } else {
            setLeaveRecords(filtered);
          }
        } else {
          // Student: only their own leaves
          const requests = await leaveService.getLeaveRequestsByUser(user.id);
          setLeaveRecords(requests);
        }
      } catch (error) {
        // Handle error silently - use demo data for teacher/HOD
        if (user.role === 'teacher' || user.role === 'hod') {
          const demoLeaves = generateDemoStudentLeaves(year, sem, div);
          setLeaveRecords(demoLeaves);
        } else {
          setError('Failed to load leave requests. Please try again.');
          setLeaveRecords([]);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadLeaveRequests();
    
    // Set up polling to refresh leaves every 10 seconds for students
    // This ensures students see updates when their leaves are approved/rejected
    let refreshInterval: NodeJS.Timeout | null = null;
    if (user?.role === 'student') {
      refreshInterval = setInterval(() => {
        loadLeaveRequests();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, year, sem, div]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'returned': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'returned': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLeaveTypeName = (type: string) => {
    const types = {
      'SL': 'Sick Leave',
      'CL': 'Casual Leave',
      'OD': 'On Duty',
      'ML': 'Medical Leave',
      'OTH': 'Other'
    };
    return types[type as keyof typeof types] || type;
  };

  const filteredLeaves = leaveRecords.filter(leave => {
    const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
    const matchesType = filterType === 'all' || leave.leaveType === filterType;
    const matchesSearch = leave.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const leaveStats = {
    total: leaveRecords.length,
    approved: leaveRecords.filter(l => l.status === 'approved').length,
    pending: leaveRecords.filter(l => l.status === 'pending').length,
    rejected: leaveRecords.filter(l => l.status === 'rejected').length + leaveRecords.filter(l => l.status === 'returned').length
  };

  const handleReapply = (leave: LeaveRequest) => {
    setLeaveToReapply(leave);
    setShowReapplyModal(true);
  };

  const handleReapplySubmit = async (updatedLeaveData: any) => {
    if (!leaveToReapply || !user) return;

    try {
      // Create a new leave request with updated data
      const reapplyData = {
        ...updatedLeaveData,
        userId: user.id,
        userName: user.name,
        department: user.department,
        submittedAt: new Date().toISOString(),
        currentApprovalLevel: 'Teacher',
        approvalFlow: ['Teacher', 'HOD'],
        status: 'pending',
        isReapply: true,
        originalRequestId: leaveToReapply.id,
        reapplyReason: updatedLeaveData.reapplyReason || 'Resubmitted after rejection'
      };

      // Enrich with student academic info if available
      if ((user as any).year) reapplyData.year = (user as any).year;
      if ((user as any).sem) reapplyData.sem = (user as any).sem;
      if ((user as any).div) reapplyData.div = (user as any).div;

      await leaveService.createLeaveRequest(reapplyData);

      // Close modal and refresh data
      setShowReapplyModal(false);
      setLeaveToReapply(null);

      // Refresh the leave records
      const requests = await leaveService.getLeaveRequestsByUser(user.id);
      setLeaveRecords(requests);

    } catch (error) {
      console.error('Error reapplying leave request:', error);
    }
  };

  // Export leave data as CSV for the logged-in student
  const handleExportLeaves = async () => {
    if (!filteredLeaves.length) {
      alert('No leave records to export.');
      return;
    }
    const headers = [
      'Sr No',
      'Roll No',
      'Student Name',
      'Request ID',
      'Type of Leave',
      'Reason',
      'From Date',
      'To Date',
      'Days',
      'Status',
      'Approval Flow',
      'Final Approver',
      'Approved Date',
      'Remarks'
    ];
    const rows = await Promise.all(filteredLeaves.map(async (leave, idx) => {
      const fromDate = new Date(leave.fromDate).toLocaleDateString('en-GB');
      const toDate = new Date(leave.toDate).toLocaleDateString('en-GB');
      const approvedDate = leave.approvedAt ? new Date(leave.approvedAt).toLocaleDateString('en-GB') : '';
      const approvalFlow = leave.approvalFlow ? leave.approvalFlow.join(' > ') : '';
      // For teacher/HOD view, get student data from the leave record
      let rollNo = '';
      let studentName = '';

      if (user?.role === 'teacher' || user?.role === 'hod') {
        // Get student data from the leave record
        rollNo = (leave as any).rollNumber || '';
        studentName = leave.userName || '';

        // If not available in leave record, try to get from student data
        if (!rollNo || !studentName) {
          try {
            const studentData = await userService.getUser(leave.userId);
            if (studentData) {
              rollNo = studentData.rollNumber || '';
              studentName = studentData.name || '';
            }
          } catch (error) {
            // Handle error silently
          }
        }
      } else {
        // For student view, use their own data
        rollNo = user?.rollNumber || '';
        studentName = user?.name || '';
      }

      return [
        idx + 1,
        rollNo,
        studentName,
        leave.id,
        getLeaveTypeName(leave.leaveType),
        (leave.reason || '').replace(/\n|\r/g, ' '),
        fromDate,
        toDate,
        leave.daysCount,
        leave.status,
        approvalFlow,
        leave.approvedBy || '',
        approvedDate,
        leave.remarks ? leave.remarks.replace(/\n|\r/g, ' ') : ''
      ];
    }));
    const csv = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `my_leaves_${user?.rollNumber || user?.id || 'student'}.csv`);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-6 border border-sky-100">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            {user?.role === 'teacher' || user?.role === 'hod' ? 'Student Leaves' : 'My Leaves'}
          </h1>
          <p className="text-slate-600">Track and manage leave requests</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Gradient */}
      <div className="theme-page-header">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="theme-page-title">
              {user?.role === 'teacher' || user?.role === 'hod' ? 'Student Leaves' : 'My Leaves'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Track and manage leave requests</p>
          </div>
          <button
            className="theme-btn-secondary"
            onClick={handleExportLeaves}
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Year/Sem/Div dropdowns for teacher/HOD only */}
      {(user?.role === 'teacher' || user?.role === 'hod') && (
        <div className="theme-card">
          <div className="theme-card-header">
            <h3 className="theme-section-title">Filter by Class</h3>
          </div>
          <div className="theme-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="theme-label">Year</label>
                <select
                  value={year}
                  onChange={e => handleYearChange(e.target.value)}
                  className="theme-select"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="theme-label">Semester</label>
                <select
                  value={sem}
                  onChange={e => setSem(e.target.value)}
                  className="theme-select"
                >
                  {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="theme-label">Division</label>
                <select
                  value={div}
                  onChange={e => setDiv(e.target.value)}
                  className="theme-select"
                >
                  {DIVS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Requests</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{leaveStats.total}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg">
              <Calendar className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </div>
        <div className="theme-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{leaveStats.approved}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="theme-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{leaveStats.pending}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="theme-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Rejected/Returned</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{leaveStats.rejected}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="theme-card">
        <div className="theme-card-header">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reason or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="theme-input pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="theme-select"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="returned">Returned</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="theme-select"
              >
                <option value="all">All Types</option>
                <option value="SL">Sick Leave</option>
                <option value="CL">Casual Leave</option>
                <option value="OD">On Duty</option>
                <option value="ML">Medical Leave</option>
                <option value="OTH">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Cards - Enhanced */}
        <div className="md:hidden p-4 space-y-3">
          {filteredLeaves.map((leave) => (
            <div
              key={leave.id}
              className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
              onClick={() => setSelectedLeave(leave)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(leave as any).userName?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{(leave as any).userName || 'Student'}</p>
                      <p className="text-sm text-slate-500">{getLeaveTypeName(leave.leaveType)}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                    leave.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                    }`}>
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{leave.fromDate} to {leave.toDate}</span>
                  <span className="text-slate-400">•</span>
                  <span>{leave.daysCount} day(s)</span>
                </div>

                <p className="text-sm text-slate-600">
                  <span className="font-medium">Reason:</span> {leave.reason}
                </p>

                {/* Reapply button for rejected/returned leaves - only for students */}
                {user?.role === 'student' && (leave.status === 'rejected' || leave.status === 'returned') && (
                  <div className="pt-3 border-t border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReapply(leave);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reapply</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student / Leave Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Approval Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLeave(leave)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {(leave as any).userName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{(leave as any).userName || 'Student'}</p>
                          <p className="text-sm text-slate-500">{getLeaveTypeName(leave.leaveType)}</p>
                          <p className="text-sm text-slate-600 mt-1">{leave.reason}</p>
                          <p className="text-xs text-slate-400 mt-1">Submitted: {new Date(leave.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{leave.fromDate} to {leave.toDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{leave.daysCount} day(s)</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                        }`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {leave.approvalFlow ? (
                          <div className="space-y-1">
                            {leave.approvalFlow.map((step, index) => (
                              <div key={index} className="text-xs text-slate-600">
                                {step}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Pending</span>
                        )}
                        {leave.currentApprovalLevel && leave.status === 'pending' && (
                          <p className="text-xs text-amber-600 mt-1">
                            Currently with: {leave.currentApprovalLevel}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        {user?.role === 'student' && (leave.status === 'rejected' || leave.status === 'returned') && (
                          <button
                            onClick={() => handleReapply(leave)}
                            className="p-2 hover:bg-sky-100 rounded-lg text-sky-600 transition-colors"
                            title="Reapply Leave"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredLeaves.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leave records found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Leave Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="theme-modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-900">Leave Request Details</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Request ID</label>
                  <p className="font-semibold text-slate-900">{selectedLeave.id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Leave Type</label>
                  <p className="font-semibold text-slate-900">{getLeaveTypeName(selectedLeave.leaveType)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-1">From Date</label>
                  <p className="font-semibold text-slate-900">{new Date(selectedLeave.fromDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-1">To Date</label>
                  <p className="font-semibold text-slate-900">{new Date(selectedLeave.toDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <label className="text-xs font-medium text-slate-500 block mb-2">Reason</label>
                <p className="text-slate-900">{selectedLeave.reason}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <label className="text-xs font-medium text-slate-500 block mb-2">Status</label>
                <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium ${selectedLeave.status === 'approved' ? 'bg-green-100 text-green-700' :
                  selectedLeave.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    selectedLeave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                  }`}>
                  {getStatusIcon(selectedLeave.status)}
                  <span className="capitalize">{selectedLeave.status}</span>
                </span>
              </div>

              {selectedLeave.approvalFlow && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-2">Approval Flow</label>
                  <div className="space-y-2">
                    {selectedLeave.approvalFlow.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded-full border border-slate-200">{index + 1}</span>
                        <span className="text-sm text-slate-900">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline approve/reject for teacher/HOD */}
              {user?.role && selectedLeave.status === 'pending' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-medium text-slate-500 block mb-3">Take Action</label>
                  <div className="flex flex-wrap gap-3">
                    {(user.role === 'teacher' && selectedLeave.currentApprovalLevel === 'Teacher') && (
                      <>
                        <button
                          onClick={async () => {
                            await leaveService.updateLeaveRequestStatus(selectedLeave.id!, 'approved', user.id);
                            setSelectedLeave(null);
                          }}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                        >Approve</button>
                        <button
                          onClick={async () => {
                            await leaveService.updateLeaveRequestStatus(selectedLeave.id!, 'rejected', user.id);
                            setSelectedLeave(null);
                          }}
                          className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                        >Reject</button>
                      </>
                    )}
                    {(user.role === 'hod' && selectedLeave.currentApprovalLevel === 'HOD') && (
                      <>
                        <button
                          onClick={async () => {
                            await leaveService.updateLeaveRequestStatus(selectedLeave.id!, 'approved', user.id);
                            setSelectedLeave(null);
                          }}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                        >Final Approve</button>
                        <button
                          onClick={async () => {
                            await leaveService.updateLeaveRequestStatus(selectedLeave.id!, 'rejected', user.id);
                            setSelectedLeave(null);
                          }}
                          className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                        >Reject</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedLeave.approvedBy && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-1">Final Approved By</label>
                  <p className="font-semibold text-slate-900">{selectedLeave.approvedBy}</p>
                  {selectedLeave.approvedAt && (
                    <p className="text-xs text-slate-600 mt-1">on {new Date(selectedLeave.approvedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {selectedLeave.remarks && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 block mb-2">Remarks</label>
                  <p className="text-slate-900">{selectedLeave.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reapply Modal */}
      {showReapplyModal && leaveToReapply && (
        <ReapplyLeaveModal
          isOpen={showReapplyModal}
          onClose={() => {
            setShowReapplyModal(false);
            setLeaveToReapply(null);
          }}
          originalLeave={leaveToReapply}
          onSubmit={handleReapplySubmit}
        />
      )}
    </div>
  );
};

export default MyLeaves;
import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../firebase/firestore';
import { saveAs } from 'file-saver';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

interface StudentAttendanceData {
  date: string;
  subject: string;
  status: string;
  presentCount: number;
  absentCount: number;
  totalDays: number;
  attendancePercentage: number;
}

const StudentMyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [studentAttendanceData, setStudentAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [error, setError] = useState<string>('');

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Custom range states
  const [customRangeFrom, setCustomRangeFrom] = useState<string>('');
  const [customRangeTo, setCustomRangeTo] = useState<string>('');
  const [showCustomRangeInputs, setShowCustomRangeInputs] = useState(false);

  // Dynamic subjects based on student's year and semester
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load subjects based on student's year and semester
  const loadSubjects = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setSubjectsLoading(true);
      // Get department code for subject query
      const deptCode = getDepartmentCode(user.department);

      // Query subjects directly from Firestore using the new path structure
      // New Path: /subjects/2025/CSE/year/4th/sems/7
      const batchYear = '2025'; // Default batch year
      const collectionPath = `subjects/${batchYear}/${deptCode}/year/${user.year}/sems/${user.sem}`;

      const subjectsRef = collection(db, collectionPath);
      const querySnapshot = await getDocs(subjectsRef);

      // Extract subject names from document data
      const subjectNames: string[] = [];
      querySnapshot.docs.forEach(doc => {
        const docId = doc.id;

        // Get subject data to find the actual subject name
        const subjectData = doc.data();
        const subjectName = subjectData.subjectName || subjectData.name || docId;

        if (!subjectNames.includes(subjectName)) {
          subjectNames.push(subjectName);
        }
      });
      setAvailableSubjects(subjectNames);

      // Set first subject as default if none selected
      if (subjectNames.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectNames[0]);
      } else if (subjectNames.length === 0) {
        setError(`No subjects found for ${user.year} year, ${user.sem} semester. Please contact your administrator.`);
      }

    } catch (error) {
      setError('Failed to load subjects. Please try again.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Set default date to today when component mounts
  useEffect(() => {
    setSelectedDate(getTodayDate());
  }, []);

  // Load subjects when user data is available
  useEffect(() => {
    if (user && user.role === 'student') {
      loadSubjects();
    }
  }, [user]);

  // Load student's own attendance data
  useEffect(() => {
    const loadStudentAttendance = async () => {
      if (!user || user.role !== 'student' || !selectedSubject) return;

      try {
        setLoading(true);
        setError('');

        // Load attendance data for selected date
        if (selectedDate) {
          await loadAttendanceData();
        }

      } catch (error) {
        setError('Failed to load attendance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentAttendance();
  }, [user, selectedSubject, selectedDate]);

  const loadAttendanceData = async () => {
    if (!selectedDate || !user) return;

    setLoading(true);

    try {
      // Get student's own attendance for the selected subject and date
      const studentAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
        user.rollNumber!,
        user.year || '2nd',
        user.sem || '3',
        user.div || 'A',
        selectedSubject,
        new Date(selectedDate),
        new Date(selectedDate)
      );

      // Calculate attendance statistics for selected date only
      const presentCount = studentAttendance.filter(a => a.status === 'present').length;
      const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
      const totalDays = studentAttendance.length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      const attendanceData: StudentAttendanceData = {
        date: selectedDate,
        subject: selectedSubject,
        status: presentCount > 0 ? 'present' : absentCount > 0 ? 'absent' : 'not_marked',
        presentCount,
        absentCount,
        totalDays,
        attendancePercentage
      };

      setStudentAttendanceData([attendanceData]);

    } catch (error) {
      // Set default data if there's an error
      const defaultData: StudentAttendanceData = {
        date: selectedDate,
        subject: selectedSubject,
        status: 'not_marked',
        presentCount: 0,
        absentCount: 0,
        totalDays: 0,
        attendancePercentage: 0
      };
      setStudentAttendanceData([defaultData]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    // Reload attendance data when subject changes
    if (selectedDate) {
      loadAttendanceData();
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    // Reload attendance data when date changes
    loadAttendanceData();
  };

  const handleExportDailyReport = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select a subject and date to export attendance data.');
      return;
    }

    setExporting(true);
    try {
      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', 'Selected Date', 'Present Percentage', 'Absent Percentage'];

      const rows: any[] = [];
      let srNo = 1;

      for (const data of studentAttendanceData) {
        const row = [
          srNo++,
          user?.name || '',
          user?.div || '',
          user?.rollNumber || '',
          selectedSubject,
          selectedDate,
          `${data.attendancePercentage}%`,
          `${data.totalDays > 0 ? Math.round((data.absentCount / data.totalDays) * 100) : 0}%`
        ];

        rows.push(row);
      }

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `my_attendance_${user?.year || '2nd'}_${user?.sem || '3'}_${user?.div || 'A'}_${selectedSubject}_${selectedDate}.csv`);

    } catch (error) {
      alert('Failed to export attendance data.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportMonthReport = async () => {
    if (!selectedSubject) {
      alert('Please select a subject to export month report.');
      return;
    }

    setExporting(true);
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = lastDayOfMonth.toISOString().split('T')[0];

      // Generate all dates in the month
      const dates: string[] = [];
      const currentDate = new Date(firstDayOfMonth);
      while (currentDate <= lastDayOfMonth) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', ...dates, 'Total Present Days', 'Total Absent Days', 'Present Percentage'];

      // Get student's month attendance data
      const monthAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
        user!.rollNumber!,
        user!.year || '2nd',
        user!.sem || '3',
        user!.div || 'A',
        selectedSubject,
        firstDayOfMonth,
        lastDayOfMonth
      );

      // Create a map of date to attendance status
      const attendanceByDate = new Map<string, string>();
      monthAttendance.forEach(att => {
        const dateStr = att.date instanceof Date ? att.date.toISOString().split('T')[0] :
          (att.date as any)?.toDate?.()?.toISOString().split('T')[0] || att.date;
        attendanceByDate.set(dateStr, att.status);
      });

      // Generate daily attendance status for each date
      const dailyStatus = dates.map(date => {
        const status = attendanceByDate.get(date);
        return status === 'present' ? 'P' : status === 'absent' ? 'A' : '-';
      });

      // Calculate totals
      const totalPresentDays = monthAttendance.filter(a => a.status === 'present').length;
      const totalAbsentDays = monthAttendance.filter(a => a.status === 'absent').length;
      const totalDays = monthAttendance.length;
      const presentPercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;

      const row = [
        1,
        user?.name || '',
        user?.div || '',
        user?.rollNumber || '',
        selectedSubject,
        ...dailyStatus,
        totalPresentDays,
        totalAbsentDays,
        `${presentPercentage}%`
      ];

      const csv = [header, row].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `my_month_report_${user?.year || '2nd'}_${user?.sem || '3'}_${user?.div || 'A'}_${selectedSubject}_${startDate}_to_${endDate}.csv`);

    } catch (error) {
      alert('Failed to export month report.');
    } finally {
      setExporting(false);
    }
  };


  const handleCustomRangeConfirm = async () => {
    if (!customRangeFrom || !customRangeTo) {
      alert('Please select both start and end dates for the custom range.');
      return;
    }

    setExporting(true);
    try {
      // Generate all dates in the range
      const dates: string[] = [];
      const startDate = new Date(customRangeFrom);
      const endDate = new Date(customRangeTo);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const header = ['Sr No', 'Name', 'Division', 'Roll No', 'Subject', ...dates, 'Total Present Days', 'Total Absent Days', 'Present Percentage'];

      // Get student's custom range attendance data
      const rangeAttendance = await attendanceService.getOrganizedAttendanceByUserAndDateRange(
        user!.rollNumber!,
        user!.year || '2nd',
        user!.sem || '3',
        user!.div || 'A',
        selectedSubject,
        startDate,
        endDate
      );

      // Create a map of date to attendance status
      const attendanceByDate = new Map<string, string>();
      rangeAttendance.forEach(att => {
        const dateStr = att.date instanceof Date ? att.date.toISOString().split('T')[0] :
          (att.date as any)?.toDate?.()?.toISOString().split('T')[0] || att.date;
        attendanceByDate.set(dateStr, att.status);
      });

      // Generate daily attendance status for each date
      const dailyStatus = dates.map(date => {
        const status = attendanceByDate.get(date);
        return status === 'present' ? 'P' : status === 'absent' ? 'A' : '-';
      });

      // Calculate totals
      const totalPresentDays = rangeAttendance.filter(a => a.status === 'present').length;
      const totalAbsentDays = rangeAttendance.filter(a => a.status === 'absent').length;
      const totalDays = rangeAttendance.length;
      const presentPercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0;

      const row = [
        1,
        user?.name || '',
        user?.div || '',
        user?.rollNumber || '',
        selectedSubject,
        ...dailyStatus,
        totalPresentDays,
        totalAbsentDays,
        `${presentPercentage}%`
      ];

      const csv = [header, row].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `my_custom_range_${user?.year || '2nd'}_${user?.sem || '3'}_${user?.div || 'A'}_${selectedSubject}_${customRangeFrom}_to_${customRangeTo}.csv`);

    } catch (error) {
      alert('Failed to export custom range report.');
    } finally {
      setExporting(false);
      setShowCustomRangeInputs(false);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-slate-600">Access denied. Only students can view this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 lg:px-0">
      {/* Header */}
      <div className="theme-page-header">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="theme-page-title">My Attendance</h1>
            <p className="text-sm text-gray-600 mt-1">Track your personal attendance data</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              <span className="text-slate-500">Year:</span> {user.year}
            </span>
            <span className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              <span className="text-slate-500">Sem:</span> {user.sem}
            </span>
            <span className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              <span className="text-slate-500">Div:</span> {user.div}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="theme-card">
        <div className="theme-card-header">
          <h2 className="theme-section-title">Attendance Filters</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="theme-select"
                required
                disabled={subjectsLoading}
              >
                {subjectsLoading ? (
                  <option value="">Loading subjects...</option>
                ) : availableSubjects.length === 0 ? (
                  <option value="">No subjects available</option>
                ) : (
                  availableSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))
                )}
              </select>
              {subjectsLoading && (
                <div className="mt-2 text-xs text-slate-500 flex items-center">
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2"></div>
                  Loading subjects...
                </div>
              )}
              {!subjectsLoading && availableSubjects.length > 0 && (
                <div className="mt-2 text-xs text-emerald-600">
                  ✓ Found {availableSubjects.length} subjects
                </div>
              )}
              {!subjectsLoading && availableSubjects.length === 0 && (
                <div className="mt-2">
                  <div className="text-xs text-red-500 mb-2">No subjects found</div>
                  <button
                    onClick={loadSubjects}
                    className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="theme-input"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Selected:</span> {selectedDate || getTodayDate()}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportDailyReport}
                disabled={exporting || !selectedSubject || !selectedDate}
                className="theme-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Daily Report</span>
              </button>

              <button
                onClick={handleExportMonthReport}
                disabled={exporting || !selectedSubject}
                className="theme-btn-success disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Month Report</span>
              </button>

              <button
                onClick={() => setShowCustomRangeInputs(!showCustomRangeInputs)}
                disabled={exporting || !selectedSubject}
                className="theme-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>{showCustomRangeInputs ? 'Hide' : 'Custom Range'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Range Inputs */}
      {showCustomRangeInputs && (
        <div className="theme-card overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-purple-50">
            <h3 className="theme-section-title">Custom Date Range Report</h3>
            <p className="text-sm text-gray-600 mt-1">Select a date range to export attendance</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customRangeFrom" className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                <input
                  type="date"
                  id="customRangeFrom"
                  value={customRangeFrom}
                  onChange={(e) => setCustomRangeFrom(e.target.value)}
                  className="theme-input"
                />
              </div>
              <div>
                <label htmlFor="customRangeTo" className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                <input
                  type="date"
                  id="customRangeTo"
                  value={customRangeTo}
                  onChange={(e) => setCustomRangeTo(e.target.value)}
                  className="theme-input"
                />
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={() => {
                setShowCustomRangeInputs(false);
                setCustomRangeFrom('');
                setCustomRangeTo('');
              }}
              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomRangeConfirm}
              disabled={exporting || !customRangeFrom || !customRangeTo}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Downloading...' : 'Download Report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && !error && studentAttendanceData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="theme-stats-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-slate-700" />
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${studentAttendanceData[0]?.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                studentAttendanceData[0]?.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {studentAttendanceData[0]?.status === 'present' ? 'Present' :
                  studentAttendanceData[0]?.status === 'absent' ? 'Absent' : 'N/A'}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {studentAttendanceData[0]?.status === 'present' ? 'P' :
                studentAttendanceData[0]?.status === 'absent' ? 'A' : '—'}
            </p>
            <p className="text-sm text-slate-500 mt-1">Today's Status</p>
          </div>

          <div className="theme-stats-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{selectedSubject || '—'}</p>
            <p className="text-sm text-gray-500 mt-1">Subject</p>
          </div>

          <div className="theme-stats-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{selectedDate || getTodayDate()}</p>
            <p className="text-sm text-gray-500 mt-1">Selected Date</p>
          </div>

          <div className="theme-stats-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(studentAttendanceData[0]?.attendancePercentage || 0) >= 75 ? 'bg-emerald-100 text-emerald-700' :
                (studentAttendanceData[0]?.attendancePercentage || 0) >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                {(studentAttendanceData[0]?.attendancePercentage || 0) >= 75 ? 'Good' : 'Low'}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{studentAttendanceData[0]?.attendancePercentage || 0}%</p>
            <p className="text-sm text-slate-500 mt-1">Attendance Rate</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="theme-card p-8">
          <div className="flex items-center justify-center">
            <div className="theme-spinner"></div>
            <span className="ml-3 text-sm text-gray-600">Loading attendance data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="theme-info-box-red p-6">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-2">Please check your selection and try again.</p>
        </div>
      )}

      {/* Student Attendance Table */}
      {!loading && !error && studentAttendanceData.length > 0 && (
        <div className="theme-card overflow-hidden">
          <div className="theme-card-header">
            <h2 className="theme-section-title">Attendance Details</h2>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {studentAttendanceData.map((data, index) => (
              <div key={index} className="p-5 border-b border-slate-100 last:border-b-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{user?.name}</h3>
                      <p className="text-xs text-slate-500">Roll No: {user?.rollNumber}</p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${data.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        data.status === 'absent' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {data.status === 'present' ? 'Present' :
                        data.status === 'absent' ? 'Absent' : 'Not Marked'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-slate-500">Subject</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{selectedSubject}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-sm font-medium text-slate-900">{selectedDate || getTodayDate()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-emerald-50 p-2 rounded-lg">
                      <p className="text-xs text-emerald-600 mb-1">Present</p>
                      <span className="text-lg font-bold text-emerald-700">{data.presentCount}</span>
                    </div>
                    <div className="text-center bg-red-50 p-2 rounded-lg">
                      <p className="text-xs text-red-600 mb-1">Absent</p>
                      <span className="text-lg font-bold text-red-700">{data.absentCount}</span>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${data.attendancePercentage >= 75 ? 'bg-emerald-50' :
                        data.attendancePercentage >= 60 ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                      <p className={`text-xs mb-1 ${data.attendancePercentage >= 75 ? 'text-emerald-600' :
                          data.attendancePercentage >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>Rate</p>
                      <span className={`text-lg font-bold ${data.attendancePercentage >= 75 ? 'text-emerald-700' :
                          data.attendancePercentage >= 60 ? 'text-amber-700' : 'text-red-700'
                        }`}>{data.attendancePercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sr No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {studentAttendanceData.map((data, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{user?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user?.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{selectedSubject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${data.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                          data.status === 'absent' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {data.status === 'present' ? 'Present' :
                          data.status === 'absent' ? 'Absent' : 'Not Marked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                        {data.presentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        {data.absentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${data.attendancePercentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                          data.attendancePercentage >= 60 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {data.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && studentAttendanceData.length === 0 && (
        <div className="theme-card p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">No attendance data found</p>
          <p className="text-xs text-gray-500 mt-1">Please check if attendance has been marked for the selected subject and date.</p>
        </div>
      )}
    </div>
  );
};

export default StudentMyAttendance;

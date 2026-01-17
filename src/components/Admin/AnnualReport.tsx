import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  FileText,
  CheckCircle,
  BookOpen,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  Activity,
  X,
  Eye,
  Search
} from 'lucide-react';
import { userService, leaveService, attendanceService, getCurrentBatchYear } from '../../firebase/firestore';
import { db } from '../../firebase/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface AnnualReportData {
  year: string;
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalCourses: number;
  totalLeaveRequests: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  totalAttendanceDays: number;
  averageAttendance: number;
  departmentBreakdown: {
    name: string;
    students: number;
    teachers: number;
    courses: number;
  }[];
  monthlyStats: {
    month: string;
    students: number;
    leaves: number;
    attendance: number;
  }[];
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  yearWiseDistribution: {
    year: string;
    students: number;
  }[];
}

const AnnualReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<AnnualReportData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailType, setDetailType] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filteredDetailData, setFilteredDetailData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const loadReportData = async (year: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch all data in parallel
      // Note: For full year attendance, we would need to query attendance collection for the year
      // For now, using today's attendance as baseline and calculating from leave requests
      const [usersData, leaveRequestsData] = await Promise.all([
        userService.getAllUsers().catch(() => []),
        leaveService.getAllLeaveRequests().catch(() => [])
      ]);
      
      // Store for detail views
      setAllUsers(usersData);
      setAllLeaveRequests(leaveRequestsData);
      
      // Get today's attendance as a baseline (in production, fetch all attendance for the year)
      const todayAttendance = await attendanceService.getTodayAttendance().catch(() => []);

      // Filter students and teachers
      const students = usersData.filter(u => u.role === 'student');
      const teachers = usersData.filter(u => u.role === 'teacher' || u.role === 'hod');

      // Get departments
      const departments = [...new Set(usersData.map(u => u.department).filter(Boolean))];

      // Filter data by year (based on batch year for students, creation date for others)
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);

      const yearStudents = students.filter(s => {
        const batchYear = (s as any).batchYear;
        return batchYear === year || !batchYear; // Include if batch matches or no batch year
      });

      const yearLeaveRequests = leaveRequestsData.filter(leave => {
        const createdAt = leave.createdAt as any;
        const leaveDate = createdAt instanceof Date 
          ? createdAt 
          : typeof createdAt?.toDate === 'function'
            ? createdAt.toDate() 
            : new Date(createdAt || '');
        return leaveDate >= yearStart && leaveDate <= yearEnd;
      });

      const yearAttendance = (todayAttendance || []).filter(att => {
        const dateField = att.date as any;
        const attDate = dateField instanceof Date 
          ? dateField 
          : typeof dateField?.toDate === 'function'
            ? dateField.toDate() 
            : new Date(dateField || '');
        return attDate >= yearStart && attDate <= yearEnd;
      });

      // Count leave requests by status
      const approvedLeaves = yearLeaveRequests.filter(l => l.status === 'approved').length;
      const rejectedLeaves = yearLeaveRequests.filter(l => l.status === 'rejected').length;
      const pendingLeaves = yearLeaveRequests.filter(l => l.status === 'pending').length;

      // Calculate attendance stats
      const uniqueAttendanceDays = new Set(yearAttendance.map(a => {
        const dateField = a.date as any;
        const date = dateField instanceof Date ? dateField : typeof dateField?.toDate === 'function' ? dateField.toDate() : new Date(dateField || '');
        return date.toISOString().split('T')[0];
      })).size;

      const presentCount = yearAttendance.filter(a => a.status === 'present').length;
      const totalCount = yearAttendance.length;
      const averageAttendance = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      // Department breakdown
      const departmentBreakdown = departments.map(dept => {
        const deptStudents = yearStudents.filter(s => s.department === dept);
        const deptTeachers = teachers.filter(t => t.department === dept);
        
        // Try to get courses for this department
        let deptCourses = 0;
        try {
          // This would require course data - for now we'll use 0 or fetch separately
          // Courses would be fetched from the courses collection
        } catch (err) {
          console.error('Error fetching courses:', err);
        }

        return {
          name: dept,
          students: deptStudents.length,
          teachers: deptTeachers.length,
          courses: deptCourses
        };
      }).filter(dept => dept.students > 0 || dept.teachers > 0);

      // Monthly stats
      const monthlyStats = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(parseInt(year), i, 1);
        const monthEnd = new Date(parseInt(year), i + 1, 0);

        const monthLeaves = yearLeaveRequests.filter(leave => {
          const createdAt = leave.createdAt as any;
          const leaveDate = createdAt instanceof Date 
            ? createdAt 
            : typeof createdAt?.toDate === 'function'
              ? createdAt.toDate() 
              : new Date(createdAt || '');
          return leaveDate >= monthStart && leaveDate <= monthEnd;
        }).length;

        const monthAttendance = yearAttendance.filter(att => {
          const dateField = att.date as any;
          const attDate = dateField instanceof Date 
            ? dateField 
            : typeof dateField?.toDate === 'function'
              ? dateField.toDate() 
              : new Date(dateField || '');
          return attDate >= monthStart && attDate <= monthEnd;
        }).length;

        return {
          month: new Date(parseInt(year), i).toLocaleString('default', { month: 'short' }),
          students: yearStudents.length, // Total students for the year
          leaves: monthLeaves,
          attendance: monthAttendance
        };
      });

      // Gender distribution
      const genderDistribution = {
        male: students.filter(s => (s.gender || '').toLowerCase() === 'male' || (s.gender || '').toLowerCase() === 'm').length,
        female: students.filter(s => (s.gender || '').toLowerCase() === 'female' || (s.gender || '').toLowerCase() === 'f').length,
        other: students.filter(s => {
          const gender = (s.gender || '').toLowerCase();
          return gender !== 'male' && gender !== 'm' && gender !== 'female' && gender !== 'f' && gender !== '';
        }).length
      };

      // Year-wise distribution
      const yearWiseDistribution = ['1st', '2nd', '3rd', '4th'].map(yr => ({
        year: yr,
        students: yearStudents.filter(s => s.year === yr).length
      }));

      // Fetch courses count (if courses collection exists)
      let totalCourses = 0;
      try {
        const currentBatch = getCurrentBatchYear();
        const coursesQuery = query(collection(db, `batches/${currentBatch}/courses`));
        const coursesSnapshot = await getDocs(coursesQuery);
        totalCourses = coursesSnapshot.size;
      } catch (err) {
        // If courses are stored differently, this will handle the error
        console.log('Courses may be stored in a different structure');
      }

      const report: AnnualReportData = {
        year,
        totalStudents: yearStudents.length,
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        totalCourses,
        totalLeaveRequests: yearLeaveRequests.length,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        totalAttendanceDays: uniqueAttendanceDays,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        departmentBreakdown,
        monthlyStats,
        genderDistribution,
        yearWiseDistribution
      };

      setReportData(report);
    } catch (error) {
      console.error('Error loading annual report data:', error);
      alert('Failed to load annual report data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData(selectedYear);
  }, [selectedYear]);

  const handleExport = () => {
    if (!reportData) return;

    const exportData = {
      'Annual Report': {
        'Year': reportData.year,
        'Total Students': reportData.totalStudents,
        'Total Teachers': reportData.totalTeachers,
        'Total Departments': reportData.totalDepartments,
        'Total Courses': reportData.totalCourses,
        'Total Leave Requests': reportData.totalLeaveRequests,
        'Approved Leaves': reportData.approvedLeaves,
        'Rejected Leaves': reportData.rejectedLeaves,
        'Pending Leaves': reportData.pendingLeaves,
        'Total Attendance Days': reportData.totalAttendanceDays,
        'Average Attendance (%)': reportData.averageAttendance
      },
      'Department Breakdown': reportData.departmentBreakdown.map(dept => ({
        'Department': dept.name,
        'Students': dept.students,
        'Teachers': dept.teachers,
        'Courses': dept.courses
      })),
      'Monthly Statistics': reportData.monthlyStats.map(stat => ({
        'Month': stat.month,
        'Students': stat.students,
        'Leave Requests': stat.leaves,
        'Attendance Records': stat.attendance
      })),
      'Gender Distribution': [
        { 'Gender': 'Male', 'Count': reportData.genderDistribution.male },
        { 'Gender': 'Female', 'Count': reportData.genderDistribution.female },
        { 'Gender': 'Other', 'Count': reportData.genderDistribution.other }
      ],
      'Year-wise Distribution': reportData.yearWiseDistribution.map(dist => ({
        'Year': dist.year,
        'Students': dist.students
      }))
    };

    const workbook = XLSX.utils.book_new();
    
    Object.entries(exportData).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const filename = `Annual_Report_${reportData.year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleStatClick = async (type: string) => {
    setDetailLoading(true);
    setDetailType(type);
    setShowDetailModal(true);

    try {
      let data: any[] = [];

      switch (type) {
        case 'students':
          data = allUsers.filter(u => u.role === 'student')
            .map(s => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone || '-',
              rollNumber: s.rollNumber || '-',
              department: s.department || '-',
              year: s.year || '-',
              sem: s.sem || '-',
              div: s.div || '-',
              gender: s.gender || '-'
            }));
          break;

        case 'teachers':
          data = allUsers.filter(u => u.role === 'teacher' || u.role === 'hod')
            .map(t => ({
              id: t.id,
              name: t.name,
              email: t.email,
              phone: t.phone || '-',
              department: t.department || '-',
              role: t.role,
              designation: t.designation || '-'
            }));
          break;

        case 'departments':
          const depts = [...new Set(allUsers.map(u => u.department).filter(Boolean))];
          data = depts.map(dept => {
            const deptStudents = allUsers.filter(u => u.role === 'student' && u.department === dept);
            const deptTeachers = allUsers.filter(u => (u.role === 'teacher' || u.role === 'hod') && u.department === dept);
            return {
              name: dept,
              students: deptStudents.length,
              teachers: deptTeachers.length,
              studentDetails: deptStudents.map(s => s.name).join(', ') || 'None',
              teacherDetails: deptTeachers.map(t => t.name).join(', ') || 'None'
            };
          });
          break;

        case 'leaves':
          data = allLeaveRequests.map(leave => ({
            id: leave.id,
            studentName: leave.studentName || '-',
            studentEmail: leave.studentEmail || '-',
            fromDate: leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-',
            toDate: leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-',
            reason: leave.reason || '-',
            status: leave.status || '-',
            type: leave.type || '-'
          }));
          break;

        case 'approved':
          data = allLeaveRequests.filter(l => l.status === 'approved')
            .map(leave => ({
              id: leave.id,
              studentName: leave.studentName || '-',
              studentEmail: leave.studentEmail || '-',
              fromDate: leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-',
              toDate: leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-',
              reason: leave.reason || '-',
              type: leave.type || '-'
            }));
          break;

        case 'rejected':
          data = allLeaveRequests.filter(l => l.status === 'rejected')
            .map(leave => ({
              id: leave.id,
              studentName: leave.studentName || '-',
              studentEmail: leave.studentEmail || '-',
              fromDate: leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-',
              toDate: leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-',
              reason: leave.reason || '-',
              type: leave.type || '-'
            }));
          break;

        case 'pending':
          data = allLeaveRequests.filter(l => l.status === 'pending')
            .map(leave => ({
              id: leave.id,
              studentName: leave.studentName || '-',
              studentEmail: leave.studentEmail || '-',
              fromDate: leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '-',
              toDate: leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '-',
              reason: leave.reason || '-',
              type: leave.type || '-'
            }));
          break;

        default:
          data = [];
      }

      setDetailData(data);
      setFilteredDetailData(data);
      setSearchTerm('');
      setDepartmentFilter('all');
      setStatusFilter('all');
    } catch (error) {
      console.error('Error loading detail data:', error);
      setDetailData([]);
      setFilteredDetailData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!detailData.length) {
      setFilteredDetailData([]);
      return;
    }

    let filtered = [...detailData];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => {
        if (detailType === 'students' || detailType === 'teachers') {
          return (
            item.name?.toLowerCase().includes(term) ||
            item.email?.toLowerCase().includes(term) ||
            item.rollNumber?.toLowerCase().includes(term) ||
            item.phone?.toLowerCase().includes(term) ||
            item.department?.toLowerCase().includes(term)
          );
        } else if (detailType === 'departments') {
          return (
            item.name?.toLowerCase().includes(term) ||
            item.studentDetails?.toLowerCase().includes(term) ||
            item.teacherDetails?.toLowerCase().includes(term)
          );
        } else {
          // Leaves
          return (
            item.studentName?.toLowerCase().includes(term) ||
            item.studentEmail?.toLowerCase().includes(term) ||
            item.reason?.toLowerCase().includes(term) ||
            item.type?.toLowerCase().includes(term)
          );
        }
      });
    }

    // Apply department filter
    if (departmentFilter !== 'all' && (detailType === 'students' || detailType === 'teachers')) {
      filtered = filtered.filter((item: any) => item.department === departmentFilter);
    }

    // Apply status filter for leaves
    if (statusFilter !== 'all' && (detailType === 'leaves' || detailType === 'approved' || detailType === 'rejected' || detailType === 'pending')) {
      filtered = filtered.filter((item: any) => item.status === statusFilter);
    }

    setFilteredDetailData(filtered);
  }, [detailData, searchTerm, departmentFilter, statusFilter, detailType]);

  const handleDownloadReport = () => {
    if (filteredDetailData.length === 0) {
      alert('No data to export');
      return;
    }

    let exportData: any[] = [];

    if (detailType === 'students') {
      exportData = filteredDetailData.map((student: any) => ({
        'Name': student.name,
        'Roll Number': student.rollNumber,
        'Email': student.email,
        'Phone': student.phone,
        'Department': student.department,
        'Year': student.year,
        'Semester': student.sem,
        'Division': student.div,
        'Gender': student.gender
      }));
    } else if (detailType === 'teachers') {
      exportData = filteredDetailData.map((teacher: any) => ({
        'Name': teacher.name,
        'Email': teacher.email,
        'Phone': teacher.phone,
        'Department': teacher.department,
        'Role': teacher.role,
        'Designation': teacher.designation
      }));
    } else if (detailType === 'departments') {
      exportData = filteredDetailData.map((dept: any) => ({
        'Department': dept.name,
        'Students': dept.students,
        'Teachers': dept.teachers,
        'Student List': dept.studentDetails,
        'Teacher List': dept.teacherDetails
      }));
    } else {
      // Leaves
      exportData = filteredDetailData.map((leave: any) => ({
        'Student Name': leave.studentName,
        'Email': leave.studentEmail,
        'From Date': leave.fromDate,
        'To Date': leave.toDate,
        'Type': leave.type,
        'Status': leave.status,
        'Reason': leave.reason
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, getDetailTitle());

    const filename = `${getDetailTitle()}_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const getAvailableDepartments = () => {
    if (detailType === 'students' || detailType === 'teachers') {
      const depts = [...new Set(detailData.map((item: any) => item.department).filter(Boolean))];
      return depts.sort();
    }
    return [];
  };

  const getDetailTitle = () => {
    switch (detailType) {
      case 'students': return 'All Students';
      case 'teachers': return 'All Teachers';
      case 'departments': return 'Department Details';
      case 'leaves': return 'All Leave Requests';
      case 'approved': return 'Approved Leaves';
      case 'rejected': return 'Rejected Leaves';
      case 'pending': return 'Pending Leaves';
      default: return 'Details';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading annual report data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          Failed to load report data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Annual Report</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive annual statistics and analytics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
          <button
            onClick={() => loadReportData(selectedYear, true)}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          onClick={() => handleStatClick('students')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{reportData.totalStudents}</p>
          <p className="text-sm text-slate-500 mt-1">Total Students</p>
        </button>

        <button
          onClick={() => handleStatClick('teachers')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{reportData.totalTeachers}</p>
          <p className="text-sm text-slate-500 mt-1">Total Teachers</p>
        </button>

        <button
          onClick={() => handleStatClick('departments')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{reportData.totalDepartments}</p>
          <p className="text-sm text-slate-500 mt-1">Departments</p>
        </button>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reportData.totalCourses}</p>
          <p className="text-sm text-slate-500 mt-1">Total Courses</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reportData.averageAttendance}%</p>
          <p className="text-sm text-slate-500 mt-1">Avg Attendance</p>
        </div>
      </div>

      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleStatClick('leaves')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{reportData.totalLeaveRequests}</p>
              <p className="text-sm text-slate-500">Total Leaves</p>
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          onClick={() => handleStatClick('approved')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{reportData.approvedLeaves}</p>
              <p className="text-sm text-slate-500">Approved</p>
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          onClick={() => handleStatClick('rejected')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-red-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{reportData.rejectedLeaves}</p>
              <p className="text-sm text-slate-500">Rejected</p>
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          onClick={() => handleStatClick('pending')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-slate-900">{reportData.pendingLeaves}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Department Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Department</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Students</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Teachers</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Courses</th>
              </tr>
            </thead>
            <tbody>
              {reportData.departmentBreakdown.map((dept, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{dept.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{dept.students}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{dept.teachers}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{dept.courses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gender Distribution
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Male</span>
              <span className="text-lg font-semibold text-slate-900">{reportData.genderDistribution.male}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(reportData.genderDistribution.male / reportData.totalStudents) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Female</span>
              <span className="text-lg font-semibold text-slate-900">{reportData.genderDistribution.female}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full"
                style={{ width: `${(reportData.genderDistribution.female / reportData.totalStudents) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Other</span>
              <span className="text-lg font-semibold text-slate-900">{reportData.genderDistribution.other}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-slate-600 h-2 rounded-full"
                style={{ width: `${(reportData.genderDistribution.other / reportData.totalStudents) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Year-wise Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Year-wise Distribution
          </h2>
          <div className="space-y-4">
            {reportData.yearWiseDistribution.map((dist, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{dist.year} Year</span>
                  <span className="text-lg font-semibold text-slate-900">{dist.students}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${(dist.students / reportData.totalStudents) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Statistics ({reportData.year})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Students</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Leave Requests</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Attendance Records</th>
              </tr>
            </thead>
            <tbody>
              {reportData.monthlyStats.map((stat, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-900">{stat.month}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{stat.students}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{stat.leaves}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">{stat.attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Attendance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">Total Attendance Days</p>
            <p className="text-3xl font-bold text-slate-900">{reportData.totalAttendanceDays}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Average Attendance Rate</p>
            <p className="text-3xl font-bold text-slate-900">{reportData.averageAttendance}%</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">{getDetailTitle()}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailType(null);
                  setDetailData([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Filters and Download Button */}
              {!detailLoading && detailData.length > 0 && (
                <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {(detailType === 'students' || detailType === 'teachers') && (
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Departments</option>
                        {getAvailableDepartments().map((dept: string) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    )}

                    {(detailType === 'leaves' || detailType === 'approved' || detailType === 'rejected' || detailType === 'pending') && (
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="pending">Pending</option>
                      </select>
                    )}

                    <button
                      onClick={handleDownloadReport}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Report
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Showing {filteredDetailData.length} of {detailData.length} records
                  </p>
                </div>
              )}

              <div className="p-6">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading details...</p>
                    </div>
                  </div>
                ) : filteredDetailData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No data available{searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' ? ' matching your filters' : ''}</p>
                    {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setDepartmentFilter('all');
                          setStatusFilter('all');
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  {detailType === 'students' && (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Roll Number</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Phone</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Year/Sem/Div</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Gender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetailData.map((student: any) => (
                          <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{student.name}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.rollNumber}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.email}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.phone}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.department}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.year}/{student.sem}/{student.div}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{student.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {detailType === 'teachers' && (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Phone</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Department</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Designation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetailData.map((teacher: any) => (
                          <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{teacher.name}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{teacher.email}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{teacher.phone}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{teacher.department}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 capitalize">{teacher.role?.toUpperCase()}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{teacher.designation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {detailType === 'departments' && (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Department</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Students</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Teachers</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Students List</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Teachers List</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetailData.map((dept: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900">{dept.name}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 text-right">{dept.students}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 text-right">{dept.teachers}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{dept.studentDetails}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{dept.teacherDetails}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {(detailType === 'leaves' || detailType === 'approved' || detailType === 'rejected' || detailType === 'pending') && (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Student Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">From Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">To Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetailData.map((leave: any) => (
                          <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900">{leave.studentName}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{leave.studentEmail}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{leave.fromDate}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{leave.toDate}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 capitalize">{leave.type}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{leave.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default AnnualReport;

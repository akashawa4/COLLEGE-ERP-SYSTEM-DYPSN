import React, { useState, useEffect } from 'react';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService, attendanceService, userService, getBatchYear, notificationService } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { Calendar, Users, Plus, Eye, Bell, GraduationCap, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, BookOpen, FileText, UserCheck, Settings, Target, Award, Activity, RefreshCw } from 'lucide-react';

// Helper function to get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};

import TeacherStudentPanel from '../StudentManagement/TeacherStudentPanel';
import TeacherManagementPanel from '../TeacherManagement/TeacherManagementPanel';
import AdminDashboard from './AdminDashboard';

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

interface StudentData {
  year: string;
  sem: string;
  div: string;
  count: number;
  students: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { user } = useAuth();
  const [currentGreeting, setCurrentGreeting] = useState(getGreeting());
  const [dashboardData, setDashboardData] = useState({
    attendance: { present: 0, total: 0, percentage: 0 },
    leaveBalance: { total: 0, casual: 0, sick: 0 },
    pendingRequests: 0,
    approvedLeaves: 0
  });
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  
  // HOD and Teacher specific data
  const [departmentStats, setDepartmentStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    pendingLeaves: 0,
    lowAttendanceStudents: 0,
    recentActivities: 0
  });
  const [attendanceOverview, setAttendanceOverview] = useState({
    todayPresent: 0,
    todayAbsent: 0,
    thisWeekAverage: 0,
    thisMonthAverage: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageAttendance: 0,
    topPerformers: 0,
    needsAttention: 0,
    recentImprovements: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Update greeting periodically
  useEffect(() => {
    const updateGreeting = () => {
      setCurrentGreeting(getGreeting());
    };

    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000);
    
    // Initial update
    updateGreeting();

    return () => clearInterval(interval);
  }, []);

  // Load dashboard data function
  const loadDashboardData = async (isRefresh = false) => {
    if (!user) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
        
        if (user.role === 'student') {
          // Load student-specific data only
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Get attendance data for current month
          const attendanceData = await attendanceService.getAttendanceByUser(user.id);
          const currentMonthAttendance = attendanceData.filter((record: any) => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
          });
          const presentDays = currentMonthAttendance.filter((record: any) => record.status === 'present').length;
          const totalDays = currentMonthAttendance.length;
          const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';
          
          // Get leave data for this student only
          const leaveRequests = await leaveService.getLeaveRequestsByUser(user.id);
          const pendingCount = leaveRequests.filter(leave => leave.status === 'pending').length;
          const approvedCount = leaveRequests.filter(leave => leave.status === 'approved').length;
          
          // Calculate leave balance (assuming standard balances)
          const leaveBalance = {
            total: 12, // Standard annual leave balance
            casual: Math.max(0, 3 - leaveRequests.filter(leave => leave.leaveType === 'CL' && leave.status === 'approved').length),
            sick: Math.max(0, 5 - leaveRequests.filter(leave => leave.leaveType === 'SL' && leave.status === 'approved').length)
          };
          
          setDashboardData({
            attendance: { present: presentDays, total: totalDays, percentage: parseFloat(percentage) },
            leaveBalance,
            pendingRequests: pendingCount,
            approvedLeaves: approvedCount
          });
          
          // Students don't need student data
          setStudentData([]);
          setTotalStudents(0);
        } else if (user.role === 'teacher' || user.role === 'hod') {
          // Load CSE department student data for teachers/HODs only
          try {
            // Use batch structure to get students from ALL years/semesters/divisions
            const batch = getBatchYear(user.year || '4th'); // Use same logic as DashboardStats
            const department = getDepartmentCode(user.department); // Use user's department
            const years = ['2nd', '3rd', '4th'];
            const semsByYear: Record<string, string[]> = { '2nd': ['3','4'], '3rd': ['5','6'], '4th': ['7','8'] };
            const divs = ['A','B','C','D'];
            
            const allStudents: any[] = [];
            
            // Load students from all combinations
            for (const year of years) {
              const sems = semsByYear[year] || [];
              for (const sem of sems) {
                for (const div of divs) {
                  try {
                    const students = await userService.getStudentsByBatchDeptYearSemDiv(batch, department, year, sem, div);
                    allStudents.push(...students);
                  } catch (error) {
                    // Ignore missing collections
                  }
                }
              }
            }
            
            // Filter for CSE students with more flexible matching
            const cseStudents = allStudents.filter(student => {
              const isStudent = student.role === 'student';
              const isCSE = student.department && 
                (student.department === 'CSE' || 
                 student.department === 'cse' || 
                 student.department === 'Computer Science' ||
                 student.department === 'computer science');
              
              // More flexible year matching
              const year = student.year?.toString().toLowerCase();
              const isValidYear = year && (
                year === '2' || year === '3' || year === '4' ||
                year.includes('2') || year.includes('3') || year.includes('4') ||
                year.includes('2nd') || year.includes('3rd') || year.includes('4th') ||
                year.includes('second') || year.includes('third') || year.includes('fourth')
              );
              
              return isStudent && isCSE && isValidYear;
            });
            
            // If no CSE students found, try to find any students with year/sem/div data
            let studentsToUse = cseStudents;
            if (cseStudents.length === 0) {
              const studentsWithYearData = allStudents.filter(s => 
                s.role === 'student' && s.year && s.sem && s.div
              );
              if (studentsWithYearData.length > 0) {
                studentsToUse = studentsWithYearData;
              }
            }
            
            // Group students by year, semester, and division
            const groupedData: { [key: string]: any[] } = {};
            studentsToUse.forEach(student => {
              if (student.year && student.sem && student.div) {
                const key = `${student.year}-${student.sem}-${student.div}`;
                if (!groupedData[key]) {
                  groupedData[key] = [];
                }
                groupedData[key].push(student);
              }
            });

            // Convert to array format for easier processing
            const studentDataArray: StudentData[] = Object.entries(groupedData).map(([key, students]) => {
              const [year, sem, div] = key.split('-');
              return {
                year,
                sem,
                div,
                count: students.length,
                students
              };
            });

            // Sort by year, then semester, then division
            studentDataArray.sort((a, b) => {
              if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
              if (a.sem !== b.sem) return parseInt(a.sem) - parseInt(b.sem);
              return a.div.localeCompare(b.div);
            });

            setStudentData(studentDataArray);
            setTotalStudents(studentsToUse.length);

            // Load additional HOD/Teacher specific data
            await loadHODTeacherData(user, studentsToUse);
          } catch (error) {
            // Set default values to prevent showing wrong data
            setStudentData([]);
            setTotalStudents(0);
          }
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Refresh function
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Load HOD and Teacher specific data
  const loadHODTeacherData = async (user: any, students: any[]) => {
    try {
      // Load department statistics
      const allUsers = await userService.getAllUsers();
      const departmentUsers = allUsers.filter(u => u.department === user.department);
      const departmentStudents = departmentUsers.filter(u => u.role === 'student');
      const departmentTeachers = departmentUsers.filter(u => u.role === 'teacher' || u.role === 'hod');

      // Load today's attendance
      const todayAttendance = await attendanceService.getTodayAttendance();
      const departmentAttendance = todayAttendance.filter(att => 
        departmentStudents.some(student => student.id === att.userId)
      );

      // Load pending leave requests for department
      const allLeaveRequests = await leaveService.getAllLeaveRequests();
      const departmentLeaves = allLeaveRequests.filter(leave => 
        departmentStudents.some(student => student.id === leave.userId)
      );

      // Load notifications
      const userNotifications = await notificationService.getNotificationsByUser(user.id);
      const recentNotifications = userNotifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Calculate attendance rates
      const presentToday = departmentAttendance.filter(att => att.status === 'present').length;
      const totalToday = departmentAttendance.length;
      const todayRate = totalToday > 0 ? (presentToday / totalToday) * 100 : 0;

      // Calculate low attendance students (below 75%)
      const studentAttendanceRates = await Promise.all(
        departmentStudents.map(async (student) => {
          const studentAttendance = await attendanceService.getAttendanceByUser(student.id);
          const presentCount = studentAttendance.filter(att => att.status === 'present').length;
          const totalCount = studentAttendance.length;
          return {
            id: student.id,
            name: student.name,
            rate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0
          };
        })
      );

      const lowAttendanceStudents = studentAttendanceRates.filter(s => s.rate < 75).length;

      // Update state
      setDepartmentStats({
        totalStudents: departmentStudents.length,
        totalTeachers: departmentTeachers.length,
        attendanceRate: todayRate,
        pendingLeaves: departmentLeaves.filter(leave => leave.status === 'pending').length,
        lowAttendanceStudents,
        recentActivities: recentNotifications.length
      });

      setAttendanceOverview({
        todayPresent: presentToday,
        todayAbsent: totalToday - presentToday,
        thisWeekAverage: 85, // Mock data - would need weekly calculation
        thisMonthAverage: 82 // Mock data - would need monthly calculation
      });

      setPerformanceMetrics({
        averageAttendance: todayRate,
        topPerformers: studentAttendanceRates.filter(s => s.rate >= 90).length,
        needsAttention: lowAttendanceStudents,
        recentImprovements: 0 // Mock data
      });

      setNotifications(recentNotifications);
      setRecentLeaves(departmentLeaves.slice(0, 5));

    } catch (error) {
      console.error('Error loading HOD/Teacher data:', error);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 lg:p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentGreeting}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600 text-base lg:text-lg">
              {user?.accessLevel === 'full' 
                ? 'Here\'s your organization overview for today'
                : 'Here\'s your attendance and leave summary'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 text-sm text-gray-600 bg-white/60 px-3 py-2 rounded-xl hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:block">Refresh</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/60 px-4 py-2 rounded-xl">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:block">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Admin Dashboard Section */}
      {user?.role === 'admin' && (
        <AdminDashboard onPageChange={onPageChange} />
      )}

      {/* HOD Management Section */}
      {user?.role === 'hod' && (
        <div className="space-y-4">
          {/* Management Toggle Buttons */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <button
              onClick={() => {
                setShowStudentManagement(!showStudentManagement);
                setShowTeacherManagement(false);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-mobile flex items-center gap-2 ${
                showStudentManagement 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              {showStudentManagement ? 'Hide Students' : 'Student Management'}
            </button>
            
            <button
              onClick={() => {
                setShowTeacherManagement(!showTeacherManagement);
                setShowStudentManagement(false);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-mobile flex items-center gap-2 ${
                showTeacherManagement 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <GraduationCap size={18} />
              {showTeacherManagement ? 'Hide Teachers' : 'Teacher Management'}
            </button>
          </div>

          {/* Student Management Panel */}
          {showStudentManagement && (
            <TeacherStudentPanel user={user} />
          )}

          {/* Teacher Management Panel */}
          {showTeacherManagement && (
            <TeacherManagementPanel />
          )}
        </div>
      )}

      {/* Dashboard Stats - Only show for non-admin users */}
      {user?.role !== 'admin' && (
        <DashboardStats 
          dashboardData={dashboardData} 
          loading={loading}
          studentData={studentData}
          totalStudents={totalStudents}
          userRole={user?.role || ''}
        />
      )}

      {/* Enhanced HOD and Teacher Dashboard Sections */}
      {(user?.role === 'hod' || user?.role === 'teacher') && (
        <>
          {/* Department Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      departmentStats.totalStudents
                    )}
                  </p>
                  <p className="text-xs text-green-600">Active students</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      `${attendanceOverview.todayPresent}/${attendanceOverview.todayPresent + attendanceOverview.todayAbsent}`
                    )}
                  </p>
                  <p className="text-xs text-green-600">
                    {loading ? 'Loading...' : `${departmentStats.attendanceRate.toFixed(1)}% present`}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      departmentStats.pendingLeaves
                    )}
                  </p>
                  <p className="text-xs text-amber-600">Requires attention</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      departmentStats.lowAttendanceStudents
                    )}
                  </p>
                  <p className="text-xs text-red-600">Below 75%</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Present Today</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {loading ? '...' : attendanceOverview.todayPresent}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Absent Today</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {loading ? '...' : attendanceOverview.todayAbsent}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">This Week Avg</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {loading ? '...' : `${attendanceOverview.thisWeekAverage}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">This Month Avg</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {loading ? '...' : `${attendanceOverview.thisMonthAverage}%`}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Top Performers</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {loading ? '...' : performanceMetrics.topPerformers}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Need Attention</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {loading ? '...' : performanceMetrics.needsAttention}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Avg Attendance</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {loading ? '...' : `${performanceMetrics.averageAttendance.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Recent Improvements</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {loading ? '...' : performanceMetrics.recentImprovements}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for HOD and Teachers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => onPageChange?.('take-attendance')}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors active:scale-95 border border-blue-100"
              >
                <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-blue-700 font-medium text-sm text-center">Take Attendance</span>
              </button>
              <button 
                onClick={() => onPageChange?.('leave-approval')}
                className="flex flex-col items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors active:scale-95 border border-amber-100"
              >
                <FileText className="w-8 h-8 text-amber-600 mb-2" />
                <span className="text-amber-700 font-medium text-sm text-center">Approve Leaves</span>
              </button>
              <button 
                onClick={() => onPageChange?.('student-management')}
                className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors active:scale-95 border border-green-100"
              >
                <Users className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-green-700 font-medium text-sm text-center">Manage Students</span>
              </button>
              <button 
                onClick={() => onPageChange?.('notifications')}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors active:scale-95 border border-purple-100"
              >
                <Bell className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-purple-700 font-medium text-sm text-center">Notifications</span>
              </button>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.category === 'urgent' ? 'bg-red-500' :
                      notification.category === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Admin Section - Only show for HOD users */}
      {user?.role === 'hod' ? (
        <>
          <div className="grid grid-cols-1 gap-6">
            <RecentActivity />
          </div>
        </>
      ) : (
        /* Student Quick Actions */
        <div className="bg-white rounded-2xl shadow-mobile border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button 
              onClick={() => onPageChange?.('apply-leave')}
              className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors active:scale-95 border border-blue-100"
            >
              <Plus className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-blue-700 font-medium text-sm text-center">Apply for Leave</span>
            </button>
            <button 
              onClick={() => onPageChange?.('my-attendance')}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors active:scale-95 border border-green-100"
            >
              <Eye className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-blue-700 font-medium text-sm text-center">View Attendance</span>
            </button>
            <button 
              onClick={() => onPageChange?.('notifications')}
              className="flex flex-col items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors active:scale-95 border border-amber-100"
            >
              <Bell className="w-8 h-8 text-amber-600 mb-2" />
              <span className="text-blue-700 font-medium text-sm text-center">Check Notifications</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity for Students */}
      {user?.role === 'student' && (
        <RecentActivity />
      )}
    </div>
  );
};

export default Dashboard;
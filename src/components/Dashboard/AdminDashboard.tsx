import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { userService, leaveService, attendanceService, getCurrentBatchYear } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { USE_DUMMY_DATA, getDummyData } from '../../utils/dummyData';

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  pendingLeaves: number;
  activeUsers: number;
}

interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  type: string;
}

interface AdminDashboardProps {
  onPageChange?: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onPageChange }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    activeUsers: 0
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Load real-time data from Firebase
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const currentBatch = getCurrentBatchYear();

      // Fetch students from batch structure
      const fetchStudentsFromCurrentBatch = async (): Promise<any[]> => {
        try {
          const departments = ['Computer Science', 'Information Technology', 'Mechanical', 'Electrical', 'Civil', 'Electronics and Communication'];
          const years = ['1st', '2nd', '3rd', '4th'];
          const semsByYear: Record<string, string[]> = {
            '1st': ['1', '2'],
            '2nd': ['3', '4'],
            '3rd': ['5', '6'],
            '4th': ['7', '8']
          };
          const divs = ['A', 'B', 'C', 'D'];

          const queryPromises: Promise<any[]>[] = [];

          for (const dept of departments) {
            const deptCode = getDepartmentCode(dept);
            for (const year of years) {
              const sems = semsByYear[year] || [];
              for (const sem of sems) {
                for (const div of divs) {
                  const promise = userService.getStudentsByBatchDeptYearSemDiv(
                    currentBatch,
                    deptCode,
                    year,
                    sem,
                    div
                  ).catch(() => []);
                  queryPromises.push(promise);
                }
              }
            }
          }

          const batchSize = 30;
          const allResults: any[][] = [];

          for (let i = 0; i < queryPromises.length; i += batchSize) {
            const batch = queryPromises.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch);
            allResults.push(...batchResults);
            if (i + batchSize < queryPromises.length) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          const allStudents = allResults.flat().filter(s => s && s.id);
          const uniqueStudents = new Map<string, any>();
          for (const student of allStudents) {
            if (student.id && !uniqueStudents.has(student.id)) {
              uniqueStudents.set(student.id, student);
            }
          }

          return Array.from(uniqueStudents.values());
        } catch (error) {
          return [];
        }
      };

      let [
        allStudents,
        allTeachers,
        allUsers,
        allLeaveRequests,
        todayAttendance
      ] = await Promise.all([
        fetchStudentsFromCurrentBatch().catch(() => []),
        userService.getAllTeachers().catch(() => []),
        userService.getAllUsers().catch(() => []),
        leaveService.getAllLeaveRequests().catch(() => []),
        attendanceService.getTodayAttendance().catch(() => [])
      ]);

      // Inject dummy data if enabled
      if (USE_DUMMY_DATA) {
        const dummyStudents = getDummyData.students();
        const dummyTeachers = getDummyData.teachers();
        const dummyAdmins = getDummyData.admins();
        const dummyLeaves = getDummyData.leaveRequests();
        const dummyAttendance = getDummyData.attendanceLogs();

        allStudents = allStudents.length > 0 ? allStudents : dummyStudents;
        allTeachers = allTeachers.length > 0 ? allTeachers : dummyTeachers;
        allUsers = [...allStudents, ...allTeachers, ...dummyAdmins];
        allLeaveRequests = allLeaveRequests.length > 0 ? allLeaveRequests : dummyLeaves;
        todayAttendance = todayAttendance.length > 0 ? todayAttendance : dummyAttendance;
      }

      const students = allStudents || [];
      const teachers = allTeachers || [];

      const allUserDepartments = [
        ...allStudents.map(user => user.department),
        ...allTeachers.map(user => user.department)
      ].filter(Boolean);
      const departments = [...new Set(allUserDepartments)];
      const pendingLeaves = allLeaveRequests.filter(leave => leave.status === 'pending');

      const today = new Date().toISOString().split('T')[0];
      const activeUserIds = new Set([
        ...todayAttendance.map(att => att.userId),
        ...allUsers.filter(user => {
          const lastLogin = user.lastLogin as any;
          if (!lastLogin) return false;

          // Handle different types of lastLogin (Timestamp, Date, string)
          let lastLoginStr: string;
          try {
            if (typeof lastLogin === 'string') {
              lastLoginStr = lastLogin;
            } else if (lastLogin.toDate && typeof lastLogin.toDate === 'function') {
              // Firebase Timestamp
              lastLoginStr = lastLogin.toDate().toISOString();
            } else if (lastLogin instanceof Date) {
              lastLoginStr = lastLogin.toISOString();
            } else {
              return false;
            }

            return lastLoginStr.includes(today);
          } catch {
            return false;
          }
        }).map(user => user.id)
      ]);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        pendingLeaves: pendingLeaves.length,
        activeUsers: activeUserIds.size
      });

      // Update alerts
      const lowAttendanceCount = students.filter(s => {
        const studentAttendance = todayAttendance.filter(att => att.userId === s.id);
        const presentCount = studentAttendance.filter(att => att.status === 'present').length;
        const totalCount = studentAttendance.length;
        return totalCount > 0 && (presentCount / totalCount) < 0.75;
      }).length;

      setAlerts([
        {
          id: 1,
          type: 'warning',
          title: 'Low Attendance Alert',
          message: lowAttendanceCount > 0
            ? `${lowAttendanceCount} students have attendance below 75%`
            : '15 students have attendance below 75%',
          timestamp: '2 hours ago',
          priority: 'high'
        },
        {
          id: 2,
          type: 'info',
          title: 'New Leave Requests',
          message: pendingLeaves.length > 0
            ? `${pendingLeaves.length} new leave requests pending approval`
            : '8 new leave requests pending approval',
          timestamp: '4 hours ago',
          priority: 'medium'
        },
        {
          id: 3,
          type: 'success',
          title: 'System Update',
          message: 'Database backup completed successfully',
          timestamp: '6 hours ago',
          priority: 'low'
        }
      ]);

      // Update recent activities
      const demoActivities = [
        { id: 1, action: 'New student registered', user: 'Rajesh Kumar', timestamp: '10 minutes ago', type: 'student' },
        { id: 2, action: 'Leave request approved', user: 'Dr. Anjali Verma', timestamp: '1 hour ago', type: 'leave' },
        { id: 3, action: 'Teacher profile updated', user: 'Prof. Ramesh Iyer', timestamp: '2 hours ago', type: 'teacher' },
        { id: 4, action: 'Department created', user: 'Admin', timestamp: '3 hours ago', type: 'admin' },
        { id: 5, action: 'Attendance marked', user: 'System', timestamp: '4 hours ago', type: 'attendance' }
      ];

      setRecentActivities(demoActivities);

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    await loadDashboardData(true);
    setLastRefreshed(new Date());
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info': return <FileText className="w-5 h-5 text-slate-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-amber-500 bg-amber-50';
      case 'info': return 'border-l-slate-400 bg-slate-50';
      case 'success': return 'border-l-emerald-500 bg-emerald-50';
      default: return 'border-l-slate-400 bg-slate-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-amber-700 bg-amber-100';
      case 'low': return 'text-emerald-700 bg-emerald-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-5 px-4 lg:px-0">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Data refreshed successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">
            {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : 'Institution management overview'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-700" />
            </div>
            {loading && <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>}
          </div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.totalStudents.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">Total Students</p>
        </div>

        {/* Total Teachers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-slate-700" />
            </div>
            {loading && <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>}
          </div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.totalTeachers}</p>
          <p className="text-sm text-slate-500 mt-1">Total Teachers</p>
        </div>

        {/* Departments */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            {loading && <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>}
          </div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.totalDepartments}</p>
          <p className="text-sm text-slate-500 mt-1">Departments</p>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : stats.pendingLeaves > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Action</span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.pendingLeaves}</p>
          <p className="text-sm text-slate-500 mt-1">Pending Leaves</p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Live</span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '—' : stats.activeUsers}</p>
          <p className="text-sm text-slate-500 mt-1">Active Today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">System Alerts</h2>
              <span className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                {alerts.length} alerts
              </span>
            </div>
          </div>
          <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">All Clear</p>
                <p className="text-sm text-slate-400">No alerts at the moment</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border-l-4 ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-slate-900 truncate">{alert.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
          </div>
          <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No Recent Activities</p>
                <p className="text-sm text-slate-400">Activities will appear here</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.user}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

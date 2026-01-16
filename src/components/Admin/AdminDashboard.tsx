import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { userService, leaveService, attendanceService, notificationService } from '../../firebase/firestore';
import { injectDummyData, USE_DUMMY_DATA, dummyAdmins } from '../../utils/dummyData';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    activeUsers: 0
  });

  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load real-time data from Firebase
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load all data in parallel for better performance
      let [
        allUsers,
        allLeaveRequests,
        todayAttendance,
        allNotifications
      ] = await Promise.all([
        userService.getAllUsers().catch(() => []),
        leaveService.getAllLeaveRequests().catch(() => []),
        attendanceService.getTodayAttendance().catch(() => []),
        notificationService.getAllNotifications().catch(() => [])
      ]);

      // Inject dummy data if enabled and real data is empty
      if (USE_DUMMY_DATA) {
        const dummyStudentsData = injectDummyData.students([]);
        const dummyTeachersData = injectDummyData.teachers([]);
        allUsers = injectDummyData.students(allUsers).length === 0
          ? [...dummyStudentsData, ...dummyTeachersData, ...dummyAdmins]
          : allUsers;
        allLeaveRequests = injectDummyData.leaveRequests(allLeaveRequests);
        todayAttendance = injectDummyData.attendanceLogs(todayAttendance);
        allNotifications = injectDummyData.notifications(allNotifications);
      }

      // Filter users by role
      const students = allUsers.filter(user => user.role === 'student');
      const teachers = allUsers.filter(user => user.role === 'teacher' || user.role === 'hod');

      // Get unique departments from all users
      const departments = [...new Set(allUsers.map(user => user.department).filter(Boolean))];

      // Filter pending leave requests
      const pendingLeaves = allLeaveRequests.filter(leave => leave.status === 'pending');

      // Calculate active users from today's attendance
      const activeUserIds = [...new Set(todayAttendance.map(att => att.userId))];

      // Process notifications for alerts
      const recentNotifications = allNotifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Convert notifications to system alerts or use demo alerts
      const demoAlerts = [
        {
          id: 1,
          type: 'warning' as const,
          title: 'Low Attendance Alert',
          message: '15 students have attendance below 75%',
          timestamp: '2 hours ago',
          priority: 'high' as const
        },
        {
          id: 2,
          type: 'info' as const,
          title: 'New Leave Requests',
          message: `${pendingLeaves.length > 0 ? pendingLeaves.length : 8} new leave requests pending approval`,
          timestamp: '4 hours ago',
          priority: 'medium' as const
        },
        {
          id: 3,
          type: 'success' as const,
          title: 'System Update',
          message: 'Database backup completed successfully',
          timestamp: '6 hours ago',
          priority: 'low' as const
        },
        {
          id: 4,
          type: 'info' as const,
          title: 'New Student Registrations',
          message: '12 new students registered this week',
          timestamp: '1 day ago',
          priority: 'medium' as const
        },
        {
          id: 5,
          type: 'warning' as const,
          title: 'Pending Fee Payments',
          message: '23 students have pending fee payments',
          timestamp: '2 days ago',
          priority: 'high' as const
        }
      ];

      const systemAlerts = recentNotifications.length > 0
        ? recentNotifications.map(notif => {
          const alertType = notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'success' : 'info';
          const alertPriority = notif.priority === 'high' ? 'high' : notif.priority === 'low' ? 'low' : 'medium';
          return {
            id: notif.id,
            type: alertType as 'warning' | 'info' | 'success',
            title: notif.title,
            message: notif.message,
            timestamp: formatTimeAgo(new Date(notif.createdAt || notif.timestamp)),
            priority: alertPriority as 'high' | 'medium' | 'low'
          };
        })
        : demoAlerts;

      // Generate recent activities from multiple sources or use demo data
      const demoActivities = [
        { id: 1, action: 'New student registered', user: 'Rajesh Kumar', timestamp: '10 minutes ago', type: 'student' },
        { id: 2, action: 'Leave request approved', user: 'Dr. Anjali Verma', timestamp: '1 hour ago', type: 'leave' },
        { id: 3, action: 'Teacher profile updated', user: 'Prof. Ramesh Iyer', timestamp: '2 hours ago', type: 'teacher' },
        { id: 4, action: 'Department created', user: 'Admin', timestamp: '3 hours ago', type: 'admin' },
        { id: 5, action: 'Attendance marked', user: 'System', timestamp: '4 hours ago', type: 'attendance' }
      ];

      const activities = [
        // Recent leave requests
        ...allLeaveRequests.slice(0, 3).map(leave => ({
          id: `leave-${leave.id}`,
          action: `Leave request ${leave.status}`,
          user: leave.userName || 'Unknown User',
          timestamp: formatTimeAgo(new Date(leave.submittedAt)),
          type: 'leave'
        })),
        // Recent notifications
        ...recentNotifications.slice(0, 2).map(notif => ({
          id: `notif-${notif.id}`,
          action: notif.title,
          user: 'System',
          timestamp: formatTimeAgo(new Date(notif.createdAt)),
          type: 'notification'
        })),
        // Recent user registrations
        ...allUsers
          .filter(user => user.createdAt)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 2)
          .map(user => ({
            id: `user-${user.id}`,
            action: `New ${user.role} registered`,
            user: user.name,
            timestamp: formatTimeAgo(new Date(user.createdAt!)),
            type: 'user'
          }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

      const finalActivities = activities.length > 0 ? activities : demoActivities;

      // Update stats with real Firebase data
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        pendingLeaves: pendingLeaves.length,
        activeUsers: activeUserIds.length
      });

      setAlerts(systemAlerts);
      setRecentActivities(finalActivities);

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      // Set fallback data on error
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalDepartments: 0,
        pendingLeaves: 0,
        activeUsers: 0
      });
      setAlerts([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh function
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Institution overview and management center</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:block">{new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-700" />
            </div>
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '—' : stats.totalStudents.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total Students</p>
        </div>

        {/* Total Teachers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-slate-700" />
            </div>
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '—' : stats.totalTeachers}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total Teachers</p>
        </div>

        {/* Departments */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
            {loading && (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '—' : stats.totalDepartments}
          </p>
          <p className="text-sm text-slate-500 mt-1">Departments</p>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : stats.pendingLeaves > 0 ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Action</span>
            ) : null}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '—' : stats.pendingLeaves}
          </p>
          <p className="text-sm text-slate-500 mt-1">Pending Leaves</p>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Live</span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {loading ? '—' : stats.activeUsers}
          </p>
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
          <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-slate-500">Loading alerts...</span>
              </div>
            ) : alerts.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">All Clear</p>
                <p className="text-sm text-slate-400">No alerts at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activities</h2>
          </div>
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-slate-500">Loading activities...</span>
              </div>
            ) : recentActivities.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No Recent Activities</p>
                <p className="text-sm text-slate-400">Activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

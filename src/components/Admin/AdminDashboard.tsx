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
  Settings,
  UserPlus,
  BookOpen,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { userService, leaveService, attendanceService, notificationService, eventService, clubService } from '../../firebase/firestore';

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
      const [
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

      // Filter users by role
      const students = allUsers.filter(user => user.role === 'student');
      const teachers = allUsers.filter(user => user.role === 'teacher' || user.role === 'hod');
      const nonTeaching = allUsers.filter(user => user.role === 'non-teaching');

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

      // Convert notifications to system alerts
      const systemAlerts = recentNotifications.map(notif => ({
        id: notif.id,
        type: notif.category === 'urgent' ? 'warning' : notif.category === 'success' ? 'success' : 'info',
        title: notif.title,
        message: notif.message,
        timestamp: formatTimeAgo(new Date(notif.createdAt)),
        priority: notif.category === 'urgent' ? 'high' : notif.category === 'success' ? 'low' : 'medium'
      }));

      // Generate recent activities from multiple sources
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

      // Update stats with real Firebase data
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        pendingLeaves: pendingLeaves.length,
        activeUsers: activeUserIds.length
      });

      setAlerts(systemAlerts);
      setRecentActivities(activities);

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
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 lg:p-8 border border-red-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Welcome, Admin! 👋
            </h1>
            <p className="text-gray-600 text-base lg:text-lg">
              Here's your institution overview and management center for today
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalStudents.toLocaleString()
                )}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Real-time data</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalTeachers
                )}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Including HODs</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalDepartments
                )}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span>All active</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.pendingLeaves
                )}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-yellow-600">
            <span>Requires attention</span>
          </div>
        </div>


        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.activeUsers
                )}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <span>Online today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">System Alerts</h2>
              <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                {alerts.length} alerts
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Loading alerts...</span>
              </div>
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                      <p className="mt-2 text-xs text-gray-500">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No alerts at the moment</p>
                <p className="text-sm text-gray-400">System is running smoothly</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Loading activities...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.user}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activities</p>
                <p className="text-sm text-gray-400">Activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
              <UserPlus className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add User</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
              <Building2 className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Departments</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Institution Settings</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors">
              <CreditCard className="w-8 h-8 text-red-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Financial Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

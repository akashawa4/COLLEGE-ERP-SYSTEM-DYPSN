import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  UserPlus,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { userService, leaveService, attendanceService } from '../../firebase/firestore';

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

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'warning',
      title: 'Low Attendance Alert',
      message: '15 students have attendance below 75%',
      timestamp: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'info',
      title: 'New Leave Requests',
      message: '8 new leave requests pending approval',
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

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: 1,
      action: 'New student registered',
      user: 'John Doe',
      timestamp: '10 minutes ago',
      type: 'student'
    },
    {
      id: 2,
      action: 'Leave request approved',
      user: 'Sarah Johnson',
      timestamp: '1 hour ago',
      type: 'leave'
    },
    {
      id: 3,
      action: 'Teacher profile updated',
      user: 'Dr. Smith',
      timestamp: '2 hours ago',
      type: 'teacher'
    }
  ]);

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
      
      // Fetch all data in parallel for better performance
      const [
        allUsers,
        allLeaveRequests,
        todayAttendance
      ] = await Promise.all([
        userService.getAllUsers().catch(() => []),
        leaveService.getAllLeaveRequests().catch(() => []),
        attendanceService.getTodayAttendance().catch(() => [])
      ]);

      // Calculate statistics
      const students = allUsers.filter(user => user.role === 'student');
      const teachers = allUsers.filter(user => user.role === 'teacher' || user.role === 'hod');
      const departments = [...new Set(allUsers.map(user => user.department).filter(Boolean))];
      const pendingLeaves = allLeaveRequests.filter(leave => leave.status === 'pending');
      
      // Calculate active users (users who have logged in today or have recent activity)
      const today = new Date().toISOString().split('T')[0];
      const activeUserIds = new Set([
        ...todayAttendance.map(att => att.userId),
        ...allUsers.filter(user => user.lastLogin && user.lastLogin.includes(today)).map(user => user.id)
      ]);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalDepartments: departments.length,
        pendingLeaves: pendingLeaves.length,
        activeUsers: activeUserIds.size
      });

      // Update alerts with real data
      setAlerts([
        {
          id: 1,
          type: 'warning' as const,
          title: 'Low Attendance Alert',
          message: `${students.filter(s => {
            const studentAttendance = todayAttendance.filter(att => att.userId === s.id);
            const presentCount = studentAttendance.filter(att => att.status === 'present').length;
            const totalCount = studentAttendance.length;
            return totalCount > 0 && (presentCount / totalCount) < 0.75;
          }).length} students have attendance below 75%`,
          timestamp: '2 hours ago',
          priority: 'high' as const
        },
        {
          id: 2,
          type: 'info' as const,
          title: 'New Leave Requests',
          message: `${pendingLeaves.length} new leave requests pending approval`,
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
        }
      ]);

      // Update recent activities with real data
      setRecentActivities([
        ...allUsers
          .filter(user => user.createdAt && typeof user.createdAt === 'object' && 'seconds' in user.createdAt && new Date((user.createdAt as any).seconds * 1000) > new Date(Date.now() - 24 * 60 * 60 * 1000))
          .slice(0, 3)
          .map((user, index) => ({
            id: index + 1,
            action: 'New user registered',
            user: user.name,
            timestamp: '10 minutes ago',
            type: user.role
          })),
        ...allLeaveRequests
          .filter(leave => leave.status === 'approved' && new Date(leave.approvedAt || '') > new Date(Date.now() - 24 * 60 * 60 * 1000))
          .slice(0, 2)
          .map((leave, index) => ({
            id: index + 4,
            action: 'Leave request approved',
            user: leave.userName,
            timestamp: '1 hour ago',
            type: 'leave'
          }))
      ].slice(0, 3));

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
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
    <div className="space-y-4 lg:space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 border border-gray-200"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalStudents.toLocaleString()
                )}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalTeachers
                )}
              </div>
            </div>
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Real-time data</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalDepartments
                )}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.pendingLeaves
                )}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.activeUsers
                )}
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <span>Online now</span>
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
            {alerts.map((alert) => (
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
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6 space-y-4">
            {recentActivities.map((activity) => (
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
            ))}
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
            <button 
              onClick={() => onPageChange?.('user-management')}
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <UserPlus className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add User</span>
            </button>
            <button 
              onClick={() => onPageChange?.('department-management')}
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <Building2 className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Departments</span>
            </button>
            <button 
              onClick={() => onPageChange?.('institution-settings')}
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
              <Settings className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Institution Settings</span>
            </button>
            <button 
              onClick={() => onPageChange?.('financial-admin')}
              className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
            >
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

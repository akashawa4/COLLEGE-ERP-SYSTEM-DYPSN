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
import { userService, leaveService, attendanceService, getCurrentBatchYear } from '../../firebase/firestore';
import { getDepartmentCode } from '../../utils/departmentMapping';
import { injectDummyData, USE_DUMMY_DATA, getDummyData } from '../../utils/dummyData';

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

      // Get current batch year (ongoing year)
      const currentBatch = getCurrentBatchYear();
      console.log('Fetching students for current batch year:', currentBatch);

      // Fetch students from batch structure for current batch year only - OPTIMIZED with parallel queries
      const fetchStudentsFromCurrentBatch = async (): Promise<any[]> => {
        try {
          // Get all departments from the department mapping
          const departments = ['Computer Science', 'Information Technology', 'Mechanical', 'Electrical', 'Civil', 'Electronics and Communication'];
          const years = ['1st', '2nd', '3rd', '4th'];
          const semsByYear: Record<string, string[]> = {
            '1st': ['1', '2'],
            '2nd': ['3', '4'],
            '3rd': ['5', '6'],
            '4th': ['7', '8']
          };
          const divs = ['A', 'B', 'C', 'D'];

          // Build all query promises in parallel (not sequential)
          const queryPromises: Promise<any[]>[] = [];
          
          for (const dept of departments) {
            const deptCode = getDepartmentCode(dept);
            for (const year of years) {
              const sems = semsByYear[year] || [];
              for (const sem of sems) {
                for (const div of divs) {
                  // Create promise for each query - all will run in parallel
                  const promise = userService.getStudentsByBatchDeptYearSemDiv(
                    currentBatch,
                    deptCode,
                    year,
                    sem,
                    div
                  ).catch(() => {
                    // Return empty array if collection doesn't exist
                    return [];
                  });
                  queryPromises.push(promise);
                }
              }
            }
          }

          // Execute queries in batches to avoid overwhelming Firestore
          // Process 30 queries at a time for better performance
          const batchSize = 30;
          const allResults: any[][] = [];
          console.log(`Fallback: Executing ${queryPromises.length} queries in batches of ${batchSize} for batch ${currentBatch}...`);
          
          for (let i = 0; i < queryPromises.length; i += batchSize) {
            const batch = queryPromises.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch);
            allResults.push(...batchResults);
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < queryPromises.length) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Flatten results into single array
          const allStudents = allResults.flat().filter(s => s && s.id);

          // Remove duplicates by student ID
          const uniqueStudents = new Map<string, any>();
          for (const student of allStudents) {
            if (student.id && !uniqueStudents.has(student.id)) {
              uniqueStudents.set(student.id, student);
            }
          }

          console.log(`Fetched ${uniqueStudents.size} unique students from batch structure (${queryPromises.length} parallel queries)`);
          return Array.from(uniqueStudents.values());
        } catch (error) {
          console.error('Error fetching students from batch structure:', error);
          return [];
        }
      };

      // Fetch all data in parallel for better performance - use specific queries for accuracy
      let [
        allStudents,
        allTeachers,
        allUsers,
        allLeaveRequests,
        todayAttendance
      ] = await Promise.all([
        fetchStudentsFromCurrentBatch().catch((err) => {
          console.error('Error fetching students from current batch:', err);
          return [];
        }),
        userService.getAllTeachers().catch((err) => {
          console.error('Error fetching teachers:', err);
          return [];
        }),
        userService.getAllUsers().catch((err) => {
          console.error('Error fetching all users:', err);
          return [];
        }),
        leaveService.getAllLeaveRequests().catch((err) => {
          console.error('Error fetching leave requests:', err);
          return [];
        }),
        attendanceService.getTodayAttendance().catch((err) => {
          console.error('Error fetching today attendance:', err);
          return [];
        })
      ]);

      // Inject dummy data if enabled - always use dummy data when flag is true
      if (USE_DUMMY_DATA) {
        // Get dummy data
        const dummyStudents = getDummyData.students();
        const dummyTeachers = getDummyData.teachers();
        const dummyAdmins = getDummyData.admins();
        const dummyLeaves = getDummyData.leaveRequests();
        const dummyAttendance = getDummyData.attendanceLogs();
        
        // Use dummy data if real data is empty, otherwise use real data
        allStudents = allStudents.length > 0 ? allStudents : dummyStudents;
        allTeachers = allTeachers.length > 0 ? allTeachers : dummyTeachers;
        
        // Rebuild allUsers with the correct data
        allUsers = [
          ...allStudents,
          ...allTeachers,
          ...dummyAdmins
        ];
        
        allLeaveRequests = allLeaveRequests.length > 0 ? allLeaveRequests : dummyLeaves;
        todayAttendance = todayAttendance.length > 0 ? todayAttendance : dummyAttendance;
        
        console.log('Dummy data injection:', {
          students: allStudents.length,
          teachers: allTeachers.length,
          admins: dummyAdmins.length,
          totalUsers: allUsers.length,
          leaves: allLeaveRequests.length,
          attendance: todayAttendance.length
        });
      }

      // Calculate statistics using fetched data
      const students = allStudents || [];
      const teachers = allTeachers || [];
      
      console.log('AdminDashboard Stats Calculation:');
      console.log('- Current batch year:', currentBatch);
      console.log('- Students fetched from batch structure:', students.length);
      console.log('- Teachers fetched:', teachers.length);
      console.log('- All users fetched:', allUsers.length);
      console.log('- Leave requests fetched:', allLeaveRequests.length);
      console.log('- Today attendance records:', todayAttendance.length);
      
      // Get unique departments from all users (students + teachers)
      const allUserDepartments = [
        ...allStudents.map(user => user.department),
        ...allTeachers.map(user => user.department)
      ].filter(Boolean);
      const departments = [...new Set(allUserDepartments)];
      
      console.log('- Unique departments:', departments.length, departments);
      
      const pendingLeaves = allLeaveRequests.filter(leave => leave.status === 'pending');
      console.log('- Pending leaves:', pendingLeaves.length);

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

      // Update alerts with real data or demo data
      const lowAttendanceCount = students.filter(s => {
        const studentAttendance = todayAttendance.filter(att => att.userId === s.id);
        const presentCount = studentAttendance.filter(att => att.status === 'present').length;
        const totalCount = studentAttendance.length;
        return totalCount > 0 && (presentCount / totalCount) < 0.75;
      }).length;

      setAlerts([
        {
          id: 1,
          type: 'warning' as const,
          title: 'Low Attendance Alert',
          message: lowAttendanceCount > 0 
            ? `${lowAttendanceCount} students have attendance below 75%`
            : '15 students have attendance below 75%',
          timestamp: '2 hours ago',
          priority: 'high' as const
        },
        {
          id: 2,
          type: 'info' as const,
          title: 'New Leave Requests',
          message: pendingLeaves.length > 0
            ? `${pendingLeaves.length} new leave requests pending approval`
            : '8 new leave requests pending approval',
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
          message: `12 new students registered this week`,
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
      ]);

      // Update recent activities with real data or demo data
      const demoActivities = [
        { id: 1, action: 'New student registered', user: 'Rajesh Kumar', timestamp: '10 minutes ago', type: 'student' },
        { id: 2, action: 'Leave request approved', user: 'Dr. Anjali Verma', timestamp: '1 hour ago', type: 'leave' },
        { id: 3, action: 'Teacher profile updated', user: 'Prof. Ramesh Iyer', timestamp: '2 hours ago', type: 'teacher' },
        { id: 4, action: 'Department created', user: 'Admin', timestamp: '3 hours ago', type: 'admin' },
        { id: 5, action: 'Attendance marked', user: 'System', timestamp: '4 hours ago', type: 'attendance' },
        { id: 6, action: 'New complaint submitted', user: 'Priya Sharma', timestamp: '5 hours ago', type: 'complaint' },
        { id: 7, action: 'Event created', user: 'Admin', timestamp: '6 hours ago', type: 'event' },
        { id: 8, action: 'Result uploaded', user: 'Dr. Meera Nair', timestamp: '1 day ago', type: 'result' }
      ];

      const realActivities = [
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
      ];

      setRecentActivities(realActivities.length > 0 ? realActivities.slice(0, 5) : demoActivities.slice(0, 5));

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
  const handleRefresh = async () => {
    console.log('Refresh button clicked - starting data reload...');
    await loadDashboardData(true);
    setLastRefreshed(new Date());
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    console.log('Dashboard data refreshed successfully');
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
    <div className="space-y-4 lg:space-y-6 px-4 sm:px-6 lg:px-8 py-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Data refreshed successfully!</span>
        </div>
      )}

      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-heading">Admin Dashboard</h2>
          {lastRefreshed && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center space-x-2 text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 shadow-sm hover:shadow transition-shadow"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Total Students Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Students</p>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(loading || refreshing) ? (
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalStudents.toLocaleString()
                )}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg flex-shrink-0 ml-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Total Teachers Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Teachers</p>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(loading || refreshing) ? (
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalTeachers
                )}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg flex-shrink-0 ml-3">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Departments Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Departments</p>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(loading || refreshing) ? (
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.totalDepartments
                )}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg flex-shrink-0 ml-3">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Pending Leaves Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pending Leaves</p>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(loading || refreshing) ? (
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.pendingLeaves
                )}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-amber-50 rounded-lg flex-shrink-0 ml-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Active Users</p>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {(loading || refreshing) ? (
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  stats.activeUsers
                )}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-lg flex-shrink-0 ml-3">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Alerts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">System Alerts</h2>
              <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full border border-red-200">
                {alerts.length} alerts
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No alerts at this time</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No recent activities</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{activity.action}</p>
                    <p className="text-sm text-gray-600 mb-1">{activity.user}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
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

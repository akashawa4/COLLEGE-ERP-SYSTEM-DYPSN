import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Settings, 
  FileText, 
  Bell,
  MapPin,
  Users,
  Shield,
  Wrench,
  BookOpen,
  Coffee,
  Car,
  TreePine
} from 'lucide-react';
import { attendanceService, notificationService, leaveService } from '../../firebase/firestore';

interface NonTeachingDashboardProps {
  user: any;
  onPageChange: (page: string) => void;
}

const NonTeachingDashboard: React.FC<NonTeachingDashboardProps> = ({ user, onPageChange }) => {
  const [attendanceStatus, setAttendanceStatus] = useState('Not Marked');
  const [workHours, setWorkHours] = useState('0h 0m');
  const [tasksCompleted, setTasksCompleted] = useState('0/0');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load non-teaching staff data from Firebase
  useEffect(() => {
    const loadNonTeachingData = async () => {
      try {
        setLoading(true);
        
        // Load today's attendance for this user
        const todayAttendance = await attendanceService.getAttendanceByUser(user?.id || '');
        const todayRecord = todayAttendance.find(att => {
          const attDate = new Date(att.date);
          const today = new Date();
          return attDate.toDateString() === today.toDateString();
        });
        
        if (todayRecord) {
          setAttendanceStatus('Marked');
          // Calculate work hours if clock in/out times are available
          if (todayRecord.clockIn && todayRecord.clockOut) {
            const clockIn = new Date(`2000-01-01 ${todayRecord.clockIn}`);
            const clockOut = new Date(`2000-01-01 ${todayRecord.clockOut}`);
            const diffMs = clockOut.getTime() - clockIn.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            setWorkHours(`${diffHours}h ${diffMinutes}m`);
          }
        }
        
        // Load notifications for recent activities
        const userNotifications = await notificationService.getNotificationsByUser(user?.id || '');
        const recentNotifications = userNotifications
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(notif => ({
            id: notif.id,
            action: notif.title,
            time: formatTimeAgo(new Date(notif.createdAt)),
            type: notif.category
          }));
        
        // Load leave requests for activities
        const userLeaves = await leaveService.getLeaveRequestsByUser(user?.id || '');
        const recentLeaves = userLeaves
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 2)
          .map(leave => ({
            id: `leave-${leave.id}`,
            action: `Leave request ${leave.status}`,
            time: formatTimeAgo(new Date(leave.submittedAt)),
            type: 'leave'
          }));
        
        // Combine activities
        const activities = [...recentNotifications, ...recentLeaves]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5);
        
        setRecentActivities(activities);
        
        // Set tasks completed (mock for now - would need task management system)
        setTasksCompleted(`${Math.floor(Math.random() * 8)}/7`);
        
      } catch (error) {
        console.error('Error loading non-teaching data:', error);
        // Set fallback data
        setRecentActivities([
          { id: 1, action: 'Welcome to your dashboard', time: 'Just now', type: 'info' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadNonTeachingData();
    }
  }, [user]);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };
  const getSubRoleIcon = (subRole: string) => {
    switch (subRole) {
      case 'cleaner':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'peon':
        return <Users className="w-6 h-6 text-green-600" />;
      case 'lab-assistant':
        return <Wrench className="w-6 h-6 text-purple-600" />;
      case 'security':
        return <Shield className="w-6 h-6 text-red-600" />;
      case 'maintenance':
        return <Wrench className="w-6 h-6 text-orange-600" />;
      case 'canteen-staff':
        return <Coffee className="w-6 h-6 text-yellow-600" />;
      case 'library-staff':
        return <BookOpen className="w-6 h-6 text-indigo-600" />;
      case 'office-assistant':
        return <FileText className="w-6 h-6 text-gray-600" />;
      case 'driver':
        return <Car className="w-6 h-6 text-blue-600" />;
      case 'gardener':
        return <TreePine className="w-6 h-6 text-green-600" />;
      default:
        return <User className="w-6 h-6 text-gray-600" />;
    }
  };

  const getSubRoleColor = (subRole: string) => {
    switch (subRole) {
      case 'cleaner':
        return 'bg-blue-100 text-blue-800';
      case 'peon':
        return 'bg-green-100 text-green-800';
      case 'lab-assistant':
        return 'bg-purple-100 text-purple-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'canteen-staff':
        return 'bg-yellow-100 text-yellow-800';
      case 'library-staff':
        return 'bg-indigo-100 text-indigo-800';
      case 'office-assistant':
        return 'bg-gray-100 text-gray-800';
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'gardener':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSubRole = (subRole: string) => {
    return subRole.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Record your daily attendance',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      action: () => onPageChange('mark-attendance')
    },
    {
      title: 'My Schedule',
      description: 'View work schedule',
      icon: <Clock className="w-8 h-8 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      action: () => onPageChange('my-schedule')
    },
    {
      title: 'Work Reports',
      description: 'Submit work reports',
      icon: <FileText className="w-8 h-8 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200',
      action: () => onPageChange('work-reports')
    }
  ];

  const subRoleSpecificActions = () => {
    switch (user.subRole) {
      case 'cleaner':
        return [
          { title: 'Cleaning Schedule', action: () => onPageChange('cleaning-schedule') },
          { title: 'Equipment Status', action: () => onPageChange('equipment-status') }
        ];
      case 'peon':
        return [
          { title: 'Delivery Tasks', action: () => onPageChange('delivery-tasks') },
          { title: 'Office Support', action: () => onPageChange('office-support') }
        ];
      case 'lab-assistant':
        return [
          { title: 'Lab Equipment', action: () => onPageChange('lab-equipment') },
          { title: 'Safety Checklist', action: () => onPageChange('safety-checklist') }
        ];
      case 'security':
        return [
          { title: 'Security Logs', action: () => onPageChange('security-logs') },
          { title: 'Incident Reports', action: () => onPageChange('incident-reports') }
        ];
      case 'maintenance':
        return [
          { title: 'Maintenance Tasks', action: () => onPageChange('maintenance-tasks') },
          { title: 'Equipment Logs', action: () => onPageChange('equipment-logs') }
        ];
      case 'canteen-staff':
        return [
          { title: 'Menu Management', action: () => onPageChange('menu-management') },
          { title: 'Inventory', action: () => onPageChange('inventory') }
        ];
      case 'library-staff':
        return [
          { title: 'Book Management', action: () => onPageChange('book-management') },
          { title: 'Issue Returns', action: () => onPageChange('issue-returns') }
        ];
      case 'office-assistant':
        return [
          { title: 'Document Management', action: () => onPageChange('document-management') },
          { title: 'Office Tasks', action: () => onPageChange('office-tasks') }
        ];
      case 'driver':
        return [
          { title: 'Vehicle Logs', action: () => onPageChange('vehicle-logs') },
          { title: 'Route Planning', action: () => onPageChange('route-planning') }
        ];
      case 'gardener':
        return [
          { title: 'Garden Maintenance', action: () => onPageChange('garden-maintenance') },
          { title: 'Plant Care', action: () => onPageChange('plant-care') }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
              {user?.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome, {user?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubRoleColor(user?.subRole || '')}`}>
                  {getSubRoleIcon(user?.subRole || '')}
                  <span className="ml-2">{formatSubRole(user?.subRole || '')}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{user?.department}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Work Status</p>
              <p className="text-lg font-semibold text-green-600 capitalize">
                {user?.workStatus || 'Active'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Shift</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">
                {user?.workShift || 'Full Day'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`p-6 rounded-xl border-2 ${action.color} hover:shadow-md transition-all duration-200 text-left group`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Sub-Role Specific Actions */}
      {subRoleSpecificActions().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {formatSubRole(user?.subRole || '')} Specific Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subRoleSpecificActions().map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
                    {getSubRoleIcon(user?.subRole || '')}
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-blue-700">
                    {action.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Work Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Work Location</p>
                <p className="font-medium text-gray-900">{user?.workLocation || 'Main Campus'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Supervisor</p>
                <p className="font-medium text-gray-900">{user?.supervisor || 'Not Assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Contract Type</p>
                <p className="font-medium text-gray-900 capitalize">{user?.contractType || 'Permanent'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-medium text-gray-900">{user?.joiningDate || 'Not Available'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Attendance</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  attendanceStatus
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Work Hours</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  workHours
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Tasks Completed</span>
              </div>
              <span className="text-sm font-semibold text-purple-600">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  tasksCompleted
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-600">Loading activities...</span>
            </div>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-5 h-5 ${
                  activity.type === 'leave' ? 'text-blue-600' :
                  activity.type === 'urgent' ? 'text-red-600' :
                  activity.type === 'success' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {activity.type === 'leave' ? <FileText className="w-5 h-5" /> :
                   activity.type === 'urgent' ? <AlertCircle className="w-5 h-5" /> :
                   activity.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NonTeachingDashboard;

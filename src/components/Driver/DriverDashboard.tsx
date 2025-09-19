import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Navigation,
  Fuel,
  Wrench,
  Bell
} from 'lucide-react';
import { attendanceService, notificationService, userService } from '../../firebase/firestore';

const DriverDashboard: React.FC<{ user: any; onPageChange: (page: string) => void }> = ({ user, onPageChange }) => {
  const [assignedBus, setAssignedBus] = useState({
    id: '1',
    busNumber: 'DYPSN-001',
    busName: 'College Bus 1',
    type: 'AC',
    capacity: 50,
    status: 'active',
    routeName: 'Route A - Central City',
    registrationNumber: 'MH-12-AB-1234',
    model: 'Tata Starbus',
    year: 2022,
    fuelType: 'Diesel',
    lastServiceDate: '2024-01-15',
    nextServiceDate: '2024-04-15'
  });

  const [todaySchedule, setTodaySchedule] = useState([
    { time: '08:00', location: 'College Campus', type: 'pickup', students: 25 },
    { time: '08:30', location: 'City Center', type: 'pickup', students: 15 },
    { time: '09:00', location: 'Central Station', type: 'drop', students: 40 },
    { time: '17:00', location: 'Central Station', type: 'pickup', students: 35 },
    { time: '17:30', location: 'City Center', type: 'drop', students: 20 },
    { time: '18:00', location: 'College Campus', type: 'drop', students: 15 }
  ]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState('College Campus');
  const [nextStop, setNextStop] = useState('City Center');
  const [estimatedArrival, setEstimatedArrival] = useState('08:25');
  const [loading, setLoading] = useState(true);
  const [todayPassengers, setTodayPassengers] = useState(0);

  // Load driver-specific data from Firebase
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        
        // Load today's attendance for passengers count
        const todayAttendance = await attendanceService.getTodayAttendance();
        const driverAttendance = todayAttendance.filter(att => 
          att.userId === user?.id || att.userName === user?.name
        );
        
        // Load notifications for driver
        const driverNotifications = await notificationService.getNotificationsByUser(user?.id || '');
        const recentNotifications = driverNotifications
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(notif => ({
            id: notif.id,
            message: notif.message,
            type: notif.category === 'urgent' ? 'warning' : notif.category === 'success' ? 'success' : 'info',
            time: formatTimeAgo(new Date(notif.createdAt))
          }));

        // Calculate today's passengers (students who marked attendance)
        const todayPassengersCount = todayAttendance.length;
        
        setTodayPassengers(todayPassengersCount);
        setNotifications(recentNotifications);
        
      } catch (error) {
        console.error('Error loading driver data:', error);
        // Set fallback data
        setNotifications([
          { id: 1, message: 'Welcome to Driver Dashboard', type: 'info', time: 'Just now' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDriverData();
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Bus</p>
              <p className="text-2xl font-bold text-gray-900">{assignedBus.busNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Passengers</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  todayPassengers
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Next Stop</p>
              <p className="text-lg font-bold text-gray-900">{nextStop}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Location</p>
              <p className="text-lg font-bold text-gray-900">{currentLocation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bus Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bus Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🚌</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{assignedBus.busName}</h3>
                    <p className="text-gray-600">{assignedBus.busNumber}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">Type:</span> {assignedBus.type}</p>
                  <p><span className="font-medium text-gray-700">Capacity:</span> {assignedBus.capacity} seats</p>
                  <p><span className="font-medium text-gray-700">Model:</span> {assignedBus.model}</p>
                  <p><span className="font-medium text-gray-700">Year:</span> {assignedBus.year}</p>
                  <p><span className="font-medium text-gray-700">Registration:</span> {assignedBus.registrationNumber}</p>
                  <p><span className="font-medium text-gray-700">Fuel Type:</span> {assignedBus.fuelType}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Maintenance Info</h4>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">Last Service:</span> {assignedBus.lastServiceDate}</p>
                  <p><span className="font-medium text-gray-700">Next Service:</span> {assignedBus.nextServiceDate}</p>
                  <div className="mt-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      assignedBus.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assignedBus.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Schedule</h2>
            <div className="space-y-4">
              {todaySchedule.map((stop, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      stop.type === 'pickup' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{stop.location}</p>
                        <p className="text-sm text-gray-600 capitalize">{stop.type} - {stop.students} students</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{stop.time}</p>
                        <p className="text-sm text-gray-600">
                          {stop.type === 'pickup' ? 'Pickup' : 'Drop'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Route Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{assignedBus.routeName}</span>
              </div>
              <div className="flex items-center">
                <Navigation className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">15 km total distance</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">60 minutes estimated time</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">40 students assigned</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => onPageChange('bus-management')}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bus className="w-4 h-4 mr-2" />
                View All Buses
              </button>
              <button
                onClick={() => onPageChange('my-attendance')}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                My Attendance
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Emergency Contact
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
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
                      notification.type === 'warning' ? 'bg-yellow-500' :
                      notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
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

          {/* Emergency Contacts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Transport Manager</p>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                </div>
                <a
                  href="tel:+919876543210"
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">College Security</p>
                  <p className="text-sm text-gray-600">+91 98765 43211</p>
                </div>
                <a
                  href="tel:+919876543211"
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;

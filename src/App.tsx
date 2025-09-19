import React, { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import MobileBottomNav from './components/Layout/MobileBottomNav';
import Dashboard from './components/Dashboard/Dashboard';
import LeaveRequestForm from './components/Leave/LeaveRequestForm';
import LeaveApprovalPanel from './components/Leave/LeaveApprovalPanel';
import MyLeaves from './components/Leave/MyLeaves';
import MyAttendance from './components/Attendance/MyAttendance';
import ESLBiometricIntegration from './components/Attendance/ESLBiometricIntegration';
import Notifications from './components/Notifications/Notifications';
import StudentManagementPanel from './components/StudentManagement/StudentManagementPanel';
import TeacherStudentPanel from './components/StudentManagement/TeacherStudentPanel';
import TeacherManagementPanel from './components/TeacherManagement/TeacherManagementPanel';
import SubjectManagementPanel from './components/SubjectManagement/SubjectManagementPanel';
import ResultEntryPanel from './components/Results/ResultEntryPanel';
import MyResults from './components/Results/MyResults';
import { Upload, BarChart3, Users, Calendar, FileText, User } from 'lucide-react';
import StudentProfile from './components/StudentProfile';
import TakeAttendancePanel from './components/Attendance/TakeAttendancePanel';
import BatchManagementPanel from './components/BatchManagement/BatchManagementPanel';
import UserManagement from './components/Admin/UserManagement';
import InstitutionSettings from './components/Admin/InstitutionSettings';
import DepartmentManagement from './components/Admin/DepartmentManagement';
import FinancialAdmin from './components/Admin/FinancialAdmin';
import EventManagement from './components/Events/EventManagement';
import ClubManagement from './components/Clubs/ClubManagement';
import ComplaintManagement from './components/Complaints/ComplaintManagement';
import CanteenManagement from './components/Canteen/CanteenManagement';
import StationaryManagement from './components/Stationary/StationaryManagement';
import LibraryManagement from './components/Library/LibraryManagement';
import NonTeachingDashboard from './components/NonTeaching/NonTeachingDashboard';
import CleanerPanel from './components/NonTeaching/CleanerPanel';
import PeonPanel from './components/NonTeaching/PeonPanel';
import LabAssistantPanel from './components/NonTeaching/LabAssistantPanel';
import SecurityPanel from './components/NonTeaching/SecurityPanel';
import VisitorManagement from './components/Admin/VisitorManagement';
import BusManagement from './components/Transport/BusManagement';
import DriverDashboard from './components/Driver/DriverDashboard';
import CollegeContacts from './components/Contacts/CollegeContacts';
import LostFoundManagement from './components/LostFound/LostFoundManagement';
import HostelManagement from './components/Hostel/HostelManagement';
import CourseManagementPanel from './components/CourseManagement/CourseManagementPanel';
import DocumentManagementPanel from './components/DocumentManagement/DocumentManagementPanel';
// Visitor lightweight components
const VisitorCard: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
  <button onClick={onClick} className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left group">
    <div className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </button>
);

const VisitorInfoForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [purpose, setPurpose] = React.useState('General Visit');
  // user not needed here directly; saved via localStorage + service
  const saveVisitor = React.useCallback(async (payload: { name: string; phone: string; purpose: string }) => {
    try {
      const deviceId = localStorage.getItem('dypsn_device_id') || `dev_${crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
      localStorage.setItem('dypsn_device_id', deviceId);
      const { visitorService } = await import('./firebase/firestore');
      await visitorService.upsertVisitor({ deviceId, name: payload.name, phone: payload.phone, purpose: payload.purpose });
    } catch (e) {
      // silent fail to keep UX smooth; can add toast later
    }
  }, []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const existing = JSON.parse(localStorage.getItem('dypsn_visitor') || '{}');
        localStorage.setItem('dypsn_visitor', JSON.stringify({ ...existing, name, phone, purpose }));
        const user = JSON.parse(localStorage.getItem('dypsn_user') || '{}');
        localStorage.setItem('dypsn_user', JSON.stringify({ ...user, name, phone }));
        saveVisitor({ name, phone, purpose });
        onComplete();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border rounded-lg px-3 py-2" placeholder="Your name" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="^[0-9]{10}$" className="w-full border rounded-lg px-3 py-2" placeholder="10-digit number" />
        <p className="text-xs text-gray-500 mt-1">We use this only for contact during your visit.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border rounded-lg px-3 py-2">
          <option>General Visit</option>
          <option>Admissions</option>
          <option>Event</option>
          <option>Library</option>
          <option>Other</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continue</button>
      </div>
    </form>
  );
};

const ProfilePage: React.FC<{ user: any }> = ({ user }) => (
  <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8">
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl mb-4 border-4 border-blue-100">
        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h2>
      <p className="text-gray-600 mb-2">{user?.email}</p>
      <p className="text-blue-600 capitalize font-medium mb-4">{user?.role}</p>
      <div className="w-full border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">Department:</span> {user?.department}</p>
        <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">Access Level:</span> {user?.accessLevel}</p>
        <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">Status:</span> {user?.isActive ? 'Active' : 'Inactive'}</p>
      </div>
    </div>
  </div>
);

const initialMockUsers = [
  {
    id: 'student001',
    name: 'Demo Student',
    email: 'student.demo@dypsn.edu',
    phone: '+91 90000 00001',
    role: 'student',
    department: 'Computer Science',
    status: 'Active',
  },
  {
    id: 'teacher001',
    name: 'Demo Teacher',
    email: 'teacher.demo@dypsn.edu',
    phone: '+91 90000 00002',
    role: 'teacher',
    department: 'Computer Science',
    status: 'Active',
  },
  {
    id: 'hod001',
    name: 'Demo HOD',
    email: 'hod.demo@dypsn.edu',
    phone: '+91 90000 00003',
    role: 'hod',
    department: 'Computer Science',
    status: 'Active',
  },
];

const UserManagementPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = React.useState(initialMockUsers);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'Computer Science',
  });
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.role) return;
    setUsers([
      ...users,
      {
        id: `user${Date.now()}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department || '-',
        status: 'Active',
      },
    ]);
    setForm({ name: '', email: '', phone: '', role: '', department: 'Computer Science' });
  };
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} type="text" className="w-full border border-gray-300 rounded-lg p-2" placeholder="Full Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full border border-gray-300 rounded-lg p-2" placeholder="Email Address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="w-full border border-gray-300 rounded-lg p-2" placeholder="Phone Number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2">
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hod">HOD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input name="department" value="Computer Science" type="text" className="w-full border border-gray-300 rounded-lg p-2" disabled />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Add Member</button>
      </form>
      <div className="my-6 border-t border-gray-200"></div>
      <div className="flex flex-col items-center space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Add via Excel</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Excel Sheet</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">Accepted formats: .xlsx, .xls</p>
        </div>
        

      </div>
      <div className="my-6 border-t border-gray-200"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">All Users</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Role</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Department</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr
                key={user.id}
                className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="px-3 py-2 font-medium text-gray-900">{user.name}</td>
                <td className="px-3 py-2 text-gray-700">{user.email}</td>
                <td className="px-3 py-2 text-gray-700">{user.phone}</td>
                <td className="px-3 py-2 text-gray-700 capitalize">{user.role}</td>
                <td className="px-3 py-2 text-gray-700">Computer Science</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* User Info Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setSelectedUser(null)}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-blue-600">{selectedUser.name?.charAt(0)}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedUser.name}</h2>
              <p className="text-gray-600 mb-1">{selectedUser.email}</p>
              <p className="text-gray-600 mb-1">{selectedUser.phone}</p>
              <p className="text-blue-600 capitalize font-medium mb-2">{selectedUser.role}</p>
              <div className="w-full border-t border-gray-200 pt-3 mt-2">
                <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">Department:</span> Computer Science</p>
                <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">Status:</span> {selectedUser.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">MIS & Reports</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-3 border border-blue-100">
        <Calendar className="w-8 h-8 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Attendance Summary</h3>
          <p className="text-sm text-blue-700">View monthly and yearly attendance stats</p>
        </div>
      </div>
      <div className="bg-green-50 rounded-lg p-4 flex items-center space-x-3 border border-green-100">
        <FileText className="w-8 h-8 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-900">Leave Trends</h3>
          <p className="text-sm text-green-700">Analyze leave patterns and usage</p>
        </div>
      </div>
      <div className="bg-amber-50 rounded-lg p-4 flex items-center space-x-3 border border-amber-100">
        <Users className="w-8 h-8 text-amber-600" />
        <div>
          <h3 className="text-lg font-semibold text-amber-900">Department Stats</h3>
          <p className="text-sm text-amber-700">Compare department-wise performance</p>
        </div>
      </div>
    </div>
    <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center border border-gray-200">
      <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
      <h4 className="text-lg font-semibold text-gray-700 mb-2">Analytics Chart Placeholder</h4>
      <p className="text-gray-500 text-sm">Charts and analytics will be displayed here in the future.</p>
    </div>
  </div>
);

const AttendanceLogsPage: React.FC = () => {
  const dummyLogs = [
    { name: 'Dr. Sarah Johnson', date: '2024-03-22', status: 'Present', clockIn: '9:15 AM', clockOut: '5:30 PM', department: 'Computer Science' },
    { name: 'Dr. Michael Chen', date: '2024-03-22', status: 'Present', clockIn: '9:05 AM', clockOut: '5:20 PM', department: 'Computer Science' },
    { name: 'Prof. Rajesh Kumar', date: '2024-03-22', status: 'Absent', clockIn: '---', clockOut: '---', department: 'Mechanical Engineering' },
    { name: 'Dr. Priya Mehta', date: '2024-03-22', status: 'Late', clockIn: '9:35 AM', clockOut: '5:45 PM', department: 'Electronics' },
    { name: 'Ms. Anjali Desai', date: '2024-03-22', status: 'Present', clockIn: '9:00 AM', clockOut: '5:10 PM', department: 'Administration' },
  ];
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Logs</h2>
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="bg-green-50 px-4 py-2 rounded-lg text-green-700 font-semibold">Present: 3</div>
        <div className="bg-red-50 px-4 py-2 rounded-lg text-red-700 font-semibold">Absent: 1</div>
        <div className="bg-amber-50 px-4 py-2 rounded-lg text-amber-700 font-semibold">Late: 1</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Clock In</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Clock Out</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Department</th>
            </tr>
          </thead>
          <tbody>
            {dummyLogs.map((log, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">{log.name}</td>
                <td className="px-3 py-2 text-gray-700">{log.date}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    log.status === 'Present' ? 'bg-green-100 text-green-700' :
                    log.status === 'Absent' ? 'bg-red-100 text-red-700' :
                    log.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{log.status}</span>
                </td>
                <td className="px-3 py-2 text-gray-700">{log.clockIn}</td>
                <td className="px-3 py-2 text-gray-700">{log.clockOut}</td>
                <td className="px-3 py-2 text-gray-700">Computer Science</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if there's a stored current page
    const storedPage = localStorage.getItem('dypsn_current_page');
    if (storedPage) {
      return storedPage;
    }
    return 'dashboard';
  });

  // Function to handle page changes and save to localStorage
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem('dypsn_current_page', page);
  };

  // Enforce correct landing pages based on role and clean up restricted initial states
  React.useEffect(() => {
    if (!user) return;
    if (user.role === 'visitor') {
      const allowed = ['visitor-info', 'visitor-home', 'visitor-contact', 'canteen', 'stationary', 'clubs', 'events', 'complaints', 'profile'];
      // If first-time visitor without details, force info form
      const v = (() => { try { return JSON.parse(localStorage.getItem('dypsn_visitor') || 'null'); } catch { return null; } })();
      const needsInfo = !(v?.name && v?.phone);
      if (needsInfo && currentPage !== 'visitor-info') {
        setCurrentPage('visitor-info');
        localStorage.setItem('dypsn_current_page', 'visitor-info');
        return;
      }
      if (!allowed.includes(currentPage)) {
        setCurrentPage('visitor-home');
        localStorage.setItem('dypsn_current_page', 'visitor-home');
      }
    } else {
      const visitorPages = ['visitor-info', 'visitor-home', 'visitor-contact'];
      if (visitorPages.includes(currentPage)) {
        setCurrentPage('dashboard');
        localStorage.setItem('dypsn_current_page', 'dashboard');
      }
    }
  }, [user, currentPage]);
  // Notification state
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New leave request from John Doe', read: false },
    { id: 2, message: 'Attendance marked for today', read: false },
    { id: 3, message: 'System maintenance scheduled for Friday', read: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Add notification function
  const addNotification = (message: string) => {
    setNotifications(prev => [
      { id: Date.now(), message, read: false },
      ...prev,
    ]);
  };

  // Mark notifications as read when dropdown is opened
  React.useEffect(() => {
    if (showNotifications) {
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  // Track online/offline and show a subtle indicator
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clear stored page when user logs out
  React.useEffect(() => {
    if (!user) {
      localStorage.removeItem('dypsn_current_page');
    }
  }, [user]);

  if (!user) {
    return <LoginForm />;
  }

  const renderPage = () => {
    // Visitor role restrictions - only allow specific pages
    if (user.role === 'visitor') {
      const allowedPages = ['visitor-info', 'visitor-home', 'visitor-contact', 'canteen', 'stationary', 'clubs', 'events', 'complaints', 'profile'];
      if (!allowedPages.includes(currentPage)) {
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
              <p className="text-yellow-700 mb-4">This page is not available for visitors.</p>
              <button 
                onClick={() => handlePageChange('visitor-home')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Visitor Home
              </button>
            </div>
          </div>
        );
      }
    }

    switch (currentPage) {
      case 'profile':
        if (user.role === 'student') {
          return <StudentProfile 
            name={user.name}
            gender={user.gender || 'Not specified'}
            mobile={user.phone || 'Not specified'}
            email={user.email}
            div={user.div || 'A'}
            year={user.year || 'FE'}
            sem={user.sem || '1'}
          />;
        }
        if (user.role === 'visitor') {
          return (
            <div className="max-w-2xl mx-auto p-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Visitor Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600">Campus Visitor</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{user.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <p className="text-gray-900">Visitor</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <p className="text-gray-900">Guest</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      As a visitor, you have limited access to campus facilities. 
                      You can browse canteen menus, stationary services, events, clubs, and submit complaints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return <ProfilePage user={user} />;
      case 'dashboard':
        if (user.role === 'non-teaching') {
          return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
        }
        if (user.role === 'driver') {
          return <DriverDashboard user={user} onPageChange={handlePageChange} />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'visitor-info':
        return (
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome Visitor</h2>
            <p className="text-gray-600 mb-6">Please provide your basic details for a better experience.</p>
            <VisitorInfoForm onComplete={() => handlePageChange('visitor-home')} />
          </div>
        );
      case 'visitor-home':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DYPSN</h2>
              <p className="text-gray-600">Explore our campus facilities and activities</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <VisitorCard 
                title="Canteen Menu" 
                description="View available food items and prices"
                onClick={() => handlePageChange('canteen')} 
              />
              <VisitorCard 
                title="Stationary & Xerox" 
                description="Check printing and stationery services"
                onClick={() => handlePageChange('stationary')} 
              />
              <VisitorCard 
                title="Student Clubs" 
                description="Explore our student organizations"
                onClick={() => handlePageChange('clubs')} 
              />
              <VisitorCard 
                title="College Events" 
                description="View upcoming events and activities"
                onClick={() => handlePageChange('events')} 
              />
              <VisitorCard 
                title="Contact Information" 
                description="Get in touch with administration"
                onClick={() => handlePageChange('visitor-contact')} 
              />
            </div>
          </div>
        );
      case 'visitor-contact':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">📞</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Main Office</h3>
                  <p className="text-gray-600">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">✉️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">info@dypsn.edu</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">DYPSN College Campus<br />Pune, Maharashtra, India</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <button 
                  onClick={() => handlePageChange('visitor-home')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        );
      case 'apply-leave':
        // Only students can apply for leave
        if (user.role === 'student') {
          return <LeaveRequestForm />;
        }
        // Redirect teachers and HODs to dashboard
        return <Dashboard onPageChange={handlePageChange} />;
      case 'my-leaves':
        // Show Student Leaves for teacher and HOD
        if (user.role === 'teacher' || user.role === 'hod') {
          return <MyLeaves />;
        }
        return <MyLeaves />;
      case 'student-leaves':
        return <MyLeaves />;
      case 'my-attendance':
        // Show Student Attendance for teacher and HOD
        if (user.role === 'teacher' || user.role === 'hod') {
          return <MyAttendance />;
        }
        return <MyAttendance />;
      case 'student-attendance':
        return <MyAttendance />;
      case 'my-results':
        return <MyResults />;
      case 'result-entry':
        if (user.role === 'teacher' || user.role === 'hod') {
          return <ResultEntryPanel />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'esl-integration':
        return <ESLBiometricIntegration />;
      case 'notifications':
        return <Notifications setCurrentPage={setCurrentPage}/>;
      case 'leave-requests':
        return <LeaveApprovalPanel />;
      case 'approvals':
        return <LeaveApprovalPanel />;
      case 'override':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Override Center</h1>
            <p className="text-gray-600">Override functionality for special cases will be displayed here.</p>
          </div>
        );
      case 'attendance':
        return <AttendanceLogsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Audit Logs</h1>
            <p className="text-gray-600">System audit trail and logging will be displayed here.</p>
          </div>
        );
      case 'users':
        return <UserManagementPage />;
      case 'visitor-management':
        // Admin, HOD, and Security can manage visitors
        if (user.role === 'admin' || user.role === 'hod' || (user.role === 'non-teaching' && user.subRole === 'security')) {
          return <VisitorManagement />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'bus-management':
        // All roles can view bus management, but only admin can edit
        return <BusManagement user={user} />;
      case 'college-contacts':
        // All roles can view college contacts
        return <CollegeContacts user={user} />;
      case 'lost-found':
        // All roles can view lost and found, but only staff can manage
        return <LostFoundManagement user={user} />;
      case 'hostel':
        // All roles can view hostel rooms, but only admin/HOD can manage
        return <HostelManagement user={user} />;
      case 'course-management':
        // Admin, HOD, and Teachers can access course management
        if (user.role === 'admin' || user.role === 'hod' || user.role === 'teacher') {
          return <CourseManagementPanel />;
        }
        return <div className="p-4 text-center text-gray-600">Access denied. Only administrators, HODs, and teachers can access course management.</div>;
      case 'document-management':
        // Admin, HOD, and Teachers can access document management
        if (user.role === 'admin' || user.role === 'hod' || user.role === 'teacher') {
          return <DocumentManagementPanel />;
        }
        return <div className="p-4 text-center text-gray-600">Access denied. Only administrators, HODs, and teachers can access document management.</div>;
      case 'driver-dashboard':
        // Only drivers can access driver dashboard
        if (user.role === 'driver') {
          return <DriverDashboard user={user} onPageChange={handlePageChange} />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'student-management':
        return user?.role === 'teacher' ? (
          <TeacherStudentPanel user={user} />
        ) : (
          <StudentManagementPanel user={user} />
        );
      case 'teacher-management':
        return <TeacherManagementPanel />;
      case 'subject-management':
        return <SubjectManagementPanel />;
      case 'take-attendance':
        return <TakeAttendancePanel addNotification={addNotification} />;
      case 'batch-management':
        return <BatchManagementPanel />;
      case 'settings':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings & Policy</h1>
            <p className="text-gray-600">System configuration and leave policies will be displayed here.</p>
          </div>
        );
      case 'broadcast':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Broadcast / Notice</h1>
            <p className="text-gray-600">Communication and announcement system will be displayed here.</p>
          </div>
        );
      // Admin routes
      case 'user-management':
        if (user.role === 'admin') {
          return <UserManagement />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'institution-settings':
        if (user.role === 'admin') {
          return <InstitutionSettings />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'department-management':
        if (user.role === 'admin') {
          return <DepartmentManagement />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      case 'financial-admin':
        if (user.role === 'admin') {
          return <FinancialAdmin />;
        }
        return <Dashboard onPageChange={handlePageChange} />;
      // New module routes
      case 'events':
        // Students can view events, teachers/HODs/admin can manage
        if (user.role === 'student') {
          return <EventManagement />;
        }
        return <EventManagement />;
      case 'clubs':
        // Students can view clubs, teachers/HODs/admin can manage
        if (user.role === 'student') {
          return <ClubManagement />;
        }
        return <ClubManagement />;
      case 'complaints':
        // All users can submit complaints, teachers/HODs/admin can manage
        return <ComplaintManagement />;
      case 'canteen':
        // All users can view canteen, teachers/HODs/admin can manage
        if (user.role === 'student') {
          return <CanteenManagement />;
        }
        return <CanteenManagement />;
      case 'stationary':
        // All users can view stationary, teachers/HODs/admin can manage
        if (user.role === 'student') {
          return <StationaryManagement />;
        }
        return <StationaryManagement />;
      case 'library':
        // Library access
        if (user.role === 'student' || user.subRole === 'library-staff') {
          return <LibraryManagement />;
        }
        return <LibraryManagement />;
      // Non-Teaching Staff specific routes
      case 'non-teaching-dashboard':
        return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
      case 'cleaner-panel':
        if (user.role === 'non-teaching' && user.subRole === 'cleaner') {
          return <CleanerPanel />;
        }
        return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
      case 'peon-panel':
        if (user.role === 'non-teaching' && user.subRole === 'peon') {
          return <PeonPanel />;
        }
        return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
      case 'lab-assistant-panel':
        if (user.role === 'non-teaching' && user.subRole === 'lab-assistant') {
          return <LabAssistantPanel />;
        }
        return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
      case 'security-panel':
        if (user.role === 'non-teaching' && user.subRole === 'security') {
          return <SecurityPanel />;
        }
        return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
      default:
        if (user.role === 'non-teaching') {
          return <NonTeachingDashboard user={user} onPageChange={handlePageChange} />;
        }
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0 min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => handlePageChange('profile')}
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          isOnline={isOnline}
        />
        
        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          {renderPage()}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Mobile/tablet offline indicator only (desktop uses header badge) */}
      {!isOnline && (
        <div className="fixed right-4 bottom-20 sm:top-4 sm:bottom-auto z-50 lg:hidden">
          <div
            role="status"
            aria-live="polite"
            className="px-3 py-2 rounded-lg bg-amber-50/90 backdrop-blur-sm text-amber-800 text-xs sm:text-sm shadow-md border border-amber-200 flex items-center gap-2"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="whitespace-nowrap">You are offline</span>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
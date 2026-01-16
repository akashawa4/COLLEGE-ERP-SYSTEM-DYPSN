import React from 'react';
import {
  Home,
  FileText,
  CheckCircle,
  Calendar,
  BarChart3,
  FileCheck,
  Users,
  Settings,
  PlusCircle,
  Bell,
  X,
  LogOut,
  GraduationCap,
  BookOpen,
  Layers,
  Building2,
  DollarSign,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  AlertTriangle,
  Utensils,
  Package,
  Wrench,
  UserCheck,
  TestTube,
  Eye,
  Library,
  User,
  Bus,
  Phone,
  Home as HomeIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    const studentItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'apply-leave', label: 'Apply Leave', icon: PlusCircle },
      { id: 'my-leaves', label: 'My Leaves', icon: FileText },
      { id: 'my-attendance', label: 'My Attendance', icon: Calendar },
      { id: 'my-results', label: 'My Results', icon: FileCheck },
      { id: 'profile', label: 'My Profile', icon: User },
      { id: 'events', label: 'Events', icon: CalendarIcon },
      { id: 'clubs', label: 'Clubs', icon: UsersIcon },
      { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
      { id: 'canteen', label: 'Canteen', icon: Utensils },
      { id: 'stationary', label: 'Stationary', icon: Package },
      { id: 'library', label: 'Library', icon: Library },
      { id: 'bus-management', label: 'Bus Routes', icon: Bus },
      { id: 'college-contacts', label: 'College Contacts', icon: Phone },
      { id: 'lost-found', label: 'Lost & Found', icon: Package },
      { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon },
      { id: 'notifications', label: 'Updates', icon: Bell },
    ];

    const teacherItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'take-attendance', label: 'Take Attendance', icon: CheckCircle },
      { id: 'student-leaves', label: 'Student Leaves', icon: FileText },
      { id: 'student-attendance', label: 'Student Attendance', icon: Calendar },
      { id: 'result-entry', label: 'Result Entry', icon: FileCheck },
      { id: 'student-management', label: 'Student Management', icon: Users },
      { id: 'subject-management', label: 'Subject Management', icon: BookOpen },
      { id: 'batch-management', label: 'Batch Management', icon: Layers },
      { id: 'course-management', label: 'Course Management', icon: BookOpen },
      { id: 'document-management', label: 'Document Management', icon: FileText },
      { id: 'events', label: 'Event Management', icon: CalendarIcon },
      { id: 'clubs', label: 'Club Management', icon: UsersIcon },
      { id: 'complaints', label: 'Complaint Management', icon: AlertTriangle },
      { id: 'canteen', label: 'Canteen Management', icon: Utensils },
      { id: 'stationary', label: 'Xerox/Stationary Centre', icon: Package },
      { id: 'library', label: 'Library Management', icon: Library },
      { id: 'bus-management', label: 'Bus Management', icon: Bus },
      { id: 'college-contacts', label: 'College Contacts', icon: Phone },
      { id: 'lost-found', label: 'Lost & Found', icon: Package },
      { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon },
      { id: 'notifications', label: 'Updates', icon: Bell },
    ];

    const adminItems = [
      { id: 'dashboard', label: 'Admin Dashboard', icon: BarChart3 },
      { id: 'user-management', label: 'User Management', icon: Users },
      { id: 'teacher-management', label: 'Teacher Management', icon: GraduationCap },
      { id: 'teacher-leave-attendance', label: 'Teacher Leave & Attendance', icon: Calendar },
      { id: 'student-management', label: 'Student Management', icon: Users },
      { id: 'visitor-management', label: 'Visitor Management', icon: User },
      { id: 'department-management', label: 'Department Management', icon: Building2 },
      { id: 'institution-settings', label: 'Institution Settings', icon: Settings },
      { id: 'financial-admin', label: 'Financial Admin', icon: DollarSign },
      { id: 'subject-management', label: 'Subject Management', icon: BookOpen },
      { id: 'batch-management', label: 'Batch Management', icon: Layers },
      { id: 'course-management', label: 'Course Management', icon: BookOpen },
      { id: 'document-management', label: 'Document Management', icon: FileText },
      { id: 'events', label: 'Event Management', icon: CalendarIcon },
      { id: 'clubs', label: 'Club Management', icon: UsersIcon },
      { id: 'complaints', label: 'Complaint Management', icon: AlertTriangle },
      { id: 'canteen', label: 'Canteen Management', icon: Utensils },
      { id: 'stationary', label: 'Xerox/Stationary Centre', icon: Package },
      { id: 'library', label: 'Library Management', icon: Library },
      { id: 'bus-management', label: 'Bus Management', icon: Bus },
      { id: 'college-contacts', label: 'College Contacts', icon: Phone },
      { id: 'lost-found', label: 'Lost & Found', icon: Package },
      { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon },
      { id: 'notifications', label: 'Updates', icon: Bell },
    ];

    const getNonTeachingItems = () => {
      const baseItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'my-attendance', label: 'My Attendance', icon: Calendar },
        { id: 'notifications', label: 'Updates', icon: Bell },
      ];

      // Add sub-role specific items
      if (user?.subRole === 'cleaner') {
        baseItems.push(
          { id: 'cleaner-panel', label: 'Cleaning Tasks', icon: Wrench }
        );
      } else if (user?.subRole === 'peon') {
        baseItems.push(
          { id: 'peon-panel', label: 'Delivery Tasks', icon: UserCheck }
        );
      } else if (user?.subRole === 'lab-assistant') {
        baseItems.push(
          { id: 'lab-assistant-panel', label: 'Lab Management', icon: TestTube }
        );
      } else if (user?.subRole === 'security') {
        baseItems.push(
          { id: 'security-panel', label: 'Security Panel', icon: Eye },
          { id: 'visitor-management', label: 'Visitor Management', icon: User }
        );
      } else if (user?.subRole === 'driver') {
        baseItems.push(
          { id: 'driver-dashboard', label: 'Driver Dashboard', icon: Bus }
        );
      }

      // Add common services to all non-teaching staff
      baseItems.push(
        { id: 'bus-management', label: 'Bus Management', icon: Bus },
        { id: 'college-contacts', label: 'College Contacts', icon: Phone },
        { id: 'lost-found', label: 'Lost & Found', icon: Package },
        { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon }
      );

      return baseItems;
    };

    const getHODItems = () => [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'take-attendance', label: 'Take Attendance', icon: CheckCircle },
      { id: 'student-leaves', label: 'Student Leaves', icon: FileText },
      { id: 'student-attendance', label: 'Student Attendance', icon: Calendar },
      { id: 'result-entry', label: 'Result Entry', icon: FileCheck },
      { id: 'student-management', label: 'Student Management', icon: Users },
      { id: 'teacher-management', label: 'Teacher Management', icon: GraduationCap },
      { id: 'subject-management', label: 'Subject Management', icon: BookOpen },
      { id: 'batch-management', label: 'Batch Management', icon: Layers },
      { id: 'course-management', label: 'Course Management', icon: BookOpen },
      { id: 'document-management', label: 'Document Management', icon: FileText },
      { id: 'visitor-management', label: 'Visitor Management', icon: User },
      { id: 'events', label: 'Event Management', icon: CalendarIcon },
      { id: 'clubs', label: 'Club Management', icon: UsersIcon },
      { id: 'complaints', label: 'Complaint Management', icon: AlertTriangle },
      { id: 'canteen', label: 'Canteen Management', icon: Utensils },
      { id: 'stationary', label: 'Xerox/Stationary Centre', icon: Package },
      { id: 'library', label: 'Library Management', icon: Library },
      { id: 'bus-management', label: 'Bus Management', icon: Bus },
      { id: 'college-contacts', label: 'College Contacts', icon: Phone },
      { id: 'lost-found', label: 'Lost & Found', icon: Package },
      { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon },
      { id: 'notifications', label: 'Updates', icon: Bell },
    ];

    const getLibraryStaffItems = () => [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'library', label: 'Library Management', icon: Library },
      { id: 'my-attendance', label: 'My Attendance', icon: Calendar },
      { id: 'college-contacts', label: 'College Contacts', icon: Phone },
      { id: 'lost-found', label: 'Lost & Found', icon: Package },
      { id: 'hostel', label: 'Hostel & Rooms', icon: HomeIcon },
      { id: 'notifications', label: 'Updates', icon: Bell },
    ];

    // Visitor specific navigation
    if (user?.role === 'visitor') {
      return [
        { id: 'visitor-home', label: 'Visitor Home', icon: Home },
        { id: 'visitor-about', label: 'About College', icon: Building2 },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'canteen', label: 'Canteen', icon: Utensils },
        { id: 'stationary', label: 'Stationary / Xerox', icon: Package },
        { id: 'events', label: 'Events', icon: CalendarIcon },
        { id: 'clubs', label: 'Clubs', icon: UsersIcon },
        { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
        { id: 'visitor-contact', label: 'Contact', icon: Settings },
      ];
    }

    if (user?.role === 'admin') return adminItems;
    if (user?.role === 'hod') return getHODItems();
    if (user?.role === 'teacher') return teacherItems;
    if (user?.subRole === 'library-staff') return getLibraryStaffItems();
    if (user?.role === 'non-teaching') return getNonTeachingItems();
    if (user?.role === 'driver') return getNonTeachingItems();
    return studentItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar
        fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:shadow-none lg:border-r lg:border-slate-200 lg:w-64
        flex flex-col max-h-screen
      `}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">DYPSN</h1>
              <p className="text-xs text-slate-500">Leave & Attendance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 scrollbar-mobile min-h-0 scroll-smooth">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
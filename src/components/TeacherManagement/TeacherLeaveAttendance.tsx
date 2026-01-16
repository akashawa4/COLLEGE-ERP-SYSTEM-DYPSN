import React, { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    GraduationCap,
    Search,
    Filter,
    RefreshCw,
    Eye,
    ChevronDown
} from 'lucide-react';
import { userService, leaveService, attendanceService } from '../../firebase/firestore';
import { User as UserType, LeaveRequest } from '../../types';

const TeacherLeaveAttendance: React.FC = () => {
    const [teachers, setTeachers] = useState<UserType[]>([]);
    const [teacherLeaves, setTeacherLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [attendanceFilter, setAttendanceFilter] = useState<'present' | 'absent'>('present');

    // Stats
    const [stats, setStats] = useState({
        totalTeachers: 0,
        presentToday: 0,
        onLeaveToday: 0,
        pendingLeaves: 0,
        approvedThisMonth: 0,
        rejectedThisMonth: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // Fetch teachers and their leave requests
            const [allTeachers, allLeaves] = await Promise.all([
                userService.getAllTeachers().catch(() => []),
                leaveService.getAllLeaveRequests().catch(() => [])
            ]);

            setTeachers(allTeachers);

            // Filter leaves for teachers only
            const teacherEmails = allTeachers.map(t => t.email);
            const teacherLeaveRequests = allLeaves.filter(leave =>
                teacherEmails.includes(leave.userId) ||
                allTeachers.some(t => t.id === leave.userId || t.name === leave.userName)
            );
            setTeacherLeaves(teacherLeaveRequests);

            // Calculate stats
            const today = new Date().toISOString().split('T')[0];
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const onLeaveToday = teacherLeaveRequests.filter(l =>
                l.status === 'approved' &&
                l.fromDate <= today &&
                l.toDate >= today
            ).length;

            const pendingLeaves = teacherLeaveRequests.filter(l => l.status === 'pending').length;

            const approvedThisMonth = teacherLeaveRequests.filter(l => {
                const leaveDate = new Date(l.submittedAt);
                return l.status === 'approved' &&
                    leaveDate.getMonth() === currentMonth &&
                    leaveDate.getFullYear() === currentYear;
            }).length;

            const rejectedThisMonth = teacherLeaveRequests.filter(l => {
                const leaveDate = new Date(l.submittedAt);
                return l.status === 'rejected' &&
                    leaveDate.getMonth() === currentMonth &&
                    leaveDate.getFullYear() === currentYear;
            }).length;

            setStats({
                totalTeachers: allTeachers.length,
                presentToday: allTeachers.length - onLeaveToday,
                onLeaveToday,
                pendingLeaves,
                approvedThisMonth,
                rejectedThisMonth
            });

        } catch (error) {
            console.error('Error loading teacher leave/attendance data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        await loadData(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Rejected</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
        }
    };

    // Determine if a teacher is on leave today
    const isTeacherOnLeaveToday = (teacher: UserType): boolean => {
        const today = new Date().toISOString().split('T')[0];
        return teacherLeaves.some(leave =>
            (leave.userId === teacher.id || leave.userId === teacher.email || leave.userName === teacher.name) &&
            leave.status === 'approved' &&
            leave.fromDate <= today &&
            leave.toDate >= today
        );
    };

    // Filter teachers based on attendance filter and search
    const filteredTeachers = teachers.filter(teacher => {
        // Search filter
        const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.department?.toLowerCase().includes(searchTerm.toLowerCase());

        // Attendance filter
        const isOnLeave = isTeacherOnLeaveToday(teacher);
        if (attendanceFilter === 'present') {
            return matchesSearch && !isOnLeave;
        } else if (attendanceFilter === 'absent') {
            return matchesSearch && isOnLeave;
        }

        return matchesSearch;
    });

    const filteredLeaves = teacherLeaves.filter(leave => {
        const matchesSearch = leave.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leave.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || leave.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-6 border border-sky-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            Teacher Leave & Attendance
                        </h1>
                        <p className="text-gray-600">
                            Manage faculty attendance records and leave requests
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTeachers}</p>
                        </div>
                        <div className="p-3 bg-sky-50 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-sky-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Present Today</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.presentToday}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">On Leave Today</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.onLeaveToday}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Leaves</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingLeaves}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Approved (Month)</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approvedThisMonth}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Rejected (Month)</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejectedThisMonth}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'attendance'
                                    ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Attendance</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'leaves'
                                    ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Leave Requests</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                />
                            </div>
                            {activeTab === 'leaves' && (
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            )}
                        </div>
                        
                        {/* Attendance Filter Buttons */}
                        {activeTab === 'attendance' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 mr-1">Filter:</span>
                                <button
                                    onClick={() => setAttendanceFilter('present')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                                        attendanceFilter === 'present'
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    }`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Present ({stats.presentToday})
                                </button>
                                <button
                                    onClick={() => setAttendanceFilter('absent')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                                        attendanceFilter === 'absent'
                                            ? 'bg-red-600 text-white shadow-sm border border-red-700'
                                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                    }`}
                                >
                                    <XCircle className="w-4 h-4" />
                                    Absent ({stats.onLeaveToday})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'attendance' ? (
                        <div className="space-y-3">
                            {filteredTeachers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-600 mb-1">
                                        {attendanceFilter === 'present'
                                            ? 'No present teachers found'
                                            : 'No absent teachers found'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Results count */}
                                    <div className="text-sm text-gray-600 mb-2">
                                        Showing {filteredTeachers.length} {filteredTeachers.length === 1 ? 'teacher' : 'teachers'}
                                        {` (${attendanceFilter === 'present' ? 'Present' : 'Absent'})`}
                                    </div>
                                    
                                    {filteredTeachers.map((teacher) => {
                                        const isOnLeave = isTeacherOnLeaveToday(teacher);
                                        return (
                                            <div
                                                key={teacher.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                                        isOnLeave ? 'bg-red-500' : 'bg-green-500'
                                                    }`}>
                                                        {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{teacher.name}</p>
                                                        <p className="text-sm text-gray-500">{teacher.department} • {teacher.designation}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                                                        isOnLeave 
                                                            ? 'bg-red-100 text-red-700 border border-red-200' 
                                                            : 'bg-green-100 text-green-700 border border-green-200'
                                                    }`}>
                                                        {isOnLeave ? 'Absent' : 'Present'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLeaves.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No leave requests found
                                </div>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <div
                                        key={leave.id}
                                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-semibold mt-1">
                                                    {leave.userName?.charAt(0)?.toUpperCase() || 'T'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{leave.userName}</p>
                                                    <p className="text-sm text-gray-500">{leave.department}</p>
                                                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{leave.fromDate} to {leave.toDate}</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span>{leave.daysCount} day(s)</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <span className="font-medium">Type:</span> {leave.leaveType} |
                                                        <span className="font-medium ml-2">Reason:</span> {leave.reason}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                {getStatusBadge(leave.status)}
                                                <p className="text-xs text-gray-400">
                                                    {new Date(leave.submittedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherLeaveAttendance;

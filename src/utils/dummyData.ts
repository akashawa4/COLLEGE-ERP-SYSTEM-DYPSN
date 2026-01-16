import { 
  User, 
  LeaveRequest, 
  AttendanceLog, 
  Notification, 
  Subject, 
  ResultRecord,
  Complaint,
  Event,
  Club,
  Bus,
  LostFoundItem,
  HostelRoom,
  Department,
  LeaveBalance,
  AuditLog
} from '../types';

// ==================== DUMMY USERS ====================
export const dummyStudents: User[] = [
  {
    id: 'student_1',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@dypsn.edu',
    phone: '+91 98765 43210',
    gender: 'Male',
    rollNumber: 'CS2024001',
    year: '2nd',
    sem: '3',
    div: 'A',
    department: 'Computer Science',
    role: 'student',
    accessLevel: 'basic',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:30:00Z',
    loginCount: 45
  },
  {
    id: 'student_2',
    name: 'Priya Sharma',
    email: 'priya.sharma@dypsn.edu',
    phone: '+91 98765 43211',
    gender: 'Female',
    rollNumber: 'CS2024002',
    year: '2nd',
    sem: '3',
    div: 'A',
    department: 'Computer Science',
    role: 'student',
    accessLevel: 'basic',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-12-20T08:15:00Z',
    loginCount: 52
  },
  {
    id: 'student_3',
    name: 'Amit Patel',
    email: 'amit.patel@dypsn.edu',
    phone: '+91 98765 43212',
    gender: 'Male',
    rollNumber: 'CS2024003',
    year: '3rd',
    sem: '5',
    div: 'B',
    department: 'Computer Science',
    role: 'student',
    accessLevel: 'basic',
    isActive: true,
    createdAt: '2023-01-15T10:00:00Z',
    lastLogin: '2024-12-20T10:00:00Z',
    loginCount: 78
  },
  {
    id: 'student_4',
    name: 'Sneha Desai',
    email: 'sneha.desai@dypsn.edu',
    phone: '+91 98765 43213',
    gender: 'Female',
    rollNumber: 'IT2024001',
    year: '2nd',
    sem: '3',
    div: 'A',
    department: 'Information Technology',
    role: 'student',
    accessLevel: 'basic',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:45:00Z',
    loginCount: 38
  },
  {
    id: 'student_5',
    name: 'Vikram Singh',
    email: 'vikram.singh@dypsn.edu',
    phone: '+91 98765 43214',
    gender: 'Male',
    rollNumber: 'ME2024001',
    year: '4th',
    sem: '7',
    div: 'C',
    department: 'Mechanical',
    role: 'student',
    accessLevel: 'basic',
    isActive: true,
    createdAt: '2021-01-15T10:00:00Z',
    lastLogin: '2024-12-20T11:00:00Z',
    loginCount: 120
  }
];

export const dummyTeachers: User[] = [
  {
    id: 'teacher_1',
    name: 'Dr. Anjali Verma',
    email: 'anjali.verma@dypsn.edu',
    phone: '+91 98765 43001',
    gender: 'Female',
    department: 'Computer Science',
    role: 'teacher',
    accessLevel: 'approver',
    isActive: true,
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Machine Learning',
    experience: '15 years',
    designation: 'Professor',
    createdAt: '2010-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:00:00Z',
    loginCount: 200
  },
  {
    id: 'teacher_2',
    name: 'Prof. Ramesh Iyer',
    email: 'ramesh.iyer@dypsn.edu',
    phone: '+91 98765 43002',
    gender: 'Male',
    department: 'Computer Science',
    role: 'teacher',
    accessLevel: 'approver',
    isActive: true,
    qualification: 'M.Tech in Software Engineering',
    specialization: 'Web Development',
    experience: '10 years',
    designation: 'Associate Professor',
    createdAt: '2015-01-15T10:00:00Z',
    lastLogin: '2024-12-20T08:30:00Z',
    loginCount: 180
  },
  {
    id: 'teacher_3',
    name: 'Dr. Meera Nair',
    email: 'meera.nair@dypsn.edu',
    phone: '+91 98765 43003',
    gender: 'Female',
    department: 'Information Technology',
    role: 'teacher',
    accessLevel: 'approver',
    isActive: true,
    qualification: 'Ph.D. in Information Technology',
    specialization: 'Data Science',
    experience: '12 years',
    designation: 'Professor',
    createdAt: '2012-01-15T10:00:00Z',
    lastLogin: '2024-12-20T10:15:00Z',
    loginCount: 195
  }
];

export const dummyAdmins: User[] = [
  {
    id: 'admin_1',
    name: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@dypsn.edu',
    phone: '+91 98765 40001',
    gender: 'Male',
    department: 'Administration',
    role: 'admin',
    accessLevel: 'full',
    isActive: true,
    adminRole: 'principal',
    designation: 'Principal',
    createdAt: '2005-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:00:00Z',
    loginCount: 500
  },
  {
    id: 'admin_2',
    name: 'Mrs. Kavita Shah',
    email: 'kavita.shah@dypsn.edu',
    phone: '+91 98765 40002',
    gender: 'Female',
    department: 'Administration',
    role: 'admin',
    accessLevel: 'full',
    isActive: true,
    adminRole: 'registrar',
    designation: 'Registrar',
    createdAt: '2008-01-15T10:00:00Z',
    lastLogin: '2024-12-20T08:45:00Z',
    loginCount: 450
  }
];

export const dummyNonTeachingStaff: User[] = [
  {
    id: 'nonteaching_1',
    name: 'Rajesh Patel',
    email: 'rajesh.patel@dypsn.edu',
    phone: '+91 98765 41001',
    gender: 'Male',
    department: 'Administration',
    role: 'non-teaching',
    subRole: 'security',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Security Guard',
    workShift: 'day',
    workLocation: 'Main Gate',
    createdAt: '2020-01-15T10:00:00Z',
    lastLogin: '2024-12-20T07:00:00Z',
    loginCount: 300
  },
  {
    id: 'nonteaching_2',
    name: 'Sunita Desai',
    email: 'sunita.desai@dypsn.edu',
    phone: '+91 98765 41002',
    gender: 'Female',
    department: 'Administration',
    role: 'non-teaching',
    subRole: 'cleaner',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Cleaner',
    workShift: 'day',
    workLocation: 'Building A',
    createdAt: '2019-06-15T10:00:00Z',
    lastLogin: '2024-12-20T08:00:00Z',
    loginCount: 280
  },
  {
    id: 'nonteaching_3',
    name: 'Vikram Singh',
    email: 'vikram.singh@dypsn.edu',
    phone: '+91 98765 41003',
    gender: 'Male',
    department: 'Computer Science',
    role: 'non-teaching',
    subRole: 'lab-assistant',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Lab Assistant',
    workShift: 'day',
    workLocation: 'CS Lab',
    createdAt: '2021-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:00:00Z',
    loginCount: 250
  },
  {
    id: 'nonteaching_4',
    name: 'Meera Joshi',
    email: 'meera.joshi@dypsn.edu',
    phone: '+91 98765 41004',
    gender: 'Female',
    department: 'Administration',
    role: 'non-teaching',
    subRole: 'peon',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Peon',
    workShift: 'day',
    workLocation: 'Admin Office',
    createdAt: '2018-03-15T10:00:00Z',
    lastLogin: '2024-12-20T08:30:00Z',
    loginCount: 320
  }
];

export const dummyDrivers: User[] = [
  {
    id: 'driver_1',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@dypsn.edu',
    phone: '+91 98765 42001',
    gender: 'Male',
    department: 'Transport',
    role: 'driver',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Bus Driver',
    createdAt: '2017-01-15T10:00:00Z',
    lastLogin: '2024-12-20T06:00:00Z',
    loginCount: 400
  },
  {
    id: 'driver_2',
    name: 'Suresh Yadav',
    email: 'suresh.yadav@dypsn.edu',
    phone: '+91 98765 42002',
    gender: 'Male',
    department: 'Transport',
    role: 'driver',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Bus Driver',
    createdAt: '2016-05-15T10:00:00Z',
    lastLogin: '2024-12-20T06:30:00Z',
    loginCount: 380
  }
];

export const dummyVisitors: User[] = [
  {
    id: 'visitor_1',
    name: 'Amit Shah',
    email: 'amit.shah@example.com',
    phone: '+91 98765 43001',
    gender: 'Male',
    department: 'External',
    role: 'visitor',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Guest',
    createdAt: '2024-12-19T10:00:00Z',
    lastLogin: '2024-12-19T14:00:00Z',
    loginCount: 1
  },
  {
    id: 'visitor_2',
    name: 'Priya Mehta',
    email: 'priya.mehta@example.com',
    phone: '+91 98765 43002',
    gender: 'Female',
    department: 'External',
    role: 'visitor',
    accessLevel: 'basic',
    isActive: true,
    designation: 'Guest',
    createdAt: '2024-12-18T10:00:00Z',
    lastLogin: '2024-12-18T15:00:00Z',
    loginCount: 1
  }
];

export const dummyHODs: User[] = [
  {
    id: 'hod_1',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@dypsn.edu',
    phone: '+91 98765 44001',
    gender: 'Male',
    department: 'Computer Science',
    role: 'hod',
    accessLevel: 'approver',
    isActive: true,
    qualification: 'Ph.D. in Computer Science',
    specialization: 'Artificial Intelligence',
    experience: '20 years',
    designation: 'Head of Department',
    createdAt: '2003-01-15T10:00:00Z',
    lastLogin: '2024-12-20T09:00:00Z',
    loginCount: 600
  },
  {
    id: 'hod_2',
    name: 'Dr. Anjali Deshmukh',
    email: 'anjali.deshmukh@dypsn.edu',
    phone: '+91 98765 44002',
    gender: 'Female',
    department: 'Information Technology',
    role: 'hod',
    accessLevel: 'approver',
    isActive: true,
    qualification: 'Ph.D. in Information Technology',
    specialization: 'Cloud Computing',
    experience: '18 years',
    designation: 'Head of Department',
    createdAt: '2004-01-15T10:00:00Z',
    lastLogin: '2024-12-20T08:00:00Z',
    loginCount: 580
  }
];

// ==================== DUMMY LEAVE REQUESTS ====================
export const dummyLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave_1',
    userId: 'teacher_1',
    userName: 'Dr. Anjali Verma',
    department: 'Computer Science',
    leaveType: 'CL',
    fromDate: '2024-12-25',
    toDate: '2024-12-27',
    reason: 'Personal work',
    status: 'pending',
    submittedAt: '2024-12-20T10:00:00Z',
    daysCount: 3,
    currentApprovalLevel: 'hod'
  },
  {
    id: 'leave_2',
    userId: 'student_1',
    userName: 'Rajesh Kumar',
    department: 'Computer Science',
    leaveType: 'SL',
    fromDate: '2024-12-23',
    toDate: '2024-12-23',
    reason: 'Medical appointment',
    status: 'approved',
    submittedAt: '2024-12-19T09:00:00Z',
    approvedBy: 'teacher_1',
    approvedAt: '2024-12-19T14:00:00Z',
    daysCount: 1
  },
  {
    id: 'leave_3',
    userId: 'teacher_2',
    userName: 'Prof. Ramesh Iyer',
    department: 'Computer Science',
    leaveType: 'EL',
    fromDate: '2024-12-28',
    toDate: '2024-12-30',
    reason: 'Family function',
    status: 'pending',
    submittedAt: '2024-12-20T11:00:00Z',
    daysCount: 3,
    currentApprovalLevel: 'hod'
  }
];

// ==================== DUMMY ATTENDANCE ====================
export const dummyAttendanceLogs: AttendanceLog[] = [
  {
    id: 'att_1',
    userId: 'student_1',
    userName: 'Rajesh Kumar',
    date: '2024-12-20',
    status: 'present',
    subject: 'Data Structures',
    year: '2nd',
    sem: '3',
    div: 'A'
  },
  {
    id: 'att_2',
    userId: 'student_2',
    userName: 'Priya Sharma',
    date: '2024-12-20',
    status: 'present',
    subject: 'Data Structures',
    year: '2nd',
    sem: '3',
    div: 'A'
  },
  {
    id: 'att_3',
    userId: 'student_3',
    userName: 'Amit Patel',
    date: '2024-12-20',
    status: 'late',
    subject: 'Database Management',
    year: '3rd',
    sem: '5',
    div: 'B'
  },
  {
    id: 'att_4',
    userId: 'student_4',
    userName: 'Sneha Desai',
    date: '2024-12-20',
    status: 'absent',
    subject: 'Web Development',
    year: '2nd',
    sem: '3',
    div: 'A'
  }
];

// ==================== DUMMY NOTIFICATIONS ====================
export const dummyNotifications: Notification[] = [
  {
    id: 'notif_1',
    userId: 'student_1',
    title: 'Leave Request Approved',
    message: 'Your leave request for Dec 23 has been approved',
    type: 'success',
    timestamp: '2024-12-19T14:00:00Z',
    read: false,
    category: 'leave',
    priority: 'medium'
  },
  {
    id: 'notif_2',
    userId: 'teacher_1',
    title: 'New Leave Request',
    message: 'Rajesh Kumar has submitted a leave request',
    type: 'info',
    timestamp: '2024-12-20T10:00:00Z',
    read: false,
    category: 'leave',
    priority: 'high',
    actionRequired: true
  },
  {
    id: 'notif_3',
    userId: 'student_1',
    title: 'Attendance Marked',
    message: 'Your attendance has been marked for Data Structures',
    type: 'info',
    timestamp: '2024-12-20T09:30:00Z',
    read: true,
    category: 'attendance',
    priority: 'low'
  },
  {
    id: 'notif_4',
    userId: 'admin_1',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Dec 25, 2024 from 2 AM to 4 AM',
    type: 'warning',
    timestamp: '2024-12-20T08:00:00Z',
    read: false,
    category: 'system',
    priority: 'high'
  }
];

// ==================== DUMMY SUBJECTS ====================
export const dummySubjects: Subject[] = [
  {
    id: 'subj_1',
    subjectCode: 'CS301',
    subjectName: 'Data Structures',
    subjectType: 'Theory',
    credits: 4,
    hoursPerWeek: 4,
    department: 'Computer Science',
    year: '2nd',
    sem: '3',
    div: 'A',
    batch: '2024',
    teacherId: 'teacher_1',
    teacherName: 'Dr. Anjali Verma',
    teacherEmail: 'anjali.verma@dypsn.edu',
    description: 'Introduction to data structures and algorithms',
    isActive: true
  },
  {
    id: 'subj_2',
    subjectCode: 'CS302',
    subjectName: 'Database Management',
    subjectType: 'Theory',
    credits: 4,
    hoursPerWeek: 4,
    department: 'Computer Science',
    year: '3rd',
    sem: '5',
    div: 'B',
    batch: '2023',
    teacherId: 'teacher_2',
    teacherName: 'Prof. Ramesh Iyer',
    teacherEmail: 'ramesh.iyer@dypsn.edu',
    description: 'Database design and management',
    isActive: true
  },
  {
    id: 'subj_3',
    subjectCode: 'IT301',
    subjectName: 'Web Development',
    subjectType: 'Practical',
    credits: 3,
    hoursPerWeek: 3,
    department: 'Information Technology',
    year: '2nd',
    sem: '3',
    div: 'A',
    batch: '2024',
    teacherId: 'teacher_3',
    teacherName: 'Dr. Meera Nair',
    teacherEmail: 'meera.nair@dypsn.edu',
    description: 'Modern web development technologies',
    isActive: true
  }
];

// ==================== DUMMY RESULTS ====================
export const dummyResults: ResultRecord[] = [
  {
    id: 'result_1',
    userId: 'student_1',
    userName: 'Rajesh Kumar',
    rollNumber: 'CS2024001',
    batch: '2024',
    department: 'Computer Science',
    year: '2nd',
    sem: '3',
    div: 'A',
    subject: 'Data Structures',
    examType: 'UT1',
    marksObtained: 85,
    maxMarks: 100,
    percentage: 85,
    grade: 'A'
  },
  {
    id: 'result_2',
    userId: 'student_1',
    userName: 'Rajesh Kumar',
    rollNumber: 'CS2024001',
    batch: '2024',
    department: 'Computer Science',
    year: '2nd',
    sem: '3',
    div: 'A',
    subject: 'Data Structures',
    examType: 'Practical',
    marksObtained: 90,
    maxMarks: 100,
    percentage: 90,
    grade: 'A+'
  },
  {
    id: 'result_3',
    userId: 'student_2',
    userName: 'Priya Sharma',
    rollNumber: 'CS2024002',
    batch: '2024',
    department: 'Computer Science',
    year: '2nd',
    sem: '3',
    div: 'A',
    subject: 'Data Structures',
    examType: 'UT1',
    marksObtained: 92,
    maxMarks: 100,
    percentage: 92,
    grade: 'A+'
  }
];

// ==================== DUMMY COMPLAINTS ====================
export const dummyComplaints: Complaint[] = [
  {
    id: 'complaint_1',
    title: 'WiFi Connectivity Issue',
    description: 'WiFi is not working in the library area. Please fix this issue.',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Open',
    complainantName: 'Rajesh Kumar',
    complainantEmail: 'rajesh.kumar@dypsn.edu',
    complainantPhone: '+91 98765 43210',
    complainantRole: 'Student',
    department: 'Computer Science',
    submittedDate: '2024-12-19T10:00:00Z',
    lastUpdated: '2024-12-19T10:00:00Z',
    anonymous: false
  },
  {
    id: 'complaint_2',
    title: 'Canteen Food Quality',
    description: 'Food quality in canteen has deteriorated. Requesting improvement.',
    category: 'Canteen',
    priority: 'Medium',
    status: 'In Progress',
    complainantName: 'Priya Sharma',
    complainantEmail: 'priya.sharma@dypsn.edu',
    complainantPhone: '+91 98765 43211',
    complainantRole: 'Student',
    department: 'Computer Science',
    assignedTo: 'admin_1',
    assignedToEmail: 'suresh.kumar@dypsn.edu',
    submittedDate: '2024-12-18T14:00:00Z',
    lastUpdated: '2024-12-19T15:00:00Z',
    anonymous: false
  },
  {
    id: 'complaint_3',
    title: 'Projector Not Working',
    description: 'Projector in Lab 3 is not functioning properly.',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Resolved',
    complainantName: 'Dr. Anjali Verma',
    complainantEmail: 'anjali.verma@dypsn.edu',
    complainantPhone: '+91 98765 43001',
    complainantRole: 'Teacher',
    department: 'Computer Science',
    assignedTo: 'admin_2',
    assignedToEmail: 'kavita.shah@dypsn.edu',
    submittedDate: '2024-12-17T09:00:00Z',
    lastUpdated: '2024-12-18T16:00:00Z',
    resolution: 'Projector has been repaired and is now working properly.',
    anonymous: false
  }
];

// ==================== DUMMY EVENTS ====================
export const dummyEvents: Event[] = [
  {
    id: 'event_1',
    title: 'Tech Fest 2024',
    description: 'Annual technical festival with coding competitions, workshops, and tech talks.',
    date: '2024-12-28',
    time: '09:00',
    location: 'Main Auditorium',
    organizer: 'Computer Science Department',
    category: 'Technical',
    maxParticipants: 500,
    currentParticipants: 350,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Computer Science',
    contactEmail: 'techfest@dypsn.edu',
    contactPhone: '+91 98765 43001',
    registrationDeadline: '2024-12-25',
    requirements: 'Open to all students'
  },
  {
    id: 'event_2',
    title: 'Cultural Day Celebration',
    description: 'Annual cultural day with performances, food stalls, and cultural activities.',
    date: '2025-01-15',
    time: '10:00',
    location: 'College Ground',
    organizer: 'Cultural Committee',
    category: 'Cultural',
    maxParticipants: 1000,
    currentParticipants: 750,
    status: 'upcoming',
    registrationRequired: false,
    contactEmail: 'cultural@dypsn.edu',
    contactPhone: '+91 98765 40001'
  },
  {
    id: 'event_3',
    title: 'Sports Meet 2024',
    description: 'Inter-department sports competition including cricket, football, and athletics.',
    date: '2024-12-22',
    time: '08:00',
    location: 'Sports Complex',
    organizer: 'Sports Committee',
    category: 'Sports',
    maxParticipants: 300,
    currentParticipants: 280,
    status: 'ongoing',
    registrationRequired: true,
    registrationDeadline: '2024-12-20'
  }
];

// ==================== DUMMY CLUBS ====================
export const dummyClubs: Club[] = [
  {
    id: 'club_1',
    name: 'Coding Club',
    description: 'A club for coding enthusiasts to learn and practice programming.',
    category: 'Technical',
    president: 'Rajesh Kumar',
    presidentEmail: 'rajesh.kumar@dypsn.edu',
    presidentPhone: '+91 98765 43210',
    facultyAdvisor: 'Dr. Anjali Verma',
    advisorEmail: 'anjali.verma@dypsn.edu',
    totalMembers: 45,
    maxMembers: 100,
    establishedDate: '2020-01-15',
    status: 'active',
    activities: ['Weekly coding sessions', 'Hackathons', 'Guest lectures'],
    achievements: ['Won inter-college hackathon 2023', 'Organized tech fest 2024'],
    department: 'Computer Science',
    meetingSchedule: 'Every Friday, 4 PM',
    budget: 50000,
    socialMedia: {
      instagram: '@codingclub_dypsn',
      linkedin: 'coding-club-dypsn'
    }
  },
  {
    id: 'club_2',
    name: 'Photography Club',
    description: 'For photography enthusiasts to share and learn photography skills.',
    category: 'Cultural',
    president: 'Priya Sharma',
    presidentEmail: 'priya.sharma@dypsn.edu',
    presidentPhone: '+91 98765 43211',
    facultyAdvisor: 'Prof. Ramesh Iyer',
    advisorEmail: 'ramesh.iyer@dypsn.edu',
    totalMembers: 30,
    maxMembers: 50,
    establishedDate: '2021-06-01',
    status: 'active',
    activities: ['Photo walks', 'Workshops', 'Exhibitions'],
    achievements: ['Organized college photography exhibition'],
    department: 'Computer Science',
    meetingSchedule: 'Every Saturday, 3 PM'
  }
];

// ==================== DUMMY BUSES ====================
export const dummyBuses: Bus[] = [
  {
    id: 'bus_1',
    busNumber: 'BUS-001',
    busName: 'College Bus 1',
    capacity: 45,
    type: 'AC',
    status: 'active',
    driverId: 'driver_1',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98765 41001',
    registrationNumber: 'MH-12-AB-1234',
    model: 'Tata Starbus',
    year: 2022,
    insuranceExpiry: '2025-06-30',
    lastServiceDate: '2024-11-15',
    nextServiceDate: '2025-01-15',
    fuelType: 'Diesel',
    features: ['AC', 'GPS Tracking', 'First Aid'],
    route: {
      routeName: 'Route 1 - Andheri',
      routeNumber: 'R001',
      startLocation: 'Andheri Station',
      endLocation: 'College Campus',
      stops: [
        {
          id: 'stop_1',
          name: 'Andheri Station',
          address: 'Andheri Railway Station',
          arrivalTime: '07:00',
          sequence: 1,
          isMainStop: true
        },
        {
          id: 'stop_2',
          name: 'Juhu Beach',
          address: 'Juhu Beach Road',
          arrivalTime: '07:20',
          sequence: 2,
          isMainStop: false
        },
        {
          id: 'stop_3',
          name: 'College Campus',
          address: 'DYPSN Campus',
          arrivalTime: '07:45',
          sequence: 3,
          isMainStop: true
        }
      ],
      distance: 15,
      estimatedTime: 45,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '07:00',
      endTime: '18:00'
    }
  },
  {
    id: 'bus_2',
    busNumber: 'BUS-002',
    busName: 'College Bus 2',
    capacity: 50,
    type: 'Non-AC',
    status: 'active',
    driverId: 'driver_2',
    driverName: 'Suresh Patel',
    driverPhone: '+91 98765 41002',
    registrationNumber: 'MH-12-CD-5678',
    model: 'Ashok Leyland',
    year: 2021,
    insuranceExpiry: '2025-03-31',
    lastServiceDate: '2024-12-01',
    nextServiceDate: '2025-02-01',
    fuelType: 'Diesel',
    features: ['GPS Tracking', 'First Aid'],
    route: {
      routeName: 'Route 2 - Borivali',
      routeNumber: 'R002',
      startLocation: 'Borivali Station',
      endLocation: 'College Campus',
      stops: [
        {
          id: 'stop_4',
          name: 'Borivali Station',
          address: 'Borivali Railway Station',
          arrivalTime: '07:15',
          sequence: 1,
          isMainStop: true
        },
        {
          id: 'stop_5',
          name: 'College Campus',
          address: 'DYPSN Campus',
          arrivalTime: '08:00',
          sequence: 2,
          isMainStop: true
        }
      ],
      distance: 20,
      estimatedTime: 45,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '07:15',
      endTime: '18:15'
    }
  }
];

// ==================== DUMMY LOST & FOUND ====================
export const dummyLostFoundItems: LostFoundItem[] = [
  {
    id: 'lf_1',
    itemName: 'Laptop Bag',
    description: 'Black laptop bag with college logo',
    category: 'accessories',
    foundBy: 'Security Guard',
    foundByPhone: '+91 98765 40010',
    foundByEmail: 'security@dypsn.edu',
    foundLocation: 'Main Gate',
    foundDate: '2024-12-19',
    foundTime: '14:30',
    currentHolder: 'Admin Office',
    currentHolderPhone: '+91 98765 40001',
    currentHolderEmail: 'admin@dypsn.edu',
    currentHolderRole: 'admin',
    status: 'found',
    notes: 'Contains laptop and charger'
  },
  {
    id: 'lf_2',
    itemName: 'Mobile Phone',
    description: 'Samsung Galaxy phone, black color',
    category: 'electronics',
    foundBy: 'Cleaner',
    foundByPhone: '+91 98765 40020',
    foundLocation: 'Library',
    foundDate: '2024-12-18',
    foundTime: '16:00',
    currentHolder: 'Library Staff',
    currentHolderPhone: '+91 98765 40030',
    currentHolderEmail: 'library@dypsn.edu',
    currentHolderRole: 'library-staff',
    status: 'claimed',
    claimedBy: 'Amit Patel',
    claimedDate: '2024-12-19',
    claimedByPhone: '+91 98765 43212'
  },
  {
    id: 'lf_3',
    itemName: 'College ID Card',
    description: 'Student ID card - Name: Priya Sharma',
    category: 'documents',
    foundBy: 'Teacher',
    foundByPhone: '+91 98765 43001',
    foundByEmail: 'anjali.verma@dypsn.edu',
    foundLocation: 'Lab 2',
    foundDate: '2024-12-20',
    foundTime: '10:15',
    currentHolder: 'Lab Assistant',
    currentHolderPhone: '+91 98765 40040',
    currentHolderRole: 'lab-assistant',
    status: 'found'
  }
];

// ==================== DUMMY HOSTEL ROOMS ====================
export const dummyHostelRooms: HostelRoom[] = [
  {
    id: 'room_1',
    roomNumber: '101',
    roomType: 'double',
    floor: 1,
    building: 'Building A',
    capacity: 2,
    currentOccupancy: 1,
    rent: 5000,
    amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Study Table'],
    status: 'available',
    description: 'Spacious double room with all modern amenities',
    contactPerson: 'Hostel Warden',
    contactPhone: '+91 98765 50001',
    contactEmail: 'hostel@dypsn.edu',
    externalWebsite: 'https://hostel.dypsn.edu/room-101',
    rules: ['No smoking', 'No loud music after 10 PM', 'Visitors allowed only on weekends'],
    location: 'Near College Campus, 500m away',
    distanceFromCollege: 0.5
  },
  {
    id: 'room_2',
    roomNumber: '205',
    roomType: 'triple',
    floor: 2,
    building: 'Building B',
    capacity: 3,
    currentOccupancy: 3,
    rent: 4000,
    amenities: ['WiFi', 'Shared Bathroom', 'Study Table'],
    status: 'occupied',
    description: 'Triple sharing room with good ventilation',
    contactPerson: 'Hostel Warden',
    contactPhone: '+91 98765 50001',
    contactEmail: 'hostel@dypsn.edu',
    externalWebsite: 'https://hostel.dypsn.edu/room-205',
    rules: ['No smoking', 'No loud music after 10 PM'],
    location: 'Near College Campus, 500m away',
    distanceFromCollege: 0.5
  },
  {
    id: 'room_3',
    roomNumber: '301',
    roomType: 'single',
    floor: 3,
    building: 'Building A',
    capacity: 1,
    currentOccupancy: 0,
    rent: 8000,
    amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Study Table', 'Wardrobe'],
    status: 'available',
    description: 'Premium single room with all facilities',
    contactPerson: 'Hostel Warden',
    contactPhone: '+91 98765 50001',
    contactEmail: 'hostel@dypsn.edu',
    externalWebsite: 'https://hostel.dypsn.edu/room-301',
    rules: ['No smoking', 'No loud music after 10 PM', 'Visitors allowed only on weekends'],
    location: 'Near College Campus, 500m away',
    distanceFromCollege: 0.5
  }
];

// ==================== DUMMY DEPARTMENTS ====================
export const dummyDepartments: Department[] = [
  {
    id: 'dept_1',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Engineering',
    hodId: 'teacher_1',
    hodName: 'Dr. Anjali Verma',
    hodEmail: 'anjali.verma@dypsn.edu',
    totalTeachers: 25,
    totalStudents: 450,
    isActive: true,
    createdAt: '2010-01-15T10:00:00Z'
  },
  {
    id: 'dept_2',
    name: 'Information Technology',
    code: 'IT',
    description: 'Department of Information Technology',
    hodId: 'teacher_3',
    hodName: 'Dr. Meera Nair',
    hodEmail: 'meera.nair@dypsn.edu',
    totalTeachers: 20,
    totalStudents: 350,
    isActive: true,
    createdAt: '2012-01-15T10:00:00Z'
  },
  {
    id: 'dept_3',
    name: 'Mechanical Engineering',
    code: 'ME',
    description: 'Department of Mechanical Engineering',
    totalTeachers: 30,
    totalStudents: 500,
    isActive: true,
    createdAt: '2008-01-15T10:00:00Z'
  }
];

// ==================== DUMMY LEAVE BALANCES ====================
export const dummyLeaveBalances: LeaveBalance[] = [
  {
    userId: 'teacher_1',
    CL: 8,
    ML: 12,
    EL: 15,
    totalUsed: 5,
    totalAvailable: 30
  },
  {
    userId: 'teacher_2',
    CL: 10,
    ML: 12,
    EL: 15,
    totalUsed: 8,
    totalAvailable: 29
  },
  {
    userId: 'student_1',
    CL: 5,
    ML: 0,
    EL: 0,
    totalUsed: 2,
    totalAvailable: 3
  }
];

// ==================== DUMMY AUDIT LOGS ====================
export const dummyAuditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    userId: 'admin_1',
    userName: 'Dr. Suresh Kumar',
    action: 'CREATE_USER',
    target: 'student_1',
    timestamp: '2024-12-20T10:00:00Z',
    details: { role: 'student', department: 'Computer Science' }
  },
  {
    id: 'audit_2',
    userId: 'teacher_1',
    userName: 'Dr. Anjali Verma',
    action: 'APPROVE_LEAVE',
    target: 'leave_2',
    timestamp: '2024-12-19T14:00:00Z',
    details: { leaveType: 'SL', days: 1 }
  },
  {
    id: 'audit_3',
    userId: 'admin_2',
    userName: 'Mrs. Kavita Shah',
    action: 'UPDATE_COMPLAINT',
    target: 'complaint_3',
    timestamp: '2024-12-18T16:00:00Z',
    details: { status: 'Resolved', resolution: 'Projector repaired' }
  }
];

// ==================== HELPER FUNCTIONS ====================
export const getDummyData = {
  students: () => dummyStudents,
  teachers: () => dummyTeachers,
  admins: () => dummyAdmins,
  nonTeachingStaff: () => dummyNonTeachingStaff,
  drivers: () => dummyDrivers,
  visitors: () => dummyVisitors,
  hods: () => dummyHODs,
  allUsers: () => [...dummyStudents, ...dummyTeachers, ...dummyAdmins, ...dummyNonTeachingStaff, ...dummyDrivers, ...dummyVisitors, ...dummyHODs],
  leaveRequests: () => dummyLeaveRequests,
  attendanceLogs: () => dummyAttendanceLogs,
  notifications: () => dummyNotifications,
  subjects: () => dummySubjects,
  results: () => dummyResults,
  complaints: () => dummyComplaints,
  events: () => dummyEvents,
  clubs: () => dummyClubs,
  buses: () => dummyBuses,
  lostFoundItems: () => dummyLostFoundItems,
  hostelRooms: () => dummyHostelRooms,
  departments: () => dummyDepartments,
  leaveBalances: () => dummyLeaveBalances,
  auditLogs: () => dummyAuditLogs
};

// Export flag to enable/disable dummy data
export const USE_DUMMY_DATA = true; // Set to false to disable dummy data

// ==================== HELPER FUNCTIONS FOR COMPONENTS ====================
export const injectDummyData = {
  // For components that fetch data, return dummy data if flag is enabled and real data is empty
  students: (realData: User[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyStudents : realData,
  teachers: (realData: User[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyTeachers : realData,
  leaveRequests: (realData: LeaveRequest[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyLeaveRequests : realData,
  attendanceLogs: (realData: AttendanceLog[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyAttendanceLogs : realData,
  notifications: (realData: Notification[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyNotifications : realData,
  subjects: (realData: Subject[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummySubjects : realData,
  results: (realData: ResultRecord[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyResults : realData,
  complaints: (realData: Complaint[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyComplaints : realData,
  events: (realData: Event[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyEvents : realData,
  clubs: (realData: Club[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyClubs : realData,
  buses: (realData: Bus[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyBuses : realData,
  lostFoundItems: (realData: LostFoundItem[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyLostFoundItems : realData,
  hostelRooms: (realData: HostelRoom[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyHostelRooms : realData,
  departments: (realData: Department[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyDepartments : realData,
  leaveBalances: (realData: LeaveBalance[] = [], userId?: string) => {
    if (USE_DUMMY_DATA && realData.length === 0) {
      if (userId) {
        const balance = dummyLeaveBalances.find(b => b.userId === userId);
        return balance ? [balance] : dummyLeaveBalances;
      }
      return dummyLeaveBalances;
    }
    return realData;
  },
  auditLogs: (realData: AuditLog[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyAuditLogs : realData
};

// Helper to get dummy data for a specific user
export const getDummyDataForUser = (userId: string) => {
  return {
    leaveRequests: dummyLeaveRequests.filter(lr => lr.userId === userId),
    attendanceLogs: dummyAttendanceLogs.filter(al => al.userId === userId),
    notifications: dummyNotifications.filter(n => n.userId === userId),
    results: dummyResults.filter(r => r.userId === userId),
    leaveBalance: dummyLeaveBalances.find(lb => lb.userId === userId)
  };
};


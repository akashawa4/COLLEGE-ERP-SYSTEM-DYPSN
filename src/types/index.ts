export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'hod' | 'admin' | 'non-teaching';
  department: string;
  accessLevel: 'basic' | 'approver' | 'full';
  isActive: boolean;
  phone?: string;
  rollNumber?: string;
  joiningDate?: string;
  designation?: string;
  gender?: string;
  div?: string;
  year?: string;
  sem?: string;
  createdAt?: string;
  lastLogin?: string;
  loginCount?: number;
  updatedAt?: string;
  
  // Teacher-specific fields
  qualification?: string;
  specialization?: string;
  experience?: string;
  salary?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  
  // Non-Teaching Staff specific fields
  subRole?: 'cleaner' | 'peon' | 'lab-assistant' | 'security' | 'maintenance' | 'canteen-staff' | 'library-staff' | 'office-assistant' | 'driver' | 'gardener';
  workShift?: 'morning' | 'evening' | 'night' | 'full-day';
  workLocation?: string;
  supervisor?: string;
  contractType?: 'permanent' | 'temporary' | 'contract';
  workStatus?: 'active' | 'on-leave' | 'suspended' | 'terminated';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  hodId?: string;
  hodName?: string;
  hodEmail?: string;
  totalTeachers: number;
  totalStudents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: string;
  leaveType: 'CL' | 'ML' | 'EL' | 'LOP' | 'COH' | 'SL' | 'OD' | 'OTH';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  comments?: string;
  daysCount: number;
  currentApprovalLevel?: string;
  approvalFlow?: string[];
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
  subject?: string;
  notes?: string;
  createdAt?: any;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  date: string | Date;
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
  notes?: string;
  subject?: string; // Added for subject-wise attendance
  createdAt?: any; // Firestore timestamp
  year?: string;
  sem?: string;
  div?: string;
  studentYear?: string; // Student's academic year (2nd, 3rd, 4th) for batch path
}

export interface LeaveBalance {
  userId: string;
  CL: number;
  ML: number;
  EL: number;
  totalUsed: number;
  totalAvailable: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  readAt?: any; // Firestore timestamp
  targetRoles?: string[];
  createdAt?: any; // Firestore timestamp
  category?: 'leave' | 'attendance' | 'system' | 'announcement';
  priority?: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  subjectType: 'Theory' | 'Practical' | 'Lab' | 'Project' | 'Seminar' | 'Tutorial';
  credits: number;
  hoursPerWeek: number;
  department: string;
  year: string;
  sem: string;
  div: string;
  batch: string;
  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string[];
  syllabus?: string;
  evaluationScheme?: {
    internal: number;
    external: number;
    total: number;
  };
  isActive: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  createdBy?: string;
  updatedBy?: string;
}

export interface ResultRecord {
  id: string;
  userId: string;
  userName?: string;
  rollNumber: string;
  batch: string; // e.g., 2025
  department: string; // e.g., CSE
  year: string; // e.g., 4th
  sem: string; // e.g., 7
  div: string; // e.g., B
  subject: string; // e.g., Internship
  examType: string; // e.g., UT1 | UT2 | Practical
  marksObtained: number;
  maxMarks: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

// Institution Settings Interfaces
export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface FeeStructureItem {
  id: string;
  name: string;
  category: string;
  reservationCategory: string; // Open, OBC, SC, ST, etc.
  department: string;
  amount: number;
  description: string;
  isActive: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface InstitutionInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  establishedYear: string;
  affiliation: string;
  accreditation: string;
  updatedAt?: any; // Firestore timestamp
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'Academic' | 'Administrative' | 'Infrastructure' | 'Hostel' | 'Canteen' | 'Library' | 'Sports' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
  complainantName: string;
  complainantEmail: string;
  complainantPhone: string;
  complainantRole: 'Student' | 'Teacher' | 'Staff' | 'Parent' | 'Other';
  department?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  submittedDate: string;
  lastUpdated: string;
  resolution?: string;
  attachments?: string[];
  anonymous: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  organizer: string;
  category: "Academic" | "Cultural" | "Sports" | "Technical" | "Social" | "Other";
  maxParticipants?: number;
  currentParticipants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  registrationRequired: boolean;
  department?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationDeadline?: string;
  requirements?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: "Academic" | "Cultural" | "Sports" | "Technical" | "Social" | "Literary" | "Other";
  president: string;
  presidentEmail: string;
  presidentPhone: string;
  facultyAdvisor: string;
  advisorEmail: string;
  totalMembers: number;
  maxMembers?: number;
  establishedDate: string;
  status: "active" | "inactive" | "suspended";
  activities: string[];
  achievements: string[];
  department?: string;
  meetingSchedule?: string;
  budget?: number;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface ClubMember {
  id: string;
  clubId: string;
  name: string;
  email: string;
  role: "President" | "Vice President" | "Secretary" | "Treasurer" | "Member";
  joinDate: string;
  status: "active" | "inactive";
  studentId?: string;
  phone?: string;
  department?: string;
  year?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}
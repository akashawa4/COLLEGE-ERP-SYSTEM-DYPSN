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
  // Computer Science - 2nd Year
  { id: 'student_1', name: 'Rajesh Kumar', email: 'rajesh.kumar@dypsn.edu', phone: '+91 98765 43210', gender: 'Male', rollNumber: 'CS2024001', year: '2nd', sem: '3', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:30:00Z', loginCount: 45 },
  { id: 'student_2', name: 'Priya Sharma', email: 'priya.sharma@dypsn.edu', phone: '+91 98765 43211', gender: 'Female', rollNumber: 'CS2024002', year: '2nd', sem: '3', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:15:00Z', loginCount: 52 },
  { id: 'student_6', name: 'Arjun Mehta', email: 'arjun.mehta@dypsn.edu', phone: '+91 98765 43215', gender: 'Male', rollNumber: 'CS2024003', year: '2nd', sem: '3', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:00:00Z', loginCount: 48 },
  { id: 'student_7', name: 'Kavya Reddy', email: 'kavya.reddy@dypsn.edu', phone: '+91 98765 43216', gender: 'Female', rollNumber: 'CS2024004', year: '2nd', sem: '3', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T10:30:00Z', loginCount: 55 },
  { id: 'student_8', name: 'Rohit Joshi', email: 'rohit.joshi@dypsn.edu', phone: '+91 98765 43217', gender: 'Male', rollNumber: 'CS2024005', year: '2nd', sem: '3', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:45:00Z', loginCount: 42 },
  { id: 'student_9', name: 'Ananya Iyer', email: 'ananya.iyer@dypsn.edu', phone: '+91 98765 43218', gender: 'Female', rollNumber: 'CS2024006', year: '2nd', sem: '3', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:15:00Z', loginCount: 50 },
  // Computer Science - 3rd Year
  { id: 'student_3', name: 'Amit Patel', email: 'amit.patel@dypsn.edu', phone: '+91 98765 43212', gender: 'Male', rollNumber: 'CS2023001', year: '3rd', sem: '5', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:00:00Z', loginCount: 78 },
  { id: 'student_10', name: 'Siddharth Nair', email: 'siddharth.nair@dypsn.edu', phone: '+91 98765 43219', gender: 'Male', rollNumber: 'CS2023002', year: '3rd', sem: '5', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:20:00Z', loginCount: 85 },
  { id: 'student_11', name: 'Divya Menon', email: 'divya.menon@dypsn.edu', phone: '+91 98765 43220', gender: 'Female', rollNumber: 'CS2023003', year: '3rd', sem: '5', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T09:50:00Z', loginCount: 72 },
  { id: 'student_12', name: 'Karan Deshmukh', email: 'karan.deshmukh@dypsn.edu', phone: '+91 98765 43221', gender: 'Male', rollNumber: 'CS2023004', year: '3rd', sem: '5', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:15:00Z', loginCount: 90 },
  // Computer Science - 4th Year
  { id: 'student_13', name: 'Neha Gupta', email: 'neha.gupta@dypsn.edu', phone: '+91 98765 43222', gender: 'Female', rollNumber: 'CS2022001', year: '4th', sem: '7', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:00:00Z', loginCount: 120 },
  { id: 'student_14', name: 'Vishal Shah', email: 'vishal.shah@dypsn.edu', phone: '+91 98765 43223', gender: 'Male', rollNumber: 'CS2022002', year: '4th', sem: '7', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:30:00Z', loginCount: 135 },
  // Information Technology - 2nd Year
  { id: 'student_4', name: 'Sneha Desai', email: 'sneha.desai@dypsn.edu', phone: '+91 98765 43213', gender: 'Female', rollNumber: 'IT2024001', year: '2nd', sem: '3', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:45:00Z', loginCount: 38 },
  { id: 'student_15', name: 'Rahul Verma', email: 'rahul.verma@dypsn.edu', phone: '+91 98765 43224', gender: 'Male', rollNumber: 'IT2024002', year: '2nd', sem: '3', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T10:10:00Z', loginCount: 45 },
  { id: 'student_16', name: 'Pooja Kulkarni', email: 'pooja.kulkarni@dypsn.edu', phone: '+91 98765 43225', gender: 'Female', rollNumber: 'IT2024003', year: '2nd', sem: '3', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:30:00Z', loginCount: 40 },
  { id: 'student_17', name: 'Aditya Rao', email: 'aditya.rao@dypsn.edu', phone: '+91 98765 43226', gender: 'Male', rollNumber: 'IT2024004', year: '2nd', sem: '3', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:20:00Z', loginCount: 43 },
  // Information Technology - 3rd Year
  { id: 'student_18', name: 'Shreya Bhatt', email: 'shreya.bhatt@dypsn.edu', phone: '+91 98765 43227', gender: 'Female', rollNumber: 'IT2023001', year: '3rd', sem: '5', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:40:00Z', loginCount: 68 },
  { id: 'student_19', name: 'Mohit Agarwal', email: 'mohit.agarwal@dypsn.edu', phone: '+91 98765 43228', gender: 'Male', rollNumber: 'IT2023002', year: '3rd', sem: '5', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:00:00Z', loginCount: 75 },
  // Mechanical Engineering
  { id: 'student_5', name: 'Vikram Singh', email: 'vikram.singh@dypsn.edu', phone: '+91 98765 43214', gender: 'Male', rollNumber: 'ME2024001', year: '4th', sem: '7', div: 'C', department: 'Mechanical', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2021-01-15T10:00:00Z', lastLogin: '2024-12-20T11:00:00Z', loginCount: 120 },
  { id: 'student_20', name: 'Ravi Kumar', email: 'ravi.kumar@dypsn.edu', phone: '+91 98765 43229', gender: 'Male', rollNumber: 'ME2024002', year: '2nd', sem: '3', div: 'A', department: 'Mechanical', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:20:00Z', loginCount: 50 },
  { id: 'student_21', name: 'Sakshi Pandey', email: 'sakshi.pandey@dypsn.edu', phone: '+91 98765 43230', gender: 'Female', rollNumber: 'ME2024003', year: '2nd', sem: '3', div: 'A', department: 'Mechanical', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:10:00Z', loginCount: 47 },
  { id: 'student_22', name: 'Yash Malhotra', email: 'yash.malhotra@dypsn.edu', phone: '+91 98765 43231', gender: 'Male', rollNumber: 'ME2023001', year: '3rd', sem: '5', div: 'B', department: 'Mechanical', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:50:00Z', loginCount: 82 },
  // Electronics Engineering
  { id: 'student_23', name: 'Anjali Thakur', email: 'anjali.thakur@dypsn.edu', phone: '+91 98765 43232', gender: 'Female', rollNumber: 'EE2024001', year: '2nd', sem: '3', div: 'A', department: 'Electronics', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:25:00Z', loginCount: 44 },
  { id: 'student_24', name: 'Harsh Chawla', email: 'harsh.chawla@dypsn.edu', phone: '+91 98765 43233', gender: 'Male', rollNumber: 'EE2024002', year: '2nd', sem: '3', div: 'B', department: 'Electronics', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:50:00Z', loginCount: 41 },
  { id: 'student_25', name: 'Isha Kapoor', email: 'isha.kapoor@dypsn.edu', phone: '+91 98765 43234', gender: 'Female', rollNumber: 'EE2023001', year: '3rd', sem: '5', div: 'A', department: 'Electronics', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:15:00Z', loginCount: 70 },
  // Civil Engineering
  { id: 'student_26', name: 'Kunal Jain', email: 'kunal.jain@dypsn.edu', phone: '+91 98765 43235', gender: 'Male', rollNumber: 'CE2024001', year: '2nd', sem: '3', div: 'A', department: 'Civil', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:05:00Z', loginCount: 46 },
  { id: 'student_27', name: 'Meera Soni', email: 'meera.soni@dypsn.edu', phone: '+91 98765 43236', gender: 'Female', rollNumber: 'CE2024002', year: '2nd', sem: '3', div: 'B', department: 'Civil', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:40:00Z', loginCount: 49 },
  { id: 'student_28', name: 'Nikhil Bansal', email: 'nikhil.bansal@dypsn.edu', phone: '+91 98765 43237', gender: 'Male', rollNumber: 'CE2023001', year: '3rd', sem: '5', div: 'A', department: 'Civil', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:10:00Z', loginCount: 88 },
  // First Year Students
  { id: 'student_29', name: 'Aarav Patel', email: 'aarav.patel@dypsn.edu', phone: '+91 98765 43238', gender: 'Male', rollNumber: 'CS2025001', year: '1st', sem: '1', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:05:00Z', loginCount: 35 },
  { id: 'student_30', name: 'Ishita Reddy', email: 'ishita.reddy@dypsn.edu', phone: '+91 98765 43239', gender: 'Female', rollNumber: 'IT2025001', year: '1st', sem: '1', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:00:00Z', loginCount: 32 },
  { id: 'student_31', name: 'Varun Desai', email: 'varun.desai@dypsn.edu', phone: '+91 98765 43240', gender: 'Male', rollNumber: 'ME2025001', year: '1st', sem: '1', div: 'A', department: 'Mechanical', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:25:00Z', loginCount: 38 },
  { id: 'student_32', name: 'Tanvi Nair', email: 'tanvi.nair@dypsn.edu', phone: '+91 98765 43241', gender: 'Female', rollNumber: 'EE2025001', year: '1st', sem: '1', div: 'A', department: 'Electronics', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:35:00Z', loginCount: 30 },
  
  // Additional students for all year/sem/div combinations - Computer Science
  // 1st Year - Sem 1
  { id: 'student_33', name: 'Rohan Kapoor', email: 'rohan.kapoor@dypsn.edu', phone: '+91 98765 43242', gender: 'Male', rollNumber: 'CS2025002', year: '1st', sem: '1', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:10:00Z', loginCount: 33 },
  { id: 'student_34', name: 'Sanya Malhotra', email: 'sanya.malhotra@dypsn.edu', phone: '+91 98765 43243', gender: 'Female', rollNumber: 'CS2025003', year: '1st', sem: '1', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:15:00Z', loginCount: 31 },
  { id: 'student_35', name: 'Vikram Agarwal', email: 'vikram.agarwal@dypsn.edu', phone: '+91 98765 43244', gender: 'Male', rollNumber: 'CS2025004', year: '1st', sem: '1', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:30:00Z', loginCount: 29 },
  // 1st Year - Sem 2
  { id: 'student_36', name: 'Anika Singh', email: 'anika.singh@dypsn.edu', phone: '+91 98765 43245', gender: 'Female', rollNumber: 'CS2025005', year: '1st', sem: '2', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:20:00Z', loginCount: 34 },
  { id: 'student_37', name: 'Karan Mehta', email: 'karan.mehta@dypsn.edu', phone: '+91 98765 43246', gender: 'Male', rollNumber: 'CS2025006', year: '1st', sem: '2', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:40:00Z', loginCount: 32 },
  { id: 'student_38', name: 'Pooja Sharma', email: 'pooja.sharma@dypsn.edu', phone: '+91 98765 43247', gender: 'Female', rollNumber: 'CS2025007', year: '1st', sem: '2', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:25:00Z', loginCount: 30 },
  { id: 'student_39', name: 'Rahul Gupta', email: 'rahul.gupta@dypsn.edu', phone: '+91 98765 43248', gender: 'Male', rollNumber: 'CS2025008', year: '1st', sem: '2', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:50:00Z', loginCount: 28 },
  // 2nd Year - Sem 3 (already have some, adding more for B, C, D)
  { id: 'student_40', name: 'Sneha Verma', email: 'sneha.verma@dypsn.edu', phone: '+91 98765 43249', gender: 'Female', rollNumber: 'CS2024007', year: '2nd', sem: '3', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:40:00Z', loginCount: 46 },
  { id: 'student_41', name: 'Aditya Iyer', email: 'aditya.iyer@dypsn.edu', phone: '+91 98765 43250', gender: 'Male', rollNumber: 'CS2024008', year: '2nd', sem: '3', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T08:55:00Z', loginCount: 44 },
  // 2nd Year - Sem 4
  { id: 'student_42', name: 'Divya Nair', email: 'divya.nair@dypsn.edu', phone: '+91 98765 43251', gender: 'Female', rollNumber: 'CS2024009', year: '2nd', sem: '4', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:50:00Z', loginCount: 48 },
  { id: 'student_43', name: 'Mohit Desai', email: 'mohit.desai@dypsn.edu', phone: '+91 98765 43252', gender: 'Male', rollNumber: 'CS2024010', year: '2nd', sem: '4', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:05:00Z', loginCount: 47 },
  { id: 'student_44', name: 'Kavya Joshi', email: 'kavya.joshi@dypsn.edu', phone: '+91 98765 43253', gender: 'Female', rollNumber: 'CS2024011', year: '2nd', sem: '4', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:10:00Z', loginCount: 45 },
  { id: 'student_45', name: 'Rohit Patel', email: 'rohit.patel@dypsn.edu', phone: '+91 98765 43254', gender: 'Male', rollNumber: 'CS2024012', year: '2nd', sem: '4', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:15:00Z', loginCount: 43 },
  // 3rd Year - Sem 5 (already have some, adding more for C, D)
  { id: 'student_46', name: 'Ananya Reddy', email: 'ananya.reddy@dypsn.edu', phone: '+91 98765 43255', gender: 'Female', rollNumber: 'CS2023005', year: '3rd', sem: '5', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:25:00Z', loginCount: 80 },
  { id: 'student_47', name: 'Siddharth Kumar', email: 'siddharth.kumar@dypsn.edu', phone: '+91 98765 43256', gender: 'Male', rollNumber: 'CS2023006', year: '3rd', sem: '5', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:30:00Z', loginCount: 78 },
  // 3rd Year - Sem 6
  { id: 'student_48', name: 'Karan Menon', email: 'karan.menon@dypsn.edu', phone: '+91 98765 43257', gender: 'Male', rollNumber: 'CS2023007', year: '3rd', sem: '6', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:35:00Z', loginCount: 82 },
  { id: 'student_49', name: 'Divya Deshmukh', email: 'divya.deshmukh@dypsn.edu', phone: '+91 98765 43258', gender: 'Female', rollNumber: 'CS2023008', year: '3rd', sem: '6', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:40:00Z', loginCount: 85 },
  { id: 'student_50', name: 'Amit Nair', email: 'amit.nair@dypsn.edu', phone: '+91 98765 43259', gender: 'Male', rollNumber: 'CS2023009', year: '3rd', sem: '6', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:45:00Z', loginCount: 83 },
  { id: 'student_51', name: 'Sneha Iyer', email: 'sneha.iyer@dypsn.edu', phone: '+91 98765 43260', gender: 'Female', rollNumber: 'CS2023010', year: '3rd', sem: '6', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:50:00Z', loginCount: 81 },
  // 4th Year - Sem 7 (already have some, adding more for B, C, D)
  { id: 'student_52', name: 'Vishal Patel', email: 'vishal.patel@dypsn.edu', phone: '+91 98765 43261', gender: 'Male', rollNumber: 'CS2022003', year: '4th', sem: '7', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:35:00Z', loginCount: 130 },
  { id: 'student_53', name: 'Neha Reddy', email: 'neha.reddy@dypsn.edu', phone: '+91 98765 43262', gender: 'Female', rollNumber: 'CS2022004', year: '4th', sem: '7', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:40:00Z', loginCount: 128 },
  { id: 'student_54', name: 'Rajesh Shah', email: 'rajesh.shah@dypsn.edu', phone: '+91 98765 43263', gender: 'Male', rollNumber: 'CS2022005', year: '4th', sem: '7', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:45:00Z', loginCount: 125 },
  // 4th Year - Sem 8
  { id: 'student_55', name: 'Priya Gupta', email: 'priya.gupta@dypsn.edu', phone: '+91 98765 43264', gender: 'Female', rollNumber: 'CS2022006', year: '4th', sem: '8', div: 'A', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:50:00Z', loginCount: 140 },
  { id: 'student_56', name: 'Arjun Verma', email: 'arjun.verma@dypsn.edu', phone: '+91 98765 43265', gender: 'Male', rollNumber: 'CS2022007', year: '4th', sem: '8', div: 'B', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T09:55:00Z', loginCount: 138 },
  { id: 'student_57', name: 'Kavya Kumar', email: 'kavya.kumar@dypsn.edu', phone: '+91 98765 43266', gender: 'Female', rollNumber: 'CS2022008', year: '4th', sem: '8', div: 'C', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T10:00:00Z', loginCount: 135 },
  { id: 'student_58', name: 'Rohit Singh', email: 'rohit.singh@dypsn.edu', phone: '+91 98765 43267', gender: 'Male', rollNumber: 'CS2022009', year: '4th', sem: '8', div: 'D', department: 'Computer Science', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T10:05:00Z', loginCount: 133 },
  
  // Information Technology - Additional students for all combinations
  // 1st Year - Sem 1
  { id: 'student_59', name: 'Rahul Kulkarni', email: 'rahul.kulkarni@dypsn.edu', phone: '+91 98765 43268', gender: 'Male', rollNumber: 'IT2025002', year: '1st', sem: '1', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:15:00Z', loginCount: 31 },
  { id: 'student_60', name: 'Pooja Rao', email: 'pooja.rao@dypsn.edu', phone: '+91 98765 43269', gender: 'Female', rollNumber: 'IT2025003', year: '1st', sem: '1', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:20:00Z', loginCount: 29 },
  { id: 'student_61', name: 'Aditya Bhatt', email: 'aditya.bhatt@dypsn.edu', phone: '+91 98765 43270', gender: 'Male', rollNumber: 'IT2025004', year: '1st', sem: '1', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:35:00Z', loginCount: 27 },
  // 1st Year - Sem 2
  { id: 'student_62', name: 'Shreya Agarwal', email: 'shreya.agarwal@dypsn.edu', phone: '+91 98765 43271', gender: 'Female', rollNumber: 'IT2025005', year: '1st', sem: '2', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:30:00Z', loginCount: 33 },
  { id: 'student_63', name: 'Mohit Verma', email: 'mohit.verma@dypsn.edu', phone: '+91 98765 43272', gender: 'Male', rollNumber: 'IT2025006', year: '1st', sem: '2', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:45:00Z', loginCount: 31 },
  { id: 'student_64', name: 'Kavya Nair', email: 'kavya.nair@dypsn.edu', phone: '+91 98765 43273', gender: 'Female', rollNumber: 'IT2025007', year: '1st', sem: '2', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T09:40:00Z', loginCount: 29 },
  { id: 'student_65', name: 'Rohit Menon', email: 'rohit.menon@dypsn.edu', phone: '+91 98765 43274', gender: 'Male', rollNumber: 'IT2025008', year: '1st', sem: '2', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-07-15T10:00:00Z', lastLogin: '2024-12-20T08:55:00Z', loginCount: 27 },
  // 2nd Year - Sem 3 (adding C, D)
  { id: 'student_66', name: 'Ananya Deshmukh', email: 'ananya.deshmukh@dypsn.edu', phone: '+91 98765 43275', gender: 'Female', rollNumber: 'IT2024005', year: '2nd', sem: '3', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:50:00Z', loginCount: 42 },
  { id: 'student_67', name: 'Siddharth Iyer', email: 'siddharth.iyer@dypsn.edu', phone: '+91 98765 43276', gender: 'Male', rollNumber: 'IT2024006', year: '2nd', sem: '3', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:05:00Z', loginCount: 41 },
  // 2nd Year - Sem 4
  { id: 'student_68', name: 'Karan Reddy', email: 'karan.reddy@dypsn.edu', phone: '+91 98765 43277', gender: 'Male', rollNumber: 'IT2024007', year: '2nd', sem: '4', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:10:00Z', loginCount: 44 },
  { id: 'student_69', name: 'Divya Patel', email: 'divya.patel@dypsn.edu', phone: '+91 98765 43278', gender: 'Female', rollNumber: 'IT2024008', year: '2nd', sem: '4', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:15:00Z', loginCount: 43 },
  { id: 'student_70', name: 'Amit Kumar', email: 'amit.kumar@dypsn.edu', phone: '+91 98765 43279', gender: 'Male', rollNumber: 'IT2024009', year: '2nd', sem: '4', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:20:00Z', loginCount: 42 },
  { id: 'student_71', name: 'Sneha Gupta', email: 'sneha.gupta@dypsn.edu', phone: '+91 98765 43280', gender: 'Female', rollNumber: 'IT2024010', year: '2nd', sem: '4', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2024-01-15T10:00:00Z', lastLogin: '2024-12-20T09:25:00Z', loginCount: 41 },
  // 3rd Year - Sem 5 (adding B, C, D)
  { id: 'student_72', name: 'Vishal Nair', email: 'vishal.nair@dypsn.edu', phone: '+91 98765 43281', gender: 'Male', rollNumber: 'IT2023003', year: '3rd', sem: '5', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:50:00Z', loginCount: 70 },
  { id: 'student_73', name: 'Neha Joshi', email: 'neha.joshi@dypsn.edu', phone: '+91 98765 43282', gender: 'Female', rollNumber: 'IT2023004', year: '3rd', sem: '5', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T10:55:00Z', loginCount: 72 },
  { id: 'student_74', name: 'Rajesh Menon', email: 'rajesh.menon@dypsn.edu', phone: '+91 98765 43283', gender: 'Male', rollNumber: 'IT2023005', year: '3rd', sem: '5', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:00:00Z', loginCount: 71 },
  // 3rd Year - Sem 6
  { id: 'student_75', name: 'Priya Desai', email: 'priya.desai@dypsn.edu', phone: '+91 98765 43284', gender: 'Female', rollNumber: 'IT2023006', year: '3rd', sem: '6', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:05:00Z', loginCount: 73 },
  { id: 'student_76', name: 'Arjun Iyer', email: 'arjun.iyer@dypsn.edu', phone: '+91 98765 43285', gender: 'Male', rollNumber: 'IT2023007', year: '3rd', sem: '6', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:10:00Z', loginCount: 75 },
  { id: 'student_77', name: 'Kavya Reddy', email: 'kavya.reddy2@dypsn.edu', phone: '+91 98765 43286', gender: 'Female', rollNumber: 'IT2023008', year: '3rd', sem: '6', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:15:00Z', loginCount: 74 },
  { id: 'student_78', name: 'Rohit Patel', email: 'rohit.patel2@dypsn.edu', phone: '+91 98765 43287', gender: 'Male', rollNumber: 'IT2023009', year: '3rd', sem: '6', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2023-01-15T10:00:00Z', lastLogin: '2024-12-20T11:20:00Z', loginCount: 73 },
  // 4th Year - Sem 7
  { id: 'student_79', name: 'Ananya Kumar', email: 'ananya.kumar@dypsn.edu', phone: '+91 98765 43288', gender: 'Female', rollNumber: 'IT2022001', year: '4th', sem: '7', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:10:00Z', loginCount: 125 },
  { id: 'student_80', name: 'Siddharth Singh', email: 'siddharth.singh@dypsn.edu', phone: '+91 98765 43289', gender: 'Male', rollNumber: 'IT2022002', year: '4th', sem: '7', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:15:00Z', loginCount: 123 },
  { id: 'student_81', name: 'Karan Nair', email: 'karan.nair@dypsn.edu', phone: '+91 98765 43290', gender: 'Male', rollNumber: 'IT2022003', year: '4th', sem: '7', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:20:00Z', loginCount: 121 },
  { id: 'student_82', name: 'Divya Joshi', email: 'divya.joshi@dypsn.edu', phone: '+91 98765 43291', gender: 'Female', rollNumber: 'IT2022004', year: '4th', sem: '7', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:25:00Z', loginCount: 119 },
  // 4th Year - Sem 8
  { id: 'student_83', name: 'Amit Menon', email: 'amit.menon@dypsn.edu', phone: '+91 98765 43292', gender: 'Male', rollNumber: 'IT2022005', year: '4th', sem: '8', div: 'A', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:30:00Z', loginCount: 130 },
  { id: 'student_84', name: 'Sneha Deshmukh', email: 'sneha.deshmukh@dypsn.edu', phone: '+91 98765 43293', gender: 'Female', rollNumber: 'IT2022006', year: '4th', sem: '8', div: 'B', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:35:00Z', loginCount: 128 },
  { id: 'student_85', name: 'Vishal Iyer', email: 'vishal.iyer@dypsn.edu', phone: '+91 98765 43294', gender: 'Male', rollNumber: 'IT2022007', year: '4th', sem: '8', div: 'C', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:40:00Z', loginCount: 126 },
  { id: 'student_86', name: 'Neha Reddy', email: 'neha.reddy2@dypsn.edu', phone: '+91 98765 43295', gender: 'Female', rollNumber: 'IT2022008', year: '4th', sem: '8', div: 'D', department: 'Information Technology', role: 'student', accessLevel: 'basic', isActive: true, createdAt: '2022-01-15T10:00:00Z', lastLogin: '2024-12-20T08:45:00Z', loginCount: 124 }
];

export const dummyTeachers: User[] = [
  { id: 'teacher_1', name: 'Dr. Anjali Verma', email: 'anjali.verma@dypsn.edu', phone: '+91 98765 43001', gender: 'Female', department: 'Computer Science', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Computer Science', specialization: 'Machine Learning', experience: '15 years', designation: 'Professor', createdAt: '2010-01-15T10:00:00Z', lastLogin: '2024-12-20T09:00:00Z', loginCount: 200 },
  { id: 'teacher_2', name: 'Prof. Ramesh Iyer', email: 'ramesh.iyer@dypsn.edu', phone: '+91 98765 43002', gender: 'Male', department: 'Computer Science', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'M.Tech in Software Engineering', specialization: 'Web Development', experience: '10 years', designation: 'Associate Professor', createdAt: '2015-01-15T10:00:00Z', lastLogin: '2024-12-20T08:30:00Z', loginCount: 180 },
  { id: 'teacher_3', name: 'Dr. Meera Nair', email: 'meera.nair@dypsn.edu', phone: '+91 98765 43003', gender: 'Female', department: 'Information Technology', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Information Technology', specialization: 'Data Science', experience: '12 years', designation: 'Professor', createdAt: '2012-01-15T10:00:00Z', lastLogin: '2024-12-20T10:15:00Z', loginCount: 195 },
  { id: 'teacher_4', name: 'Prof. Sanjay Deshmukh', email: 'sanjay.deshmukh@dypsn.edu', phone: '+91 98765 43004', gender: 'Male', department: 'Computer Science', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Computer Science', specialization: 'Artificial Intelligence', experience: '18 years', designation: 'Professor', createdAt: '2008-01-15T10:00:00Z', lastLogin: '2024-12-20T09:20:00Z', loginCount: 220 },
  { id: 'teacher_5', name: 'Dr. Kavita Joshi', email: 'kavita.joshi@dypsn.edu', phone: '+91 98765 43005', gender: 'Female', department: 'Computer Science', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Computer Science', specialization: 'Cybersecurity', experience: '14 years', designation: 'Associate Professor', createdAt: '2011-01-15T10:00:00Z', lastLogin: '2024-12-20T08:45:00Z', loginCount: 190 },
  { id: 'teacher_6', name: 'Prof. Vikram Sharma', email: 'vikram.sharma@dypsn.edu', phone: '+91 98765 43006', gender: 'Male', department: 'Information Technology', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'M.Tech in Information Technology', specialization: 'Cloud Computing', experience: '11 years', designation: 'Associate Professor', createdAt: '2014-01-15T10:00:00Z', lastLogin: '2024-12-20T10:00:00Z', loginCount: 175 },
  { id: 'teacher_7', name: 'Dr. Priya Menon', email: 'priya.menon@dypsn.edu', phone: '+91 98765 43007', gender: 'Female', department: 'Information Technology', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Information Technology', specialization: 'Big Data Analytics', experience: '13 years', designation: 'Professor', createdAt: '2012-06-15T10:00:00Z', lastLogin: '2024-12-20T09:30:00Z', loginCount: 185 },
  { id: 'teacher_8', name: 'Prof. Rajesh Kumar', email: 'rajesh.kumar@dypsn.edu', phone: '+91 98765 43008', gender: 'Male', department: 'Mechanical', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Mechanical Engineering', specialization: 'Thermodynamics', experience: '16 years', designation: 'Professor', createdAt: '2009-01-15T10:00:00Z', lastLogin: '2024-12-20T08:15:00Z', loginCount: 210 },
  { id: 'teacher_9', name: 'Dr. Sunita Patel', email: 'sunita.patel@dypsn.edu', phone: '+91 98765 43009', gender: 'Female', department: 'Mechanical', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Mechanical Engineering', specialization: 'Design Engineering', experience: '12 years', designation: 'Associate Professor', createdAt: '2013-01-15T10:00:00Z', lastLogin: '2024-12-20T09:45:00Z', loginCount: 170 },
  { id: 'teacher_10', name: 'Prof. Amit Verma', email: 'amit.verma@dypsn.edu', phone: '+91 98765 43010', gender: 'Male', department: 'Electronics', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Electronics Engineering', specialization: 'Embedded Systems', experience: '15 years', designation: 'Professor', createdAt: '2010-03-15T10:00:00Z', lastLogin: '2024-12-20T10:10:00Z', loginCount: 205 },
  { id: 'teacher_11', name: 'Dr. Neha Gupta', email: 'neha.gupta@dypsn.edu', phone: '+91 98765 43011', gender: 'Female', department: 'Electronics', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Electronics Engineering', specialization: 'VLSI Design', experience: '13 years', designation: 'Associate Professor', createdAt: '2012-08-15T10:00:00Z', lastLogin: '2024-12-20T08:50:00Z', loginCount: 180 },
  { id: 'teacher_12', name: 'Prof. Manoj Singh', email: 'manoj.singh@dypsn.edu', phone: '+91 98765 43012', gender: 'Male', department: 'Civil', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Civil Engineering', specialization: 'Structural Engineering', experience: '17 years', designation: 'Professor', createdAt: '2008-07-15T10:00:00Z', lastLogin: '2024-12-20T09:15:00Z', loginCount: 225 },
  { id: 'teacher_13', name: 'Dr. Anjali Desai', email: 'anjali.desai@dypsn.edu', phone: '+91 98765 43013', gender: 'Female', department: 'Civil', role: 'teacher', accessLevel: 'approver', isActive: true, qualification: 'Ph.D. in Civil Engineering', specialization: 'Environmental Engineering', experience: '14 years', designation: 'Associate Professor', createdAt: '2011-05-15T10:00:00Z', lastLogin: '2024-12-20T10:25:00Z', loginCount: 195 }
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
    workShift: 'full-day',
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
    workShift: 'full-day',
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
    workShift: 'full-day',
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
    workShift: 'full-day',
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
  { id: 'leave_1', userId: 'teacher_1', userName: 'Dr. Anjali Verma', department: 'Computer Science', leaveType: 'CL', fromDate: '2024-12-25', toDate: '2024-12-27', reason: 'Personal work', status: 'pending', submittedAt: '2024-12-20T10:00:00Z', daysCount: 3, currentApprovalLevel: 'hod' },
  { id: 'leave_2', userId: 'student_1', userName: 'Rajesh Kumar', department: 'Computer Science', leaveType: 'SL', fromDate: '2024-12-23', toDate: '2024-12-23', reason: 'Medical appointment', status: 'approved', submittedAt: '2024-12-19T09:00:00Z', approvedBy: 'teacher_1', approvedAt: '2024-12-19T14:00:00Z', daysCount: 1 },
  { id: 'leave_3', userId: 'teacher_2', userName: 'Prof. Ramesh Iyer', department: 'Computer Science', leaveType: 'EL', fromDate: '2024-12-28', toDate: '2024-12-30', reason: 'Family function', status: 'pending', submittedAt: '2024-12-20T11:00:00Z', daysCount: 3, currentApprovalLevel: 'hod' },
  { id: 'leave_4', userId: 'student_2', userName: 'Priya Sharma', department: 'Computer Science', leaveType: 'CL', fromDate: '2024-12-24', toDate: '2024-12-24', reason: 'Family event', status: 'approved', submittedAt: '2024-12-20T08:00:00Z', approvedBy: 'teacher_1', approvedAt: '2024-12-20T10:00:00Z', daysCount: 1 },
  { id: 'leave_5', userId: 'student_3', userName: 'Amit Patel', department: 'Computer Science', leaveType: 'SL', fromDate: '2024-12-26', toDate: '2024-12-26', reason: 'Fever', status: 'pending', submittedAt: '2024-12-20T12:00:00Z', daysCount: 1, currentApprovalLevel: 'teacher' },
  { id: 'leave_6', userId: 'teacher_3', userName: 'Dr. Meera Nair', department: 'Information Technology', leaveType: 'ML', fromDate: '2025-01-05', toDate: '2025-01-07', reason: 'Medical leave', status: 'pending', submittedAt: '2024-12-20T09:00:00Z', daysCount: 3, currentApprovalLevel: 'hod' },
  { id: 'leave_7', userId: 'student_4', userName: 'Sneha Desai', department: 'Information Technology', leaveType: 'CL', fromDate: '2024-12-29', toDate: '2024-12-29', reason: 'Personal work', status: 'approved', submittedAt: '2024-12-19T11:00:00Z', approvedBy: 'teacher_3', approvedAt: '2024-12-19T15:00:00Z', daysCount: 1 },
  { id: 'leave_8', userId: 'student_6', userName: 'Arjun Mehta', department: 'Computer Science', leaveType: 'EL', fromDate: '2025-01-10', toDate: '2025-01-12', reason: 'Wedding', status: 'pending', submittedAt: '2024-12-20T13:00:00Z', daysCount: 3, currentApprovalLevel: 'teacher' },
  { id: 'leave_9', userId: 'teacher_4', userName: 'Prof. Sanjay Deshmukh', department: 'Computer Science', leaveType: 'CL', fromDate: '2024-12-31', toDate: '2025-01-01', reason: 'New Year vacation', status: 'pending', submittedAt: '2024-12-20T14:00:00Z', daysCount: 2, currentApprovalLevel: 'hod' },
  { id: 'leave_10', userId: 'student_10', userName: 'Siddharth Nair', department: 'Computer Science', leaveType: 'SL', fromDate: '2024-12-27', toDate: '2024-12-27', reason: 'Doctor appointment', status: 'approved', submittedAt: '2024-12-20T07:00:00Z', approvedBy: 'teacher_2', approvedAt: '2024-12-20T09:00:00Z', daysCount: 1 },
  { id: 'leave_11', userId: 'student_15', userName: 'Rahul Verma', department: 'Information Technology', leaveType: 'CL', fromDate: '2025-01-08', toDate: '2025-01-08', reason: 'Personal', status: 'pending', submittedAt: '2024-12-20T15:00:00Z', daysCount: 1, currentApprovalLevel: 'teacher' },
  { id: 'leave_12', userId: 'teacher_5', userName: 'Dr. Kavita Joshi', department: 'Computer Science', leaveType: 'ML', fromDate: '2025-01-15', toDate: '2025-01-17', reason: 'Medical treatment', status: 'pending', submittedAt: '2024-12-20T16:00:00Z', daysCount: 3, currentApprovalLevel: 'hod' },
  { id: 'leave_13', userId: 'student_18', userName: 'Shreya Bhatt', department: 'Information Technology', leaveType: 'EL', fromDate: '2024-12-30', toDate: '2024-12-30', reason: 'Family function', status: 'approved', submittedAt: '2024-12-19T10:00:00Z', approvedBy: 'teacher_3', approvedAt: '2024-12-19T16:00:00Z', daysCount: 1 },
  { id: 'leave_14', userId: 'student_20', userName: 'Ravi Kumar', department: 'Mechanical', leaveType: 'SL', fromDate: '2025-01-03', toDate: '2025-01-03', reason: 'Medical', status: 'pending', submittedAt: '2024-12-20T17:00:00Z', daysCount: 1, currentApprovalLevel: 'teacher' },
  { id: 'leave_15', userId: 'teacher_8', userName: 'Prof. Rajesh Kumar', department: 'Mechanical', leaveType: 'CL', fromDate: '2025-01-20', toDate: '2025-01-22', reason: 'Conference', status: 'pending', submittedAt: '2024-12-20T18:00:00Z', daysCount: 3, currentApprovalLevel: 'hod' }
];

// ==================== DUMMY ATTENDANCE ====================
// Helper function to generate attendance for last 5 days (today + 4 previous days)
// This function will be called after dummySubjects is defined
const generateAttendanceForLast5Days = (): AttendanceLog[] => {
  const attendanceLogs: AttendanceLog[] = [];
  const today = new Date();
  const dates: string[] = [];
  
  // Generate dates for last 5 days (today + 4 previous days) + next 30 days to cover any selected date
  // This ensures attendance data is available for a wide range of dates
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Add dates for the next 30 days to cover future date selections
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Remove duplicates
  const uniqueDates = [...new Set(dates)];
  
  // Get all dummy students
  const allStudents = dummyStudents;
  
  let attId = 1;
  
  // Generate attendance for each student for each date and ALL subjects
  for (const student of allStudents) {
    if (!student.rollNumber || !student.year || !student.sem || !student.div) continue;
    
    // Get ALL subjects for this student based on their year/sem
    const subjects = dummySubjects.filter(s => 
      s.year === student.year && 
      s.sem === student.sem && 
      (s.department === student.department || s.department === 'Computer Science')
    );
    
    if (subjects.length === 0) continue;
    
    // Generate attendance for EACH subject for each date
    for (const subject of subjects) {
      for (const date of uniqueDates) {
        // Random status with 70% present, 20% late, 10% absent
        const rand = Math.random();
        let status: 'present' | 'absent' | 'late' = 'present';
        if (rand < 0.1) status = 'absent';
        else if (rand < 0.3) status = 'late';
        
        attendanceLogs.push({
          id: `att_${attId++}`,
          userId: student.id,
          userName: student.name,
          date: date,
          status: status,
          subject: subject.subjectName,
          year: student.year,
          sem: student.sem,
          div: student.div,
          rollNumber: student.rollNumber
        } as AttendanceLog);
      }
    }
  }
  
  return attendanceLogs;
};

// Initialize attendance logs as empty array first, will be populated after dummySubjects is defined
export let dummyAttendanceLogs: AttendanceLog[] = [];

// ==================== DUMMY NOTIFICATIONS ====================
export const dummyNotifications: Notification[] = [
  { id: 'notif_1', userId: 'student_1', title: 'Leave Request Approved', message: 'Your leave request for Dec 23 has been approved', type: 'success', timestamp: '2024-12-19T14:00:00Z', read: false, category: 'leave', priority: 'medium' },
  { id: 'notif_2', userId: 'teacher_1', title: 'New Leave Request', message: 'Rajesh Kumar has submitted a leave request', type: 'info', timestamp: '2024-12-20T10:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_3', userId: 'student_1', title: 'Attendance Marked', message: 'Your attendance has been marked for Data Structures', type: 'info', timestamp: '2024-12-20T09:30:00Z', read: true, category: 'attendance', priority: 'low' },
  { id: 'notif_4', userId: 'admin_1', title: 'System Maintenance', message: 'Scheduled maintenance on Dec 25, 2024 from 2 AM to 4 AM', type: 'warning', timestamp: '2024-12-20T08:00:00Z', read: false, category: 'system', priority: 'high' },
  { id: 'notif_5', userId: 'student_2', title: 'Leave Request Approved', message: 'Your leave request for Dec 24 has been approved', type: 'success', timestamp: '2024-12-20T10:00:00Z', read: false, category: 'leave', priority: 'medium' },
  { id: 'notif_6', userId: 'teacher_1', title: 'New Leave Request', message: 'Amit Patel has submitted a leave request', type: 'info', timestamp: '2024-12-20T12:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_7', userId: 'student_3', title: 'Low Attendance Alert', message: 'Your attendance is below 75% in Database Management', type: 'warning', timestamp: '2024-12-20T11:00:00Z', read: false, category: 'attendance', priority: 'high' },
  { id: 'notif_8', userId: 'student_4', title: 'Leave Request Approved', message: 'Your leave request for Dec 29 has been approved', type: 'success', timestamp: '2024-12-19T15:00:00Z', read: true, category: 'leave', priority: 'medium' },
  { id: 'notif_9', userId: 'teacher_2', title: 'New Leave Request', message: 'Siddharth Nair has submitted a leave request', type: 'info', timestamp: '2024-12-20T07:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_10', userId: 'student_6', title: 'Event Registration Open', message: 'Tech Fest 2024 registration is now open. Register before Dec 25', type: 'info', timestamp: '2024-12-20T09:00:00Z', read: false, category: 'announcement', priority: 'medium' },
  { id: 'notif_11', userId: 'student_10', title: 'Leave Request Approved', message: 'Your leave request for Dec 27 has been approved', type: 'success', timestamp: '2024-12-20T09:00:00Z', read: false, category: 'leave', priority: 'medium' },
  { id: 'notif_12', userId: 'teacher_3', title: 'New Leave Request', message: 'Rahul Verma has submitted a leave request', type: 'info', timestamp: '2024-12-20T15:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_13', userId: 'student_13', title: 'Result Published', message: 'Your UT1 results for Data Structures have been published', type: 'success', timestamp: '2024-12-19T16:00:00Z', read: false, category: 'announcement', priority: 'medium' },
  { id: 'notif_14', userId: 'student_15', title: 'Attendance Marked', message: 'Your attendance has been marked for Web Development', type: 'info', timestamp: '2024-12-20T10:10:00Z', read: true, category: 'attendance', priority: 'low' },
  { id: 'notif_15', userId: 'admin_1', title: 'New Complaint', message: 'New complaint received: WiFi Connectivity Issue', type: 'info', timestamp: '2024-12-20T10:00:00Z', read: false, category: 'announcement', priority: 'high', actionRequired: true },
  { id: 'notif_16', userId: 'student_18', title: 'Leave Request Approved', message: 'Your leave request for Dec 30 has been approved', type: 'success', timestamp: '2024-12-19T16:00:00Z', read: true, category: 'leave', priority: 'medium' },
  { id: 'notif_17', userId: 'teacher_4', title: 'New Leave Request', message: 'Arjun Mehta has submitted a leave request', type: 'info', timestamp: '2024-12-20T13:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_18', userId: 'student_20', title: 'Club Meeting Reminder', message: 'Robotics Club meeting today at 5 PM', type: 'info', timestamp: '2024-12-20T08:00:00Z', read: false, category: 'announcement', priority: 'low' },
  { id: 'notif_19', userId: 'student_23', title: 'Attendance Marked', message: 'Your attendance has been marked for Embedded Systems', type: 'info', timestamp: '2024-12-20T09:25:00Z', read: true, category: 'attendance', priority: 'low' },
  { id: 'notif_20', userId: 'admin_2', title: 'Complaint Resolved', message: 'Complaint "Projector Not Working" has been resolved', type: 'success', timestamp: '2024-12-18T16:00:00Z', read: true, category: 'announcement', priority: 'medium' },
  { id: 'notif_21', userId: 'student_25', title: 'Low Attendance Alert', message: 'Your attendance is below 75% in VLSI Design', type: 'warning', timestamp: '2024-12-20T10:15:00Z', read: false, category: 'attendance', priority: 'high' },
  { id: 'notif_22', userId: 'student_28', title: 'Event Reminder', message: 'Sports Meet 2024 starts tomorrow at 8 AM', type: 'info', timestamp: '2024-12-21T18:00:00Z', read: false, category: 'announcement', priority: 'medium' },
  { id: 'notif_23', userId: 'teacher_5', title: 'New Leave Request', message: 'Shreya Bhatt has submitted a leave request', type: 'info', timestamp: '2024-12-20T16:00:00Z', read: false, category: 'leave', priority: 'high', actionRequired: true },
  { id: 'notif_24', userId: 'student_30', title: 'Welcome to College', message: 'Welcome to DYPSN! Check out upcoming events and clubs', type: 'info', timestamp: '2024-07-15T10:00:00Z', read: true, category: 'system', priority: 'low' }
];

// ==================== DUMMY SUBJECTS ====================
export const dummySubjects: Subject[] = [
  // ========== COMPUTER SCIENCE - 1ST YEAR ==========
  { id: 'subj_cs101', subjectCode: 'CS101', subjectName: 'Programming Fundamentals', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Introduction to programming concepts and C language', isActive: true },
  { id: 'subj_cs102', subjectCode: 'CS102', subjectName: 'Programming Fundamentals Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Practical programming exercises', isActive: true },
  { id: 'subj_cs103', subjectCode: 'CS103', subjectName: 'Mathematics I', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Calculus and linear algebra', isActive: true },
  { id: 'subj_cs104', subjectCode: 'CS104', subjectName: 'Physics', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Engineering physics fundamentals', isActive: true },
  { id: 'subj_cs105', subjectCode: 'CS105', subjectName: 'Engineering Drawing', subjectType: 'Practical', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_5', teacherName: 'Dr. Kavita Joshi', teacherEmail: 'kavita.joshi@dypsn.edu', description: 'Technical drawing and CAD basics', isActive: true },
  { id: 'subj_cs106', subjectCode: 'CS106', subjectName: 'Data Structures', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Introduction to data structures and algorithms', isActive: true },
  { id: 'subj_cs107', subjectCode: 'CS107', subjectName: 'Data Structures Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Practical implementation of data structures', isActive: true },
  { id: 'subj_cs108', subjectCode: 'CS108', subjectName: 'Mathematics II', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Differential equations and probability', isActive: true },
  { id: 'subj_cs109', subjectCode: 'CS109', subjectName: 'Digital Electronics', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Digital logic and circuit design', isActive: true },
  
  // ========== COMPUTER SCIENCE - 2ND YEAR ==========
  { id: 'subj_cs201', subjectCode: 'CS201', subjectName: 'Object Oriented Programming', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'OOP concepts and Java programming', isActive: true },
  { id: 'subj_cs202', subjectCode: 'CS202', subjectName: 'Object Oriented Programming Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Java programming lab', isActive: true },
  { id: 'subj_cs203', subjectCode: 'CS203', subjectName: 'Data Structures', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Advanced data structures and algorithms', isActive: true },
  { id: 'subj_cs204', subjectCode: 'CS204', subjectName: 'Data Structures Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Data structures implementation', isActive: true },
  { id: 'subj_cs205', subjectCode: 'CS205', subjectName: 'Discrete Mathematics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Mathematical foundations for computer science', isActive: true },
  { id: 'subj_cs206', subjectCode: 'CS206', subjectName: 'Database Management Systems', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Database design and SQL', isActive: true },
  { id: 'subj_cs207', subjectCode: 'CS207', subjectName: 'Database Management Systems Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'SQL and database practical', isActive: true },
  { id: 'subj_cs208', subjectCode: 'CS208', subjectName: 'Computer Organization', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Computer architecture and organization', isActive: true },
  { id: 'subj_cs209', subjectCode: 'CS209', subjectName: 'Operating Systems', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'OS concepts and process management', isActive: true },
  { id: 'subj_cs210', subjectCode: 'CS210', subjectName: 'Operating Systems Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'OS programming and shell scripting', isActive: true },
  
  // ========== COMPUTER SCIENCE - 3RD YEAR ==========
  { id: 'subj_cs301', subjectCode: 'CS301', subjectName: 'Computer Networks', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Network protocols and architecture', isActive: true },
  { id: 'subj_cs302', subjectCode: 'CS302', subjectName: 'Computer Networks Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Network configuration and protocols', isActive: true },
  { id: 'subj_cs303', subjectCode: 'CS303', subjectName: 'Software Engineering', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Software development lifecycle and methodologies', isActive: true },
  { id: 'subj_cs304', subjectCode: 'CS304', subjectName: 'Web Technologies', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'HTML, CSS, JavaScript, and web frameworks', isActive: true },
  { id: 'subj_cs305', subjectCode: 'CS305', subjectName: 'Web Technologies Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Web development practical', isActive: true },
  { id: 'subj_cs306', subjectCode: 'CS306', subjectName: 'Compiler Design', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Compiler construction and optimization', isActive: true },
  { id: 'subj_cs307', subjectCode: 'CS307', subjectName: 'Artificial Intelligence', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'AI algorithms and applications', isActive: true },
  { id: 'subj_cs308', subjectCode: 'CS308', subjectName: 'Artificial Intelligence Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'AI programming and ML implementations', isActive: true },
  { id: 'subj_cs309', subjectCode: 'CS309', subjectName: 'Cryptography and Network Security', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_5', teacherName: 'Dr. Kavita Joshi', teacherEmail: 'kavita.joshi@dypsn.edu', description: 'Security protocols and encryption', isActive: true },
  { id: 'subj_cs310', subjectCode: 'CS310', subjectName: 'Project I', subjectType: 'Project', credits: 3, hoursPerWeek: 6, department: 'Computer Science', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Mini project implementation', isActive: true },
  
  // ========== COMPUTER SCIENCE - 4TH YEAR ==========
  { id: 'subj_cs401', subjectCode: 'CS401', subjectName: 'Machine Learning', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Computer Science', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'ML algorithms and applications', isActive: true },
  { id: 'subj_cs402', subjectCode: 'CS402', subjectName: 'Machine Learning Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Computer Science', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'ML model implementation', isActive: true },
  { id: 'subj_cs403', subjectCode: 'CS403', subjectName: 'Cybersecurity', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_5', teacherName: 'Dr. Kavita Joshi', teacherEmail: 'kavita.joshi@dypsn.edu', description: 'Information security and ethical hacking', isActive: true },
  { id: 'subj_cs404', subjectCode: 'CS404', subjectName: 'Cloud Computing', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_4', teacherName: 'Prof. Sanjay Deshmukh', teacherEmail: 'sanjay.deshmukh@dypsn.edu', description: 'Cloud platforms and services', isActive: true },
  { id: 'subj_cs405', subjectCode: 'CS405', subjectName: 'Big Data Analytics', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Computer Science', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_2', teacherName: 'Prof. Ramesh Iyer', teacherEmail: 'ramesh.iyer@dypsn.edu', description: 'Big data processing and analytics', isActive: true },
  { id: 'subj_cs406', subjectCode: 'CS406', subjectName: 'Project II', subjectType: 'Project', credits: 6, hoursPerWeek: 12, department: 'Computer Science', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Final year project', isActive: true },
  { id: 'subj_cs407', subjectCode: 'CS407', subjectName: 'Internship', subjectType: 'Project', credits: 4, hoursPerWeek: 40, department: 'Computer Science', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_1', teacherName: 'Dr. Anjali Verma', teacherEmail: 'anjali.verma@dypsn.edu', description: 'Industry internship', isActive: true },
  
  // ========== INFORMATION TECHNOLOGY - 1ST YEAR ==========
  { id: 'subj_it101', subjectCode: 'IT101', subjectName: 'Programming Fundamentals', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Introduction to programming concepts', isActive: true },
  { id: 'subj_it102', subjectCode: 'IT102', subjectName: 'Programming Fundamentals Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Information Technology', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Practical programming exercises', isActive: true },
  { id: 'subj_it103', subjectCode: 'IT103', subjectName: 'Mathematics I', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'Calculus and linear algebra', isActive: true },
  { id: 'subj_it104', subjectCode: 'IT104', subjectName: 'Web Development Basics', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Information Technology', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'HTML, CSS, and JavaScript basics', isActive: true },
  { id: 'subj_it105', subjectCode: 'IT105', subjectName: 'Web Development Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Information Technology', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Web development practical', isActive: true },
  
  // ========== INFORMATION TECHNOLOGY - 2ND YEAR ==========
  { id: 'subj_it201', subjectCode: 'IT201', subjectName: 'Web Development', subjectType: 'Practical', credits: 3, hoursPerWeek: 3, department: 'Information Technology', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Modern web development technologies', isActive: true },
  { id: 'subj_it202', subjectCode: 'IT202', subjectName: 'Database Management Systems', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'Database design and SQL', isActive: true },
  { id: 'subj_it203', subjectCode: 'IT203', subjectName: 'Data Structures', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_7', teacherName: 'Dr. Priya Menon', teacherEmail: 'priya.menon@dypsn.edu', description: 'Data structures and algorithms', isActive: true },
  { id: 'subj_it204', subjectCode: 'IT204', subjectName: 'Object Oriented Programming', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'OOP concepts and Java', isActive: true },
  
  // ========== INFORMATION TECHNOLOGY - 3RD YEAR ==========
  { id: 'subj_it301', subjectCode: 'IT301', subjectName: 'Cloud Computing', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'Cloud platforms and services', isActive: true },
  { id: 'subj_it302', subjectCode: 'IT302', subjectName: 'Big Data Analytics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_7', teacherName: 'Dr. Priya Menon', teacherEmail: 'priya.menon@dypsn.edu', description: 'Big data processing and analytics', isActive: true },
  { id: 'subj_it303', subjectCode: 'IT303', subjectName: 'Mobile Application Development', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Information Technology', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Android and iOS app development', isActive: true },
  { id: 'subj_it304', subjectCode: 'IT304', subjectName: 'Internet of Things', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Information Technology', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'IoT concepts and applications', isActive: true },
  
  // ========== INFORMATION TECHNOLOGY - 4TH YEAR ==========
  { id: 'subj_it401', subjectCode: 'IT401', subjectName: 'Data Science', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Information Technology', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_7', teacherName: 'Dr. Priya Menon', teacherEmail: 'priya.menon@dypsn.edu', description: 'Data science and analytics', isActive: true },
  { id: 'subj_it402', subjectCode: 'IT402', subjectName: 'DevOps', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Information Technology', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_6', teacherName: 'Prof. Vikram Sharma', teacherEmail: 'vikram.sharma@dypsn.edu', description: 'DevOps practices and tools', isActive: true },
  { id: 'subj_it403', subjectCode: 'IT403', subjectName: 'Project II', subjectType: 'Project', credits: 6, hoursPerWeek: 12, department: 'Information Technology', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_3', teacherName: 'Dr. Meera Nair', teacherEmail: 'meera.nair@dypsn.edu', description: 'Final year project', isActive: true },
  
  // ========== MECHANICAL ENGINEERING - 1ST YEAR ==========
  { id: 'subj_me101', subjectCode: 'ME101', subjectName: 'Engineering Mathematics I', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Mechanical', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_8', teacherName: 'Prof. Rajesh Kumar', teacherEmail: 'rajesh.kumar@dypsn.edu', description: 'Calculus and differential equations', isActive: true },
  { id: 'subj_me102', subjectCode: 'ME102', subjectName: 'Engineering Physics', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Mechanical', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_9', teacherName: 'Dr. Sunita Patel', teacherEmail: 'sunita.patel@dypsn.edu', description: 'Physics fundamentals', isActive: true },
  { id: 'subj_me103', subjectCode: 'ME103', subjectName: 'Engineering Drawing', subjectType: 'Practical', credits: 2, hoursPerWeek: 2, department: 'Mechanical', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_8', teacherName: 'Prof. Rajesh Kumar', teacherEmail: 'rajesh.kumar@dypsn.edu', description: 'Technical drawing', isActive: true },
  { id: 'subj_me104', subjectCode: 'ME104', subjectName: 'Workshop Practice', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Mechanical', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_9', teacherName: 'Dr. Sunita Patel', teacherEmail: 'sunita.patel@dypsn.edu', description: 'Workshop skills', isActive: true },
  
  // ========== MECHANICAL ENGINEERING - 2ND YEAR ==========
  { id: 'subj_me201', subjectCode: 'ME201', subjectName: 'Thermodynamics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Mechanical', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_8', teacherName: 'Prof. Rajesh Kumar', teacherEmail: 'rajesh.kumar@dypsn.edu', description: 'Thermodynamic principles and applications', isActive: true },
  { id: 'subj_me202', subjectCode: 'ME202', subjectName: 'Fluid Mechanics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Mechanical', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_9', teacherName: 'Dr. Sunita Patel', teacherEmail: 'sunita.patel@dypsn.edu', description: 'Fluid dynamics and applications', isActive: true },
  
  // ========== MECHANICAL ENGINEERING - 3RD YEAR ==========
  { id: 'subj_me301', subjectCode: 'ME301', subjectName: 'Design Engineering', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Mechanical', year: '3rd', sem: '5', div: 'B', batch: '2023', teacherId: 'teacher_9', teacherName: 'Dr. Sunita Patel', teacherEmail: 'sunita.patel@dypsn.edu', description: 'Engineering design principles', isActive: true },
  { id: 'subj_me302', subjectCode: 'ME302', subjectName: 'Heat Transfer', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Mechanical', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_8', teacherName: 'Prof. Rajesh Kumar', teacherEmail: 'rajesh.kumar@dypsn.edu', description: 'Heat transfer mechanisms', isActive: true },
  
  // ========== MECHANICAL ENGINEERING - 4TH YEAR ==========
  { id: 'subj_me401', subjectCode: 'ME401', subjectName: 'Automotive Engineering', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Mechanical', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_8', teacherName: 'Prof. Rajesh Kumar', teacherEmail: 'rajesh.kumar@dypsn.edu', description: 'Automotive systems and design', isActive: true },
  { id: 'subj_me402', subjectCode: 'ME402', subjectName: 'Project II', subjectType: 'Project', credits: 6, hoursPerWeek: 12, department: 'Mechanical', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_9', teacherName: 'Dr. Sunita Patel', teacherEmail: 'sunita.patel@dypsn.edu', description: 'Final year project', isActive: true },
  
  // ========== ELECTRONICS ENGINEERING - 1ST YEAR ==========
  { id: 'subj_ee101', subjectCode: 'EE101', subjectName: 'Basic Electronics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Electronics', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_10', teacherName: 'Prof. Amit Verma', teacherEmail: 'amit.verma@dypsn.edu', description: 'Electronic components and circuits', isActive: true },
  { id: 'subj_ee102', subjectCode: 'EE102', subjectName: 'Basic Electronics Lab', subjectType: 'Lab', credits: 2, hoursPerWeek: 2, department: 'Electronics', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_10', teacherName: 'Prof. Amit Verma', teacherEmail: 'amit.verma@dypsn.edu', description: 'Electronic circuits practical', isActive: true },
  
  // ========== ELECTRONICS ENGINEERING - 2ND YEAR ==========
  { id: 'subj_ee201', subjectCode: 'EE201', subjectName: 'Embedded Systems', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Electronics', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_10', teacherName: 'Prof. Amit Verma', teacherEmail: 'amit.verma@dypsn.edu', description: 'Microcontrollers and embedded programming', isActive: true },
  { id: 'subj_ee202', subjectCode: 'EE202', subjectName: 'Digital Signal Processing', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Electronics', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_11', teacherName: 'Dr. Neha Gupta', teacherEmail: 'neha.gupta@dypsn.edu', description: 'DSP algorithms and applications', isActive: true },
  
  // ========== ELECTRONICS ENGINEERING - 3RD YEAR ==========
  { id: 'subj_ee301', subjectCode: 'EE301', subjectName: 'VLSI Design', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Electronics', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_11', teacherName: 'Dr. Neha Gupta', teacherEmail: 'neha.gupta@dypsn.edu', description: 'VLSI circuit design and fabrication', isActive: true },
  { id: 'subj_ee302', subjectCode: 'EE302', subjectName: 'Power Electronics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Electronics', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_10', teacherName: 'Prof. Amit Verma', teacherEmail: 'amit.verma@dypsn.edu', description: 'Power electronic systems', isActive: true },
  
  // ========== ELECTRONICS ENGINEERING - 4TH YEAR ==========
  { id: 'subj_ee401', subjectCode: 'EE401', subjectName: 'Advanced VLSI', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Electronics', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_11', teacherName: 'Dr. Neha Gupta', teacherEmail: 'neha.gupta@dypsn.edu', description: 'Advanced VLSI design techniques', isActive: true },
  { id: 'subj_ee402', subjectCode: 'EE402', subjectName: 'Project II', subjectType: 'Project', credits: 6, hoursPerWeek: 12, department: 'Electronics', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_10', teacherName: 'Prof. Amit Verma', teacherEmail: 'amit.verma@dypsn.edu', description: 'Final year project', isActive: true },
  
  // ========== CIVIL ENGINEERING - 1ST YEAR ==========
  { id: 'subj_ce101', subjectCode: 'CE101', subjectName: 'Engineering Mathematics I', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '1st', sem: '1', div: 'A', batch: '2025', teacherId: 'teacher_12', teacherName: 'Prof. Manoj Singh', teacherEmail: 'manoj.singh@dypsn.edu', description: 'Calculus and algebra', isActive: true },
  { id: 'subj_ce102', subjectCode: 'CE102', subjectName: 'Engineering Mechanics', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '1st', sem: '2', div: 'A', batch: '2025', teacherId: 'teacher_12', teacherName: 'Prof. Manoj Singh', teacherEmail: 'manoj.singh@dypsn.edu', description: 'Statics and dynamics', isActive: true },
  
  // ========== CIVIL ENGINEERING - 2ND YEAR ==========
  { id: 'subj_ce201', subjectCode: 'CE201', subjectName: 'Structural Engineering', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '2nd', sem: '3', div: 'A', batch: '2024', teacherId: 'teacher_12', teacherName: 'Prof. Manoj Singh', teacherEmail: 'manoj.singh@dypsn.edu', description: 'Structural analysis and design', isActive: true },
  { id: 'subj_ce202', subjectCode: 'CE202', subjectName: 'Concrete Technology', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '2nd', sem: '4', div: 'A', batch: '2024', teacherId: 'teacher_13', teacherName: 'Dr. Anjali Desai', teacherEmail: 'anjali.desai@dypsn.edu', description: 'Concrete materials and properties', isActive: true },
  
  // ========== CIVIL ENGINEERING - 3RD YEAR ==========
  { id: 'subj_ce301', subjectCode: 'CE301', subjectName: 'Environmental Engineering', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '3rd', sem: '5', div: 'A', batch: '2023', teacherId: 'teacher_13', teacherName: 'Dr. Anjali Desai', teacherEmail: 'anjali.desai@dypsn.edu', description: 'Environmental protection and sustainability', isActive: true },
  { id: 'subj_ce302', subjectCode: 'CE302', subjectName: 'Transportation Engineering', subjectType: 'Theory', credits: 4, hoursPerWeek: 4, department: 'Civil', year: '3rd', sem: '6', div: 'A', batch: '2023', teacherId: 'teacher_12', teacherName: 'Prof. Manoj Singh', teacherEmail: 'manoj.singh@dypsn.edu', description: 'Highway and traffic engineering', isActive: true },
  
  // ========== CIVIL ENGINEERING - 4TH YEAR ==========
  { id: 'subj_ce401', subjectCode: 'CE401', subjectName: 'Advanced Structural Design', subjectType: 'Theory', credits: 3, hoursPerWeek: 3, department: 'Civil', year: '4th', sem: '7', div: 'A', batch: '2022', teacherId: 'teacher_12', teacherName: 'Prof. Manoj Singh', teacherEmail: 'manoj.singh@dypsn.edu', description: 'Advanced structural analysis', isActive: true },
  { id: 'subj_ce402', subjectCode: 'CE402', subjectName: 'Project II', subjectType: 'Project', credits: 6, hoursPerWeek: 12, department: 'Civil', year: '4th', sem: '8', div: 'A', batch: '2022', teacherId: 'teacher_13', teacherName: 'Dr. Anjali Desai', teacherEmail: 'anjali.desai@dypsn.edu', description: 'Final year project', isActive: true }
];

// Generate comprehensive attendance data (must be after dummySubjects is defined)
dummyAttendanceLogs = generateAttendanceForLast5Days();

// ==================== DUMMY RESULTS ====================
export const dummyResults: ResultRecord[] = [
  { id: 'result_1', userId: 'student_1', userName: 'Rajesh Kumar', rollNumber: 'CS2024001', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'UT1', marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A' },
  { id: 'result_2', userId: 'student_1', userName: 'Rajesh Kumar', rollNumber: 'CS2024001', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'Practical', marksObtained: 90, maxMarks: 100, percentage: 90, grade: 'A+' },
  { id: 'result_3', userId: 'student_2', userName: 'Priya Sharma', rollNumber: 'CS2024002', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'UT1', marksObtained: 92, maxMarks: 100, percentage: 92, grade: 'A+' },
  { id: 'result_4', userId: 'student_2', userName: 'Priya Sharma', rollNumber: 'CS2024002', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'Practical', marksObtained: 95, maxMarks: 100, percentage: 95, grade: 'A+' },
  { id: 'result_5', userId: 'student_3', userName: 'Amit Patel', rollNumber: 'CS2023001', batch: '2023', department: 'Computer Science', year: '3rd', sem: '5', div: 'A', subject: 'Database Management', examType: 'UT1', marksObtained: 78, maxMarks: 100, percentage: 78, grade: 'B+' },
  { id: 'result_6', userId: 'student_3', userName: 'Amit Patel', rollNumber: 'CS2023001', batch: '2023', department: 'Computer Science', year: '3rd', sem: '5', div: 'A', subject: 'Database Management', examType: 'Practical', marksObtained: 82, maxMarks: 100, percentage: 82, grade: 'A' },
  { id: 'result_7', userId: 'student_4', userName: 'Sneha Desai', rollNumber: 'IT2024001', batch: '2024', department: 'Information Technology', year: '2nd', sem: '3', div: 'A', subject: 'Web Development', examType: 'UT1', marksObtained: 88, maxMarks: 100, percentage: 88, grade: 'A+' },
  { id: 'result_8', userId: 'student_4', userName: 'Sneha Desai', rollNumber: 'IT2024001', batch: '2024', department: 'Information Technology', year: '2nd', sem: '3', div: 'A', subject: 'Web Development', examType: 'Practical', marksObtained: 91, maxMarks: 100, percentage: 91, grade: 'A+' },
  { id: 'result_9', userId: 'student_6', userName: 'Arjun Mehta', rollNumber: 'CS2024003', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'UT1', marksObtained: 80, maxMarks: 100, percentage: 80, grade: 'A' },
  { id: 'result_10', userId: 'student_7', userName: 'Kavya Reddy', rollNumber: 'CS2024004', batch: '2024', department: 'Computer Science', year: '2nd', sem: '3', div: 'A', subject: 'Data Structures', examType: 'UT1', marksObtained: 89, maxMarks: 100, percentage: 89, grade: 'A+' },
  { id: 'result_11', userId: 'student_10', userName: 'Siddharth Nair', rollNumber: 'CS2023002', batch: '2023', department: 'Computer Science', year: '3rd', sem: '5', div: 'A', subject: 'Database Management', examType: 'UT1', marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A' },
  { id: 'result_12', userId: 'student_15', userName: 'Rahul Verma', rollNumber: 'IT2024002', batch: '2024', department: 'Information Technology', year: '2nd', sem: '3', div: 'A', subject: 'Web Development', examType: 'UT1', marksObtained: 83, maxMarks: 100, percentage: 83, grade: 'A' },
  { id: 'result_13', userId: 'student_18', userName: 'Shreya Bhatt', rollNumber: 'IT2023001', batch: '2023', department: 'Information Technology', year: '3rd', sem: '5', div: 'A', subject: 'Cloud Computing', examType: 'UT1', marksObtained: 87, maxMarks: 100, percentage: 87, grade: 'A+' },
  { id: 'result_14', userId: 'student_20', userName: 'Ravi Kumar', rollNumber: 'ME2024002', batch: '2024', department: 'Mechanical', year: '2nd', sem: '3', div: 'A', subject: 'Thermodynamics', examType: 'UT1', marksObtained: 76, maxMarks: 100, percentage: 76, grade: 'B+' },
  { id: 'result_15', userId: 'student_23', userName: 'Anjali Thakur', rollNumber: 'EE2024001', batch: '2024', department: 'Electronics', year: '2nd', sem: '3', div: 'A', subject: 'Embedded Systems', examType: 'UT1', marksObtained: 84, maxMarks: 100, percentage: 84, grade: 'A' },
  { id: 'result_16', userId: 'student_25', userName: 'Isha Kapoor', rollNumber: 'EE2023001', batch: '2023', department: 'Electronics', year: '3rd', sem: '5', div: 'A', subject: 'VLSI Design', examType: 'UT1', marksObtained: 79, maxMarks: 100, percentage: 79, grade: 'B+' },
  { id: 'result_17', userId: 'student_26', userName: 'Kunal Jain', rollNumber: 'CE2024001', batch: '2024', department: 'Civil', year: '2nd', sem: '3', div: 'A', subject: 'Structural Engineering', examType: 'UT1', marksObtained: 81, maxMarks: 100, percentage: 81, grade: 'A' },
  { id: 'result_18', userId: 'student_28', userName: 'Nikhil Bansal', rollNumber: 'CE2023001', batch: '2023', department: 'Civil', year: '3rd', sem: '5', div: 'A', subject: 'Environmental Engineering', examType: 'UT1', marksObtained: 86, maxMarks: 100, percentage: 86, grade: 'A+' }
];

// ==================== DUMMY COMPLAINTS ====================
export const dummyComplaints: Complaint[] = [
  { id: 'complaint_1', title: 'WiFi Connectivity Issue', description: 'WiFi is not working in the library area. Please fix this issue.', category: 'Infrastructure', priority: 'High', status: 'Open', complainantName: 'Rajesh Kumar', complainantEmail: 'rajesh.kumar@dypsn.edu', complainantPhone: '+91 98765 43210', complainantRole: 'Student', department: 'Computer Science', submittedDate: '2024-12-19T10:00:00Z', lastUpdated: '2024-12-19T10:00:00Z', anonymous: false },
  { id: 'complaint_2', title: 'Canteen Food Quality', description: 'Food quality in canteen has deteriorated. Requesting improvement.', category: 'Canteen', priority: 'Medium', status: 'In Progress', complainantName: 'Priya Sharma', complainantEmail: 'priya.sharma@dypsn.edu', complainantPhone: '+91 98765 43211', complainantRole: 'Student', department: 'Computer Science', assignedTo: 'admin_1', assignedToEmail: 'suresh.kumar@dypsn.edu', submittedDate: '2024-12-18T14:00:00Z', lastUpdated: '2024-12-19T15:00:00Z', anonymous: false },
  { id: 'complaint_3', title: 'Projector Not Working', description: 'Projector in Lab 3 is not functioning properly.', category: 'Infrastructure', priority: 'High', status: 'Resolved', complainantName: 'Dr. Anjali Verma', complainantEmail: 'anjali.verma@dypsn.edu', complainantPhone: '+91 98765 43001', complainantRole: 'Teacher', department: 'Computer Science', assignedTo: 'admin_2', assignedToEmail: 'kavita.shah@dypsn.edu', submittedDate: '2024-12-17T09:00:00Z', lastUpdated: '2024-12-18T16:00:00Z', resolution: 'Projector has been repaired and is now working properly.', anonymous: false },
  { id: 'complaint_4', title: 'AC Not Working in Classroom', description: 'Air conditioner in Room 205 is not working. It\'s very hot during classes.', category: 'Infrastructure', priority: 'High', status: 'Open', complainantName: 'Amit Patel', complainantEmail: 'amit.patel@dypsn.edu', complainantPhone: '+91 98765 43212', complainantRole: 'Student', department: 'Computer Science', submittedDate: '2024-12-20T11:00:00Z', lastUpdated: '2024-12-20T11:00:00Z', anonymous: false },
  { id: 'complaint_5', title: 'Library Books Missing', description: 'Several reference books are missing from the library. Need to restock.', category: 'Library', priority: 'Medium', status: 'In Progress', complainantName: 'Sneha Desai', complainantEmail: 'sneha.desai@dypsn.edu', complainantPhone: '+91 98765 43213', complainantRole: 'Student', department: 'Information Technology', assignedTo: 'admin_1', assignedToEmail: 'suresh.kumar@dypsn.edu', submittedDate: '2024-12-19T09:00:00Z', lastUpdated: '2024-12-20T10:00:00Z', anonymous: false },
  { id: 'complaint_6', title: 'Water Cooler Not Working', description: 'Water cooler near Lab 2 is not dispensing water. Please repair.', category: 'Infrastructure', priority: 'Medium', status: 'Open', complainantName: 'Arjun Mehta', complainantEmail: 'arjun.mehta@dypsn.edu', complainantPhone: '+91 98765 43215', complainantRole: 'Student', department: 'Computer Science', submittedDate: '2024-12-20T14:00:00Z', lastUpdated: '2024-12-20T14:00:00Z', anonymous: false },
  { id: 'complaint_7', title: 'Canteen Prices Too High', description: 'Canteen prices have increased significantly. Requesting price review.', category: 'Canteen', priority: 'Low', status: 'In Progress', complainantName: 'Kavya Reddy', complainantEmail: 'kavya.reddy@dypsn.edu', complainantPhone: '+91 98765 43216', complainantRole: 'Student', department: 'Computer Science', assignedTo: 'admin_2', assignedToEmail: 'kavita.shah@dypsn.edu', submittedDate: '2024-12-18T12:00:00Z', lastUpdated: '2024-12-19T13:00:00Z', anonymous: false },
  { id: 'complaint_8', title: 'Lab Computers Slow', description: 'Computers in CS Lab are very slow and need upgrade or maintenance.', category: 'Infrastructure', priority: 'High', status: 'Open', complainantName: 'Prof. Ramesh Iyer', complainantEmail: 'ramesh.iyer@dypsn.edu', complainantPhone: '+91 98765 43002', complainantRole: 'Teacher', department: 'Computer Science', submittedDate: '2024-12-19T15:00:00Z', lastUpdated: '2024-12-19T15:00:00Z', anonymous: false },
  { id: 'complaint_9', title: 'Parking Space Issue', description: 'Not enough parking space for students. Need more parking area.', category: 'Infrastructure', priority: 'Medium', status: 'Open', complainantName: 'Rohit Joshi', complainantEmail: 'rohit.joshi@dypsn.edu', complainantPhone: '+91 98765 43217', complainantRole: 'Student', department: 'Computer Science', submittedDate: '2024-12-20T08:00:00Z', lastUpdated: '2024-12-20T08:00:00Z', anonymous: false },
  { id: 'complaint_10', title: 'Washroom Cleanliness', description: 'Washrooms in Building A need better maintenance and cleaning.', category: 'Infrastructure', priority: 'Medium', status: 'Resolved', complainantName: 'Ananya Iyer', complainantEmail: 'ananya.iyer@dypsn.edu', complainantPhone: '+91 98765 43218', complainantRole: 'Student', department: 'Computer Science', assignedTo: 'admin_1', assignedToEmail: 'suresh.kumar@dypsn.edu', submittedDate: '2024-12-17T10:00:00Z', lastUpdated: '2024-12-18T14:00:00Z', resolution: 'Cleaning schedule has been improved and additional staff assigned.', anonymous: false },
  { id: 'complaint_11', title: 'Bus Service Delays', description: 'College bus service is frequently delayed. Need better scheduling.', category: 'Other', priority: 'High', status: 'In Progress', complainantName: 'Siddharth Nair', complainantEmail: 'siddharth.nair@dypsn.edu', complainantPhone: '+91 98765 43219', complainantRole: 'Student', department: 'Computer Science', assignedTo: 'admin_2', assignedToEmail: 'kavita.shah@dypsn.edu', submittedDate: '2024-12-19T11:00:00Z', lastUpdated: '2024-12-20T09:00:00Z', anonymous: false },
  { id: 'complaint_12', title: 'Hostel WiFi Issues', description: 'WiFi in hostel is very slow and keeps disconnecting.', category: 'Infrastructure', priority: 'High', status: 'Open', complainantName: 'Divya Menon', complainantEmail: 'divya.menon@dypsn.edu', complainantPhone: '+91 98765 43220', complainantRole: 'Student', department: 'Computer Science', submittedDate: '2024-12-20T12:00:00Z', lastUpdated: '2024-12-20T12:00:00Z', anonymous: false },
  { id: 'complaint_13', title: 'Canteen Hygiene', description: 'Canteen needs better hygiene standards. Found some cleanliness issues.', category: 'Canteen', priority: 'High', status: 'In Progress', complainantName: 'Karan Deshmukh', complainantEmail: 'karan.deshmukh@dypsn.edu', complainantPhone: '+91 98765 43221', complainantRole: 'Student', department: 'Computer Science', assignedTo: 'admin_1', assignedToEmail: 'suresh.kumar@dypsn.edu', submittedDate: '2024-12-19T13:00:00Z', lastUpdated: '2024-12-20T11:00:00Z', anonymous: false },
  { id: 'complaint_14', title: 'Lab Equipment Maintenance', description: 'Some equipment in Electronics Lab needs maintenance and calibration.', category: 'Infrastructure', priority: 'Medium', status: 'Open', complainantName: 'Prof. Amit Verma', complainantEmail: 'amit.verma@dypsn.edu', complainantPhone: '+91 98765 43010', complainantRole: 'Teacher', department: 'Electronics', submittedDate: '2024-12-20T09:00:00Z', lastUpdated: '2024-12-20T09:00:00Z', anonymous: false },
  { id: 'complaint_15', title: 'Sports Equipment', description: 'Need new sports equipment for basketball and football.', category: 'Sports', priority: 'Low', status: 'Open', complainantName: 'Ravi Kumar', complainantEmail: 'ravi.kumar@dypsn.edu', complainantPhone: '+91 98765 43229', complainantRole: 'Student', department: 'Mechanical', submittedDate: '2024-12-19T16:00:00Z', lastUpdated: '2024-12-19T16:00:00Z', anonymous: false }
];

// ==================== DUMMY EVENTS ====================
export const dummyEvents: Event[] = [
  {
    id: 'event_1',
    title: 'Tech Fest 2024',
    description: 'Annual technical festival with coding competitions, workshops, tech talks, and hackathons. Featuring industry experts and hands-on sessions.',
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
    description: 'Annual cultural day with performances, food stalls, cultural activities, and talent shows. A day full of fun and entertainment.',
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
    description: 'Inter-department sports competition including cricket, football, basketball, athletics, and more. Show your sportsmanship!',
    date: '2024-12-22',
    time: '08:00',
    location: 'Sports Complex',
    organizer: 'Sports Committee',
    category: 'Sports',
    maxParticipants: 300,
    currentParticipants: 280,
    status: 'ongoing',
    registrationRequired: true,
    registrationDeadline: '2024-12-20',
    contactEmail: 'sports@dypsn.edu',
    contactPhone: '+91 98765 40002'
  },
  {
    id: 'event_4',
    title: 'Hackathon 2024',
    description: '48-hour coding marathon to build innovative solutions. Prizes worth ₹1,00,000. Food and refreshments provided.',
    date: '2025-01-10',
    time: '09:00',
    location: 'Computer Lab',
    organizer: 'Coding Club',
    category: 'Technical',
    maxParticipants: 100,
    currentParticipants: 85,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Computer Science',
    contactEmail: 'hackathon@dypsn.edu',
    contactPhone: '+91 98765 43210',
    registrationDeadline: '2025-01-05',
    requirements: 'Team of 2-4 members'
  },
  {
    id: 'event_5',
    title: 'Career Fair 2025',
    description: 'Meet top companies and explore career opportunities. 50+ companies participating with on-spot interviews.',
    date: '2025-02-15',
    time: '10:00',
    location: 'Main Hall',
    organizer: 'Placement Cell',
    category: 'Academic',
    maxParticipants: 800,
    currentParticipants: 620,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'placement@dypsn.edu',
    contactPhone: '+91 98765 40003',
    registrationDeadline: '2025-02-10',
    requirements: 'Final year students and alumni'
  },
  {
    id: 'event_6',
    title: 'Robotics Workshop',
    description: 'Hands-on workshop on building and programming robots. Learn from industry experts and build your own robot.',
    date: '2024-12-30',
    time: '14:00',
    location: 'IT Lab',
    organizer: 'Robotics Club',
    category: 'Technical',
    maxParticipants: 50,
    currentParticipants: 42,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Information Technology',
    contactEmail: 'robotics@dypsn.edu',
    contactPhone: '+91 98765 43212',
    registrationDeadline: '2024-12-28',
    requirements: 'Basic programming knowledge'
  },
  {
    id: 'event_7',
    title: 'Drama Performance: Macbeth',
    description: 'Theatre club presents Shakespeare\'s Macbeth. A mesmerizing performance by our talented students.',
    date: '2025-01-20',
    time: '18:00',
    location: 'Auditorium',
    organizer: 'Drama & Theatre Club',
    category: 'Cultural',
    maxParticipants: 300,
    currentParticipants: 250,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'drama@dypsn.edu',
    contactPhone: '+91 98765 43213',
    registrationDeadline: '2025-01-18'
  },
  {
    id: 'event_8',
    title: 'Music Concert: Rock Night',
    description: 'An electrifying rock music concert featuring college bands and guest artists. Food and beverages available.',
    date: '2025-01-25',
    time: '19:00',
    location: 'Open Air Theatre',
    organizer: 'Music Club',
    category: 'Cultural',
    maxParticipants: 500,
    currentParticipants: 380,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'music@dypsn.edu',
    contactPhone: '+91 98765 43215',
    registrationDeadline: '2025-01-22'
  },
  {
    id: 'event_9',
    title: 'Startup Pitch Competition',
    description: 'Pitch your startup idea to investors and win funding. Top 3 ideas get seed funding of ₹50,000 each.',
    date: '2025-02-05',
    time: '15:00',
    location: 'Conference Hall',
    organizer: 'Entrepreneurship Club',
    category: 'Academic',
    maxParticipants: 30,
    currentParticipants: 25,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'startup@dypsn.edu',
    contactPhone: '+91 98765 43216',
    registrationDeadline: '2025-01-30',
    requirements: 'Business plan required'
  },
  {
    id: 'event_10',
    title: 'AI & ML Conference',
    description: 'Conference on latest trends in AI and Machine Learning. Keynote speakers from Google, Microsoft, and Amazon.',
    date: '2025-02-20',
    time: '09:30',
    location: 'Main Auditorium',
    organizer: 'AI & ML Club',
    category: 'Technical',
    maxParticipants: 400,
    currentParticipants: 320,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Computer Science',
    contactEmail: 'aiml@dypsn.edu',
    contactPhone: '+91 98765 43219',
    registrationDeadline: '2025-02-15'
  },
  {
    id: 'event_11',
    title: 'Photography Exhibition',
    description: 'Exhibition showcasing best photographs by photography club members. Vote for your favorite!',
    date: '2025-01-12',
    time: '11:00',
    location: 'Art Gallery',
    organizer: 'Photography Club',
    category: 'Cultural',
    maxParticipants: 200,
    currentParticipants: 150,
    status: 'upcoming',
    registrationRequired: false,
    contactEmail: 'photo@dypsn.edu',
    contactPhone: '+91 98765 43211'
  },
  {
    id: 'event_12',
    title: 'Cricket Tournament Finals',
    description: 'Final match of inter-department cricket tournament. CS vs IT. Come and cheer for your team!',
    date: '2024-12-23',
    time: '15:00',
    location: 'Cricket Ground',
    organizer: 'Sports Club',
    category: 'Sports',
    maxParticipants: 1000,
    currentParticipants: 850,
    status: 'upcoming',
    registrationRequired: false,
    contactEmail: 'sports@dypsn.edu',
    contactPhone: '+91 98765 43217'
  },
  {
    id: 'event_13',
    title: 'Cybersecurity Workshop',
    description: 'Learn ethical hacking, penetration testing, and cybersecurity best practices. Hands-on lab sessions included.',
    date: '2025-01-08',
    time: '10:00',
    location: 'CS Lab',
    organizer: 'Cybersecurity Club',
    category: 'Technical',
    maxParticipants: 60,
    currentParticipants: 55,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Computer Science',
    contactEmail: 'cybersec@dypsn.edu',
    contactPhone: '+91 98765 43221',
    registrationDeadline: '2025-01-05',
    requirements: 'Basic networking knowledge'
  },
  {
    id: 'event_14',
    title: 'Literary Fest',
    description: 'Celebrating literature with book discussions, poetry recitations, writing competitions, and author meet.',
    date: '2025-02-10',
    time: '10:00',
    location: 'Library & Auditorium',
    organizer: 'Literary Club',
    category: 'Cultural',
    maxParticipants: 250,
    currentParticipants: 180,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'literary@dypsn.edu',
    contactPhone: '+91 98765 43218',
    registrationDeadline: '2025-02-05'
  },
  {
    id: 'event_15',
    title: 'Tree Plantation Drive',
    description: 'Join us in making the campus greener. Plant trees and contribute to environmental conservation.',
    date: '2025-01-26',
    time: '08:00',
    location: 'College Campus',
    organizer: 'Environmental Club',
    category: 'Social',
    maxParticipants: 100,
    currentParticipants: 75,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'green@dypsn.edu',
    contactPhone: '+91 98765 43222',
    registrationDeadline: '2025-01-24'
  },
  {
    id: 'event_16',
    title: 'Gaming Tournament: Valorant',
    description: 'E-sports tournament featuring Valorant. Prizes worth ₹25,000. Register your team now!',
    date: '2025-01-18',
    time: '14:00',
    location: 'Gaming Lab',
    organizer: 'Gaming Club',
    category: 'Technical',
    maxParticipants: 32,
    currentParticipants: 28,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'gaming@dypsn.edu',
    contactPhone: '+91 98765 43224',
    registrationDeadline: '2025-01-15',
    requirements: 'Team of 5 members'
  },
  {
    id: 'event_17',
    title: 'Debate Competition',
    description: 'Inter-college debate competition. Topics: Technology, Environment, and Society. Cash prizes for winners.',
    date: '2025-02-08',
    time: '15:00',
    location: 'Conference Hall',
    organizer: 'Debate Club',
    category: 'Cultural',
    maxParticipants: 40,
    currentParticipants: 35,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'debate@dypsn.edu',
    contactPhone: '+91 98765 43223',
    registrationDeadline: '2025-02-05'
  },
  {
    id: 'event_18',
    title: 'Short Film Festival',
    description: 'Screening of student-made short films. Awards for best film, director, and cinematography.',
    date: '2025-02-12',
    time: '16:00',
    location: 'Auditorium',
    organizer: 'Film Making Club',
    category: 'Cultural',
    maxParticipants: 300,
    currentParticipants: 220,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'films@dypsn.edu',
    contactPhone: '+91 98765 43225',
    registrationDeadline: '2025-02-10'
  },
  {
    id: 'event_19',
    title: 'Industry Expert Talk: Cloud Computing',
    description: 'Guest lecture by AWS Solutions Architect on cloud computing trends and career opportunities.',
    date: '2025-01-14',
    time: '11:00',
    location: 'Main Auditorium',
    organizer: 'IT Department',
    category: 'Academic',
    maxParticipants: 300,
    currentParticipants: 280,
    status: 'upcoming',
    registrationRequired: true,
    department: 'Information Technology',
    contactEmail: 'itdept@dypsn.edu',
    contactPhone: '+91 98765 43006',
    registrationDeadline: '2025-01-12'
  },
  {
    id: 'event_20',
    title: 'Dance Competition',
    description: 'Inter-department dance competition. Solo, duet, and group performances. Judges from Bollywood industry.',
    date: '2025-01-28',
    time: '17:00',
    location: 'Open Air Theatre',
    organizer: 'Dance Club',
    category: 'Cultural',
    maxParticipants: 50,
    currentParticipants: 45,
    status: 'upcoming',
    registrationRequired: true,
    contactEmail: 'dance@dypsn.edu',
    contactPhone: '+91 98765 43220',
    registrationDeadline: '2025-01-25'
  }
];

// ==================== DUMMY CLUBS ====================
export const dummyClubs: Club[] = [
  {
    id: 'club_1',
    name: 'Coding Club',
    description: 'A club for coding enthusiasts to learn and practice programming. We organize hackathons, coding competitions, and workshops on latest technologies.',
    category: 'Technical',
    president: 'Rajesh Kumar',
    presidentEmail: 'rajesh.kumar@dypsn.edu',
    presidentPhone: '+91 98765 43210',
    facultyAdvisor: 'Dr. Anjali Verma',
    advisorEmail: 'anjali.verma@dypsn.edu',
    totalMembers: 85,
    maxMembers: 150,
    establishedDate: '2020-01-15',
    status: 'active',
    activities: ['Weekly coding sessions', 'Hackathons', 'Guest lectures', 'Open source contributions', 'Tech talks'],
    achievements: ['Won inter-college hackathon 2023', 'Organized tech fest 2024', 'Published 10+ research papers'],
    department: 'Computer Science',
    meetingSchedule: 'Every Friday, 4 PM',
    budget: 150000,
    socialMedia: { instagram: '@codingclub_dypsn', linkedin: 'coding-club-dypsn' }
  },
  {
    id: 'club_2',
    name: 'Photography Club',
    description: 'For photography enthusiasts to share and learn photography skills. We organize photo walks, workshops, and exhibitions.',
    category: 'Cultural',
    president: 'Priya Sharma',
    presidentEmail: 'priya.sharma@dypsn.edu',
    presidentPhone: '+91 98765 43211',
    facultyAdvisor: 'Prof. Ramesh Iyer',
    advisorEmail: 'ramesh.iyer@dypsn.edu',
    totalMembers: 52,
    maxMembers: 80,
    establishedDate: '2021-06-01',
    status: 'active',
    activities: ['Photo walks', 'Workshops', 'Exhibitions', 'Competitions', 'Field trips'],
    achievements: ['Organized college photography exhibition', 'Won state-level photography contest'],
    department: 'Computer Science',
    meetingSchedule: 'Every Saturday, 3 PM',
    budget: 75000,
    socialMedia: { instagram: '@photoclub_dypsn', facebook: 'dypsn-photography-club' }
  },
  {
    id: 'club_3',
    name: 'Robotics Club',
    description: 'Building robots and exploring automation. We design, build, and program robots for competitions and research.',
    category: 'Technical',
    president: 'Amit Patel',
    presidentEmail: 'amit.patel@dypsn.edu',
    presidentPhone: '+91 98765 43212',
    facultyAdvisor: 'Dr. Meera Nair',
    advisorEmail: 'meera.nair@dypsn.edu',
    totalMembers: 68,
    maxMembers: 100,
    establishedDate: '2019-08-20',
    status: 'active',
    activities: ['Robot building workshops', 'Competitions', 'Research projects', 'Industry visits'],
    achievements: ['Won national robotics competition 2023', 'Developed autonomous delivery robot'],
    department: 'Information Technology',
    meetingSchedule: 'Every Wednesday, 5 PM',
    budget: 200000,
    socialMedia: { instagram: '@roboticsclub_dypsn', linkedin: 'dypsn-robotics' }
  },
  {
    id: 'club_4',
    name: 'Drama & Theatre Club',
    description: 'Expressing creativity through drama and theatre. We stage plays, organize drama workshops, and participate in inter-college competitions.',
    category: 'Cultural',
    president: 'Sneha Desai',
    presidentEmail: 'sneha.desai@dypsn.edu',
    presidentPhone: '+91 98765 43213',
    facultyAdvisor: 'Prof. Sanjay Deshmukh',
    advisorEmail: 'sanjay.deshmukh@dypsn.edu',
    totalMembers: 45,
    maxMembers: 60,
    establishedDate: '2022-01-10',
    status: 'active',
    activities: ['Drama rehearsals', 'Workshops', 'Stage performances', 'Script writing'],
    achievements: ['Won inter-college drama competition', 'Staged 5 plays this year'],
    department: 'Computer Science',
    meetingSchedule: 'Every Monday & Thursday, 6 PM',
    budget: 100000,
    socialMedia: { instagram: '@dramaclub_dypsn' }
  },
  {
    id: 'club_5',
    name: 'Music Club',
    description: 'For music lovers and musicians. We organize concerts, jam sessions, and music workshops.',
    category: 'Cultural',
    president: 'Arjun Mehta',
    presidentEmail: 'arjun.mehta@dypsn.edu',
    presidentPhone: '+91 98765 43215',
    facultyAdvisor: 'Dr. Kavita Joshi',
    advisorEmail: 'kavita.joshi@dypsn.edu',
    totalMembers: 60,
    maxMembers: 90,
    establishedDate: '2020-09-15',
    status: 'active',
    activities: ['Jam sessions', 'Music workshops', 'Concerts', 'Open mic nights'],
    achievements: ['Organized college music fest', 'Performed at cultural day'],
    department: 'Computer Science',
    meetingSchedule: 'Every Tuesday, 5 PM',
    budget: 120000,
    socialMedia: { instagram: '@musicclub_dypsn', linkedin: 'dypsn-music-club' }
  },
  {
    id: 'club_6',
    name: 'Entrepreneurship Club',
    description: 'Fostering entrepreneurial spirit. We organize startup workshops, pitch sessions, and connect students with industry mentors.',
    category: 'Academic',
    president: 'Kavya Reddy',
    presidentEmail: 'kavya.reddy@dypsn.edu',
    presidentPhone: '+91 98765 43216',
    facultyAdvisor: 'Prof. Vikram Sharma',
    advisorEmail: 'vikram.sharma@dypsn.edu',
    totalMembers: 75,
    maxMembers: 120,
    establishedDate: '2021-03-01',
    status: 'active',
    activities: ['Startup workshops', 'Pitch sessions', 'Mentor meetups', 'Business plan competitions'],
    achievements: ['Launched 3 student startups', 'Won state-level business plan competition'],
    department: 'Information Technology',
    meetingSchedule: 'Every Friday, 3 PM',
    budget: 180000,
    socialMedia: { linkedin: 'dypsn-entrepreneurship-club', instagram: '@entrepreneurship_dypsn' }
  },
  {
    id: 'club_7',
    name: 'Sports Club',
    description: 'Promoting sports and fitness. We organize tournaments, training sessions, and represent college in inter-college competitions.',
    category: 'Sports',
    president: 'Rohit Joshi',
    presidentEmail: 'rohit.joshi@dypsn.edu',
    presidentPhone: '+91 98765 43217',
    facultyAdvisor: 'Prof. Rajesh Kumar',
    advisorEmail: 'rajesh.kumar@dypsn.edu',
    totalMembers: 120,
    maxMembers: 200,
    establishedDate: '2018-01-15',
    status: 'active',
    activities: ['Cricket tournaments', 'Football matches', 'Basketball training', 'Athletics', 'Fitness sessions'],
    achievements: ['Won inter-college cricket tournament', 'State champions in football'],
    department: 'Mechanical',
    meetingSchedule: 'Daily, 6 AM & 5 PM',
    budget: 250000,
    socialMedia: { instagram: '@sportsclub_dypsn' }
  },
  {
    id: 'club_8',
    name: 'Literary Club',
    description: 'For book lovers and writers. We organize book discussions, writing workshops, and publish college magazine.',
    category: 'Cultural',
    president: 'Ananya Iyer',
    presidentEmail: 'ananya.iyer@dypsn.edu',
    presidentPhone: '+91 98765 43218',
    facultyAdvisor: 'Dr. Priya Menon',
    advisorEmail: 'priya.menon@dypsn.edu',
    totalMembers: 40,
    maxMembers: 70,
    establishedDate: '2021-07-20',
    status: 'active',
    activities: ['Book discussions', 'Writing workshops', 'Poetry sessions', 'Magazine publishing'],
    achievements: ['Published 3 college magazines', 'Organized literary fest'],
    department: 'Information Technology',
    meetingSchedule: 'Every Saturday, 4 PM',
    budget: 60000,
    socialMedia: { instagram: '@literaryclub_dypsn' }
  },
  {
    id: 'club_9',
    name: 'AI & ML Club',
    description: 'Exploring artificial intelligence and machine learning. We work on AI projects, organize workshops, and participate in competitions.',
    category: 'Technical',
    president: 'Siddharth Nair',
    presidentEmail: 'siddharth.nair@dypsn.edu',
    presidentPhone: '+91 98765 43219',
    facultyAdvisor: 'Dr. Anjali Verma',
    advisorEmail: 'anjali.verma@dypsn.edu',
    totalMembers: 90,
    maxMembers: 150,
    establishedDate: '2022-02-15',
    status: 'active',
    activities: ['ML workshops', 'AI projects', 'Kaggle competitions', 'Research papers'],
    achievements: ['Won Kaggle competition', 'Published 5 research papers', 'Developed AI chatbot'],
    department: 'Computer Science',
    meetingSchedule: 'Every Thursday, 4 PM',
    budget: 220000,
    socialMedia: { linkedin: 'dypsn-ai-ml-club', instagram: '@aimlclub_dypsn' }
  },
  {
    id: 'club_10',
    name: 'Dance Club',
    description: 'Expressing through dance. We organize dance performances, workshops, and participate in competitions.',
    category: 'Cultural',
    president: 'Divya Menon',
    presidentEmail: 'divya.menon@dypsn.edu',
    presidentPhone: '+91 98765 43220',
    facultyAdvisor: 'Prof. Ramesh Iyer',
    advisorEmail: 'ramesh.iyer@dypsn.edu',
    totalMembers: 55,
    maxMembers: 80,
    establishedDate: '2020-11-01',
    status: 'active',
    activities: ['Dance rehearsals', 'Workshops', 'Performances', 'Competitions'],
    achievements: ['Won inter-college dance competition', 'Performed at cultural day'],
    department: 'Computer Science',
    meetingSchedule: 'Every Monday & Wednesday, 6 PM',
    budget: 95000,
    socialMedia: { instagram: '@danceclub_dypsn', linkedin: 'dypsn-dance-club' }
  },
  {
    id: 'club_11',
    name: 'Cybersecurity Club',
    description: 'Learning and practicing cybersecurity. We organize CTF competitions, security workshops, and ethical hacking sessions.',
    category: 'Technical',
    president: 'Karan Deshmukh',
    presidentEmail: 'karan.deshmukh@dypsn.edu',
    presidentPhone: '+91 98765 43221',
    facultyAdvisor: 'Dr. Kavita Joshi',
    advisorEmail: 'kavita.joshi@dypsn.edu',
    totalMembers: 70,
    maxMembers: 100,
    establishedDate: '2021-09-10',
    status: 'active',
    activities: ['CTF competitions', 'Security workshops', 'Ethical hacking sessions', 'Bug bounty programs'],
    achievements: ['Won national CTF competition', 'Found security vulnerabilities in college systems'],
    department: 'Computer Science',
    meetingSchedule: 'Every Friday, 5 PM',
    budget: 160000,
    socialMedia: { linkedin: 'dypsn-cybersecurity', instagram: '@cybersecclub_dypsn' }
  },
  {
    id: 'club_12',
    name: 'Environmental Club',
    description: 'Promoting environmental awareness and sustainability. We organize tree plantation drives, awareness campaigns, and green initiatives.',
    category: 'Social',
    president: 'Neha Gupta',
    presidentEmail: 'neha.gupta@dypsn.edu',
    presidentPhone: '+91 98765 43222',
    facultyAdvisor: 'Dr. Anjali Desai',
    advisorEmail: 'anjali.desai@dypsn.edu',
    totalMembers: 65,
    maxMembers: 100,
    establishedDate: '2022-04-22',
    status: 'active',
    activities: ['Tree plantation', 'Awareness campaigns', 'Recycling drives', 'Green campus initiatives'],
    achievements: ['Planted 500+ trees', 'Made campus plastic-free', 'Won green campus award'],
    department: 'Civil',
    meetingSchedule: 'Every Saturday, 10 AM',
    budget: 110000,
    socialMedia: { instagram: '@greenclub_dypsn' }
  },
  {
    id: 'club_13',
    name: 'Debate Club',
    description: 'Honing debating and public speaking skills. We organize debates, elocution competitions, and MUN sessions.',
    category: 'Cultural',
    president: 'Vishal Shah',
    presidentEmail: 'vishal.shah@dypsn.edu',
    presidentPhone: '+91 98765 43223',
    facultyAdvisor: 'Prof. Sanjay Deshmukh',
    advisorEmail: 'sanjay.deshmukh@dypsn.edu',
    totalMembers: 50,
    maxMembers: 75,
    establishedDate: '2021-01-20',
    status: 'active',
    activities: ['Debate sessions', 'Elocution competitions', 'MUN sessions', 'Public speaking workshops'],
    achievements: ['Won inter-college debate competition', 'Organized MUN conference'],
    department: 'Computer Science',
    meetingSchedule: 'Every Wednesday, 4 PM',
    budget: 80000,
    socialMedia: { instagram: '@debateclub_dypsn' }
  },
  {
    id: 'club_14',
    name: 'Gaming Club',
    description: 'For gaming enthusiasts. We organize gaming tournaments, e-sports competitions, and game development workshops.',
    category: 'Technical',
    president: 'Rahul Verma',
    presidentEmail: 'rahul.verma@dypsn.edu',
    presidentPhone: '+91 98765 43224',
    facultyAdvisor: 'Prof. Ramesh Iyer',
    advisorEmail: 'ramesh.iyer@dypsn.edu',
    totalMembers: 95,
    maxMembers: 150,
    establishedDate: '2022-06-01',
    status: 'active',
    activities: ['Gaming tournaments', 'E-sports competitions', 'Game development workshops', 'LAN parties'],
    achievements: ['Won state-level e-sports tournament', 'Developed 3 indie games'],
    department: 'Information Technology',
    meetingSchedule: 'Every Friday, 6 PM',
    budget: 190000,
    socialMedia: { instagram: '@gamingclub_dypsn', linkedin: 'dypsn-gaming' }
  },
  {
    id: 'club_15',
    name: 'Film Making Club',
    description: 'Creating and sharing films. We organize film screenings, workshops, and short film competitions.',
    category: 'Cultural',
    president: 'Pooja Kulkarni',
    presidentEmail: 'pooja.kulkarni@dypsn.edu',
    presidentPhone: '+91 98765 43225',
    facultyAdvisor: 'Dr. Meera Nair',
    advisorEmail: 'meera.nair@dypsn.edu',
    totalMembers: 38,
    maxMembers: 60,
    establishedDate: '2022-08-15',
    status: 'active',
    activities: ['Film screenings', 'Workshops', 'Short film competitions', 'Documentary making'],
    achievements: ['Won short film competition', 'Screened 10+ student films'],
    department: 'Information Technology',
    meetingSchedule: 'Every Sunday, 2 PM',
    budget: 130000,
    socialMedia: { instagram: '@filmclub_dypsn', linkedin: 'dypsn-films' }
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
    notes: 'Contains laptop and charger',
    createdAt: '2024-12-19T14:30:00Z',
    updatedAt: '2024-12-19T14:30:00Z'
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
    claimedByPhone: '+91 98765 43212',
    createdAt: '2024-12-18T16:00:00Z',
    updatedAt: '2024-12-19T10:00:00Z'
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
    status: 'found',
    createdAt: '2024-12-20T10:15:00Z',
    updatedAt: '2024-12-20T10:15:00Z'
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
    distanceFromCollege: 0.5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z'
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
    distanceFromCollege: 0.5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z'
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
    distanceFromCollege: 0.5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T10:00:00Z'
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
  students: (realData: User[] = [], filters?: { year?: string; sem?: string; div?: string; department?: string }) => {
    if (!USE_DUMMY_DATA) return realData;
    if (realData.length > 0) return realData;
    
    // Filter dummy students based on provided filters
    let filtered = dummyStudents;
    if (filters) {
      if (filters.year) filtered = filtered.filter(s => s.year === filters.year);
      if (filters.sem) filtered = filtered.filter(s => s.sem === filters.sem);
      if (filters.div) filtered = filtered.filter(s => s.div === filters.div);
      if (filters.department) {
        const deptCode = filters.department;
        filtered = filtered.filter(s => 
          s.department === filters.department || 
          (deptCode === 'CSE' && s.department === 'Computer Science') ||
          (deptCode === 'IT' && s.department === 'Information Technology') ||
          (deptCode === 'ME' && s.department === 'Mechanical') ||
          (deptCode === 'EE' && s.department === 'Electronics') ||
          (deptCode === 'CE' && s.department === 'Civil')
        );
      }
    }
    return filtered;
  },
  teachers: (realData: User[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyTeachers : realData,
  leaveRequests: (realData: LeaveRequest[] = []) => USE_DUMMY_DATA && realData.length === 0 ? dummyLeaveRequests : realData,
  attendanceLogs: (realData: AttendanceLog[] = [], filters?: { year?: string; sem?: string; div?: string; subject?: string; date?: string; rollNumber?: string }) => {
    if (!USE_DUMMY_DATA) return realData;
    if (realData.length > 0) return realData;
    
    // Filter dummy attendance logs based on provided filters
    let filtered = dummyAttendanceLogs;
    if (filters) {
      if (filters.year) filtered = filtered.filter(a => a.year === filters.year);
      if (filters.sem) filtered = filtered.filter(a => a.sem === filters.sem);
      if (filters.div) filtered = filtered.filter(a => a.div === filters.div);
      if (filters.subject) filtered = filtered.filter(a => a.subject === filters.subject);
      if (filters.date) filtered = filtered.filter(a => a.date === filters.date);
      if (filters.rollNumber) {
        // Match by rollNumber directly if available in attendance log, otherwise match by student
        filtered = filtered.filter(a => {
          if ((a as any).rollNumber === filters.rollNumber) return true;
          const student = dummyStudents.find(s => s.rollNumber === filters.rollNumber);
          return student && a.userId === student.id;
        });
      }
    }
    return filtered;
  },
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


import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import { User, LeaveRequest, AttendanceLog, Notification, Subject, ResultRecord, Department, AcademicYear, FeeStructureItem, InstitutionInfo, Complaint, Event, Club, ClubMember, VisitorProfile, Bus, BusRoute, LostFoundItem, HostelRoom } from '../types';
// Local fallbacks for library types (module does not export them)
type LibraryBook = any;
type LibraryMember = any;
type LibraryTransaction = any;
import { getDepartmentCode } from '../utils/departmentMapping';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TEACHERS: 'teachers',
  LEAVE_REQUESTS: 'leaveRequests',
  LEAVE: 'leave',
  ATTENDANCE: 'attendance',
  RESULTS: 'results',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  SETTINGS: 'settings',
  STUDENTS: 'students',
  SUBJECTS: 'subjects',
  DEPARTMENTS: 'departments',
  INSTITUTION_SETTINGS: 'institutionSettings',
  COMPLAINTS: 'complaints',
  EVENTS: 'events',
  CLUBS: 'clubs',
  CLUB_MEMBERS: 'clubMembers',
  LIBRARY_BOOKS: 'libraryBooks',
  LIBRARY_MEMBERS: 'libraryMembers',
  LIBRARY_TRANSACTIONS: 'libraryTransactions',
  VISITORS: 'visitors',
  BUSES: 'buses',
  BUS_ROUTES: 'busRoutes',
  LOST_FOUND: 'lostFound',
  HOSTEL_ROOMS: 'hostelRooms'
} as const;

// Department constants
export const DEPARTMENTS = {
  FIRST_YEAR: 'FIRST_YEAR',
  CSE: 'CSE',
  DATA_SCIENCE: 'DATA_SCIENCE',
  CIVIL: 'CIVIL',
  ELECTRICAL: 'ELECTRICAL'
} as const;

// Department display names
export const DEPARTMENT_NAMES = {
  [DEPARTMENTS.FIRST_YEAR]: 'First Year',
  [DEPARTMENTS.CSE]: 'Computer Science & Engineering',
  [DEPARTMENTS.DATA_SCIENCE]: 'Data Science (CSE)',
  [DEPARTMENTS.CIVIL]: 'Civil Engineering',
  [DEPARTMENTS.ELECTRICAL]: 'Electrical Engineering'
} as const;

// Batch-based collection path builder with department support
export const buildBatchPath = {
  // Build attendance path: /attendance/batch/{batch}/DEPARTMENT/year/{studentYear}/sems/{sem}/divs/{div}/subjects/{subject}/{year}/{month}/{day}
  attendance: (batch: string, department: string, studentYear: string, sem: string, div: string, subject: string, date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${COLLECTIONS.ATTENDANCE}/batch/${batch}/${department}/year/${studentYear}/sems/${sem}/divs/${div}/subjects/${subject}/${year}/${month}/${day}`;
  },

  // Build leave path: /leave/batch/{batch}/DEPARTMENT/year/{studentYear}/sems/{sem}/divs/{div}/subjects/{subject}/{year}/{month}/{day}
  leave: (batch: string, department: string, studentYear: string, sem: string, div: string, subject: string, date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${COLLECTIONS.LEAVE}/batch/${batch}/${department}/year/${studentYear}/sems/${sem}/divs/${div}/subjects/${subject}/${year}/${month}/${day}`;
  },

  // Build student path: /students/batch/{batch}/DEPARTMENT/year/{year}/sems/{sem}/divs/{div}/students
  student: (batch: string, department: string, year: string, sem: string, div: string) => {
    return `${COLLECTIONS.STUDENTS}/batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/students`;
  },

  // Build teacher path: /teachers/batch/{batch}/DEPARTMENT/sems/{sem}/divs/{div}/teachers
  teacher: (batch: string, department: string, sem: string, div: string) => {
    return `teachers/batch/${batch}/${department}/sems/${sem}/divs/${div}/teachers`;
  },

  // Build notification path: /notifications/batch/{batch}/DEPARTMENT/sems/{sem}/divs/{div}/{year}/{month}/{day}
  notification: (batch: string, department: string, sem: string, div: string, date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${COLLECTIONS.NOTIFICATIONS}/batch/${batch}/${department}/sems/${sem}/divs/${div}/${year}/${month}/${day}`;
  },

  // Build audit log path: /auditLogs/batch/{batch}/DEPARTMENT/sems/{sem}/divs/{div}/{year}/{month}/{day}
  auditLog: (batch: string, department: string, sem: string, div: string, date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${COLLECTIONS.AUDIT_LOGS}/batch/${batch}/${department}/sems/${sem}/divs/${div}/${year}/${month}/${day}`;
  },

  // Build results path:
  // /results/batch/{batch}/{department}/year/{studentYear}/sems/{sem}/divs/{div}/subjects/{subject}/{examType}
  result: (batch: string, department: string, studentYear: string, sem: string, div: string, subject: string, examType: string) => {
    return `${COLLECTIONS.RESULTS}/batch/${batch}/${department}/year/${studentYear}/sems/${sem}/divs/${div}/subjects/${subject}/${examType}`;
  },

  // Build batch attendance path: /batchattendance/batch/{batchYear}/CSE/year/{year}/sems/{sem}/divs/{division}/batch/{batchName}/subjects/{subjectName}/{date}
  batchAttendance: (batch: string, department: string, year: string, sem: string, div: string, batchName: string, subject: string, date: Date) => {
    const attendanceYear = date.getFullYear().toString();
    const attendanceMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const attendanceDate = date.getDate().toString().padStart(2, '0');
    return `batchattendance/batch/${batch}/${department}/year/${year}/sems/${sem}/divs/${div}/batch/${batchName}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
  },

  // Build batch path: /batches/{batchId} (simplified structure)
  batch: (batchId: string) => {
    return `batches/${batchId}`;
  }
};

// Document and Course hierarchical paths
// documents: /documents/batch/{batch}/{department}/year/{year}/sems/{sem}/files
// courses:   /courses/batch/{batch}/{department}/year/{year}/sems/{sem}/courses
// course docs: /courses/.../courses/{courseId}/documents
export const buildAcademicPaths = {
  documentsCollection: (batch: string, department: string, year: string, sem: string): string => {
    return `documents/batch/${batch}/${department}/year/${year}/sems/${sem}/files`;
  },
  coursesCollection: (batch: string, department: string, year: string, sem: string): string => {
    return `courses/batch/${batch}/${department}/year/${year}/sems/${sem}/courses`;
  },
  courseDocumentsCollection: (
    batch: string,
    department: string,
    year: string,
    sem: string,
    courseId: string
  ): string => {
    return `courses/batch/${batch}/${department}/year/${year}/sems/${sem}/courses/${courseId}/documents`;
  }
};

// Helper function to get batch year from student year
export const getBatchYear = (studentYear: string): string => {
  const currentYear = new Date().getFullYear();
  // All students belong to the current year batch
  return currentYear.toString();
};

// Helper function to get current batch year
export const getCurrentBatchYear = (): string => {
  return new Date().getFullYear().toString();
};

// Helper function to get department from student data
export const getDepartment = (studentData: any): string => {
  // Map department names to constants
  const departmentMap: { [key: string]: string } = {
    'first year': DEPARTMENTS.FIRST_YEAR,
    'first_year': DEPARTMENTS.FIRST_YEAR,
    'FIRST_YEAR': DEPARTMENTS.FIRST_YEAR,
    'cse': DEPARTMENTS.CSE,
    'CSE': DEPARTMENTS.CSE,
    'computer science': DEPARTMENTS.CSE,
    'computer science & engineering': DEPARTMENTS.CSE,
    'data science': DEPARTMENTS.DATA_SCIENCE,
    'DATA_SCIENCE': DEPARTMENTS.DATA_SCIENCE,
    'data science (cse)': DEPARTMENTS.DATA_SCIENCE,
    'civil': DEPARTMENTS.CIVIL,
    'CIVIL': DEPARTMENTS.CIVIL,
    'civil engineering': DEPARTMENTS.CIVIL,
    'electrical': DEPARTMENTS.ELECTRICAL,
    'ELECTRICAL': DEPARTMENTS.ELECTRICAL,
    'electrical engineering': DEPARTMENTS.ELECTRICAL
  };

  const dept = studentData.department || studentData.dept || 'CSE';
  return departmentMap[dept.toLowerCase()] || DEPARTMENTS.CSE;
};

// Helper function to get department from teacher data
export const getTeacherDepartment = (teacherData: any): string => {
  // Map department names to constants
  const departmentMap: { [key: string]: string } = {
    'first year': DEPARTMENTS.FIRST_YEAR,
    'first_year': DEPARTMENTS.FIRST_YEAR,
    'FIRST_YEAR': DEPARTMENTS.FIRST_YEAR,
    'cse': DEPARTMENTS.CSE,
    'CSE': DEPARTMENTS.CSE,
    'computer science': DEPARTMENTS.CSE,
    'computer science & engineering': DEPARTMENTS.CSE,
    'data science': DEPARTMENTS.DATA_SCIENCE,
    'DATA_SCIENCE': DEPARTMENTS.DATA_SCIENCE,
    'data science (cse)': DEPARTMENTS.DATA_SCIENCE,
    'civil': DEPARTMENTS.CIVIL,
    'CIVIL': DEPARTMENTS.CIVIL,
    'civil engineering': DEPARTMENTS.CIVIL,
    'electrical': DEPARTMENTS.ELECTRICAL,
    'ELECTRICAL': DEPARTMENTS.ELECTRICAL,
    'electrical engineering': DEPARTMENTS.ELECTRICAL
  };

  const dept = teacherData.department || teacherData.dept || teacherData.assignedDepartment || 'CSE';
  return departmentMap[dept.toLowerCase()] || DEPARTMENTS.CSE;
};

// Helper function to auto-detect department from existing Firestore data
export const autoDetectDepartment = async (userId: string, role: 'student' | 'teacher'): Promise<string> => {
  try {
    if (role === 'student') {
      // Check existing student data in Firestore
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.department || userData.dept) {
          return getDepartment(userData);
        }
        
        // Check department-based collections for existing data
        for (const dept of Object.values(DEPARTMENTS)) {
          try {
            const batchPath = buildBatchPath.student('2025', dept, '2nd', '3', 'A');
            const studentRef = doc(db, batchPath, userId);
            const studentDoc = await getDoc(studentRef);
            
            if (studentDoc.exists()) {
              return dept;
            }
          } catch (error) {
            // Collection might not exist, continue to next department
            continue;
          }
        }
      }
    } else if (role === 'teacher') {
      // Check existing teacher data in Firestore
      const teacherRef = doc(db, COLLECTIONS.TEACHERS, userId);
      const teacherDoc = await getDoc(teacherRef);
      
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        if (teacherData.department || teacherData.dept || teacherData.assignedDepartment) {
          return getTeacherDepartment(teacherData);
        }
        
        // Check department-based collections for existing data
        for (const dept of Object.values(DEPARTMENTS)) {
          try {
            const batchPath = buildBatchPath.teacher('2025', dept, '3', 'A');
            const teacherRef = doc(db, batchPath, userId);
            const teacherDoc = await getDoc(teacherRef);
            
            if (teacherDoc.exists()) {
              return dept;
            }
          } catch (error) {
            // Collection might not exist, continue to next department
            continue;
          }
        }
      }
    }
    
    // Default to CSE if no department found
    return DEPARTMENTS.CSE;
  } catch (error) {
    // Handle error silently
    return DEPARTMENTS.CSE;
  }
};

// Helper function to get department faculty for leave approval
export const getDepartmentFaculty = async (department: string): Promise<any[]> => {
  try {
    const faculty: any[] = [];
    
    // Search for teachers in the specified department across all batches
    for (const batch of ['2025', '2026', '2027', '2028']) {
      for (const sem of ['1', '2', '3', '4', '5', '6', '7', '8']) {
        for (const div of ['A', 'B', 'C', 'D']) {
          try {
            const batchPath = buildBatchPath.teacher(batch, department, sem, div);
            const teachersSnapshot = await getDocs(collection(db, batchPath));
            
            teachersSnapshot.docs.forEach(doc => {
              const teacherData = doc.data();
              if (teacherData.role === 'teacher' && teacherData.department === department) {
                faculty.push({
                  id: doc.id,
                  ...teacherData
                });
              }
            });
          } catch (error) {
            // Collection might not exist, continue to next
            continue;
          }
        }
      }
    }
    
    // Also check main teachers collection
    const teachersQuery = query(
      collection(db, COLLECTIONS.TEACHERS),
      where('department', '==', department),
      where('role', '==', 'teacher')
    );
    
    const teachersSnapshot = await getDocs(teachersQuery);
    teachersSnapshot.docs.forEach(doc => {
      const teacherData = doc.data();
      if (!faculty.find(f => f.id === doc.id)) {
        faculty.push({
          id: doc.id,
          ...teacherData
        });
      }
    });
    
    return faculty;
  } catch (error) {
    // Handle error silently
    return [];
  }
};

// Helper function to get department head or coordinator
export const getDepartmentHead = async (department: string): Promise<any | null> => {
  try {
    // First check for department head/coordinator in main teachers collection
    const teachersQuery = query(
      collection(db, COLLECTIONS.TEACHERS),
      where('department', '==', department),
      where('role', '==', 'teacher'),
      where('isDepartmentHead', '==', true)
    );
    
    const teachersSnapshot = await getDocs(teachersQuery);
    if (!teachersSnapshot.empty) {
      const teacherDoc = teachersSnapshot.docs[0];
      return {
        id: teacherDoc.id,
        ...teacherDoc.data()
      };
    }
    
    // If no department head found, get the first available teacher
    const faculty = await getDepartmentFaculty(department);
    if (faculty.length > 0) {
      return faculty[0];
    }
    
    return null;
  } catch (error) {
    // Handle error silently
    return null;
  }
};

// Helper function to validate department
export const isValidDepartment = (department: string): boolean => {
  return Object.values(DEPARTMENTS).includes(department as any);
};

// Helper function to get department display name
export const getDepartmentDisplayName = (department: string): string => {
  return DEPARTMENT_NAMES[department as keyof typeof DEPARTMENT_NAMES] || department;
};

// Helper function to filter out undefined values
const filterUndefinedValues = (obj: any): any => {
  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// User Management
export const userService = {
  // Create or update user with role-based structure
  async createUser(userData: User): Promise<void> {
    // Track roll number change across the entire function scope
    let isRollNumberChange = false;
    let oldRollNumber = '';
    try {
      // Validate user data
      if (!userData.id || !userData.role) {
        throw new Error('User ID and role are required');
      }

      const userRef = doc(db, COLLECTIONS.USERS, userData.id);
      
      // Check if this is a roll number update for existing student
      const existingUser = await getDoc(userRef);
      
      if (existingUser.exists() && userData.role === 'student') {
        const existingData = existingUser.data();
        if (existingData.rollNumber && existingData.rollNumber !== userData.rollNumber) {
          isRollNumberChange = true;
          oldRollNumber = existingData.rollNumber;
          // Roll number change detected
        }
      }

      // Calculate batchYear for students to include in main collection
      let batchYearForMain: string | undefined;
      if (userData.role === 'student' && userData.year) {
        batchYearForMain = getBatchYear(userData.year);
      }
      
      // Update main user document in role-based structure
      await setDoc(userRef, {
        ...filterUndefinedValues(userData),
        ...(batchYearForMain ? { batchYear: batchYearForMain } : {}),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('[userService] Error creating user:', error);
      throw error;
    }

    // If it's a student, handle department-based structure
    if (userData.role === 'student' && userData.year && userData.sem && userData.div) {
      const batch = getBatchYear(userData.year);
      // Auto-detect department if not provided
      let department = userData.department || (userData as any).dept;
      if (!department) {
        department = await autoDetectDepartment(userData.id, 'student');
        // Auto-detected department for student
      } else {
        department = getDepartment(userData);
      }
      
      const batchPath = buildBatchPath.student(batch, department, userData.year, userData.sem, userData.div);
      
      // If roll number changed, migrate historical data
      if (isRollNumberChange && oldRollNumber) {
        await this.migrateStudentDataOnRollNumberChange(
          userData.id,
          oldRollNumber,
          userData.rollNumber!,
          batch,
          department,
          userData.year,
          userData.sem,
          userData.div
        );
      }
      
      // Save/update student in department structure
      const studentRef = doc(db, batchPath, userData.rollNumber || userData.id);
      await setDoc(studentRef, {
        ...filterUndefinedValues(userData),
        batchYear: batch,
        department: department,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    }

    // If it's a teacher, also save to department-based structure
    if (userData.role === 'teacher' && userData.year && userData.sem && userData.div) {
      const batch = getBatchYear(userData.year);
      // Auto-detect department if not provided
      let department = userData.department || (userData as any).dept || (userData as any).assignedDepartment;
      if (!department) {
        department = await autoDetectDepartment(userData.id, 'teacher');
        // Auto-detected department for teacher
      } else {
        department = getTeacherDepartment(userData);
      }
      
      const batchPath = buildBatchPath.teacher(batch, department, userData.sem, userData.div);
      const teacherRef = doc(db, batchPath, userData.id);
      await setDoc(teacherRef, {
        ...filterUndefinedValues(userData),
        batchYear: batch,
        department: department,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    }
  },

  // Migrate all student data when roll number changes
  async migrateStudentDataOnRollNumberChange(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string
  ): Promise<void> {
    try {
      // Starting data migration for roll number change
      
      const migrationResults = {
        attendance: { migrated: 0, errors: 0 },
        leaves: { migrated: 0, errors: 0 },
        notifications: { migrated: 0, errors: 0 },
        auditLogs: { migrated: 0, errors: 0 }
      };

      // 1. Migrate attendance records
      try {
        await this.migrateAttendanceRecords(userId, oldRollNumber, newRollNumber, batch, department, sem, div, migrationResults);
      } catch (error) {
        // Handle error silently
      }

      // 2. Migrate leave requests
      try {
        await this.migrateLeaveRecords(userId, oldRollNumber, newRollNumber, batch, department, sem, div, migrationResults);
      } catch (error) {
        // Handle error silently
      }

      // 3. Migrate notifications
      try {
        await this.migrateNotificationRecords(userId, oldRollNumber, newRollNumber, batch, department, sem, div, migrationResults);
      } catch (error) {
        // Handle error silently
      }

      // 4. Migrate audit logs
      try {
        await this.migrateAuditLogRecords(userId, oldRollNumber, newRollNumber, batch, department, sem, div, migrationResults);
      } catch (error) {
        // Handle error silently
      }

      // 5. Update roll number mapping for future reference
      await this.updateRollNumberMapping(userId, oldRollNumber, newRollNumber);

      // Roll number change migration completed
    } catch (error) {
      // Handle error silently
      throw error;
    }
  },

  // Migrate attendance records
  async migrateAttendanceRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    // Query all attendance records for this user across all subjects and dates
    const attendanceQuery = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('userId', '==', userId)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    for (const docSnapshot of attendanceSnapshot.docs) {
      try {
        const attendance = docSnapshot.data();
        
        // Update the attendance record with new roll number
        await updateDoc(docSnapshot.ref, {
          rollNumber: newRollNumber,
          userName: attendance.userName || newRollNumber,
          updatedAt: serverTimestamp(),
          rollNumberChanged: true,
          previousRollNumber: oldRollNumber,
          rollNumberChangeDate: serverTimestamp()
        });
        
        results.attendance.migrated++;
      } catch (error) {
        // Handle error silently
        results.attendance.errors++;
      }
    }

    // Also update department-based attendance records
    await this.migrateDepartmentBasedAttendanceRecords(
      userId, oldRollNumber, newRollNumber, batch, department, sem, div, results
    );
  },

  // Migrate department-based attendance records
  async migrateDepartmentBasedAttendanceRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    // Get all subjects this student might have attended
    const subjects = ['General', 'Microprocessor', 'Data Structures', 'Database', 'Web Development', 'Machine Learning'];
    
    for (const subject of subjects) {
      try {
        // Query department-based attendance for this subject
        const attendancePath = buildBatchPath.attendance(batch, department, '2nd', sem, div, subject, new Date());
        const attendanceQuery = query(
          collection(db, attendancePath),
          where('userId', '==', userId)
        );
        
        const snapshot = await getDocs(attendanceQuery);
        
        for (const docSnapshot of snapshot.docs) {
          try {
            await updateDoc(docSnapshot.ref, {
              rollNumber: newRollNumber,
              userName: newRollNumber,
              updatedAt: serverTimestamp(),
              rollNumberChanged: true,
              previousRollNumber: oldRollNumber,
              rollNumberChangeDate: serverTimestamp()
            });
            
            results.attendance.migrated++;
          } catch (error) {
            // Handle error silently
            results.attendance.errors++;
          }
        }
      } catch (error) {
        // Subject collection might not exist, continue to next
        continue;
      }
    }
  },

  // Migrate leave records
  async migrateLeaveRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    // Query all leave requests for this user
    const leaveQuery = query(
      collection(db, COLLECTIONS.LEAVE_REQUESTS),
      where('userId', '==', userId)
    );
    
    const leaveSnapshot = await getDocs(leaveQuery);
    
    for (const docSnapshot of leaveSnapshot.docs) {
      try {
        await updateDoc(docSnapshot.ref, {
          rollNumber: newRollNumber,
          updatedAt: serverTimestamp(),
          rollNumberChanged: true,
          previousRollNumber: oldRollNumber,
          rollNumberChangeDate: serverTimestamp()
        });
        
        results.leaves.migrated++;
      } catch (error) {
        // Handle error silently
        results.leaves.errors++;
      }
    }

    // Also update department-based leave records
    await this.migrateDepartmentBasedLeaveRecords(
      userId, oldRollNumber, newRollNumber, batch, department, sem, div, results
    );
  },

  // Migrate department-based leave records
  async migrateDepartmentBasedLeaveRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    const subjects = ['General', 'Microprocessor', 'Data Structures', 'Database', 'Web Development', 'Machine Learning'];
    
    for (const subject of subjects) {
      try {
        const leavePath = buildBatchPath.leave(batch, department, '2nd', sem, div, subject, new Date());
        const leaveQuery = query(
          collection(db, leavePath),
          where('userId', '==', userId)
        );
        
        const snapshot = await getDocs(leaveQuery);
        
        for (const docSnapshot of snapshot.docs) {
          try {
            await updateDoc(docSnapshot.ref, {
              rollNumber: newRollNumber,
              updatedAt: serverTimestamp(),
              rollNumberChanged: true,
              previousRollNumber: oldRollNumber,
              rollNumberChangeDate: serverTimestamp()
            });
            
            results.leaves.migrated++;
          } catch (error) {
            // Handle error silently
            results.leaves.errors++;
          }
        }
      } catch (error) {
        // Subject collection might not exist, continue to next
        continue;
      }
    }
  },

  // Migrate notification records
  async migrateNotificationRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    const notificationQuery = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );
    
    const notificationSnapshot = await getDocs(notificationQuery);
    
    for (const docSnapshot of notificationSnapshot.docs) {
      try {
        await updateDoc(docSnapshot.ref, {
          rollNumber: newRollNumber,
          updatedAt: serverTimestamp(),
          rollNumberChanged: true,
          previousRollNumber: oldRollNumber,
          rollNumberChangeDate: serverTimestamp()
        });
        
        results.notifications.migrated++;
      } catch (error) {
        console.error('[userService] Error updating notification record:', docSnapshot.id, error);
        results.notifications.errors++;
      }
    }
  },

  // Migrate audit log records
  async migrateAuditLogRecords(
    userId: string,
    oldRollNumber: string,
    newRollNumber: string,
    batch: string,
    department: string,
    sem: string,
    div: string,
    results: any
  ): Promise<void> {
    const auditQuery = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('userId', '==', userId)
    );
    
    const auditSnapshot = await getDocs(auditQuery);
    
    for (const docSnapshot of auditSnapshot.docs) {
      try {
        await updateDoc(docSnapshot.ref, {
          rollNumber: newRollNumber,
          updatedAt: serverTimestamp(),
          rollNumberChanged: true,
          previousRollNumber: oldRollNumber,
          rollNumberChangeDate: serverTimestamp()
        });
        
        results.auditLogs.migrated++;
      } catch (error) {
        console.error('[userService] Error updating audit log record:', docSnapshot.id, error);
        results.auditLogs.errors++;
      }
    }
  },

  // Update roll number mapping for future reference
  async updateRollNumberMapping(userId: string, oldRollNumber: string, newRollNumber: string): Promise<void> {
    const mappingRef = doc(db, 'rollNumberMappings', userId);
    await setDoc(mappingRef, {
      userId: userId,
      oldRollNumber: oldRollNumber,
      newRollNumber: newRollNumber,
      changeDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Get user by ID (searches across all roles)
  // Get user by ID (flat structure)
  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
      }
      
      return null;
    } catch (error) {
      console.error('[userService] Error getting user:', error);
      return null;
    }
  },

  // Get all users (flat structure)
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('[userService] Error getting all users:', error);
      return [];
    }
  },

  // Get users by role (flat structure)
  async getUsersByRole(role: User['role']): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', role), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('[userService] Error getting users by role:', error);
      throw error;
    }
  },

  // Search students by name or roll number
  async searchStudents(query: string, filters?: {
    year?: string;
    sem?: string;
    div?: string;
    department?: string;
    limit?: number;
  }): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('role', '==', 'student'),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      let students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));

      // Filter by search query (name or roll number)
      const searchLower = query.toLowerCase();
      students = students.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        (student.rollNumber && student.rollNumber.toString().includes(query))
      );

      // Apply additional filters
      if (filters) {
        if (filters.year) {
          students = students.filter(s => (s as any).year === filters.year);
        }
        if (filters.sem) {
          students = students.filter(s => (s as any).sem === filters.sem);
        }
        if (filters.div) {
          students = students.filter(s => (s as any).div === filters.div);
        }
        if (filters.department) {
          students = students.filter(s => s.department === filters.department);
        }
        if (filters.limit) {
          students = students.slice(0, filters.limit);
        }
      }

      return students;
    } catch (error) {
      console.error('[userService] Error searching students:', error);
      return [];
    }
  },

  // TEACHERS: dedicated collection helpers
  async createTeacher(teacher: User): Promise<void> {
    // Write to teachers collection
    const teacherRef = doc(db, COLLECTIONS.TEACHERS, teacher.id);
    await setDoc(teacherRef, {
      ...teacher,
      role: 'teacher',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    // Mirror into users collection for backward compatibility/queries
    const userRef = doc(db, COLLECTIONS.USERS, teacher.id);
    await setDoc(userRef, {
      ...teacher,
      role: 'teacher',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  },

  async updateTeacher(teacherId: string, updates: Partial<User>): Promise<void> {
    const teacherRef = doc(db, COLLECTIONS.TEACHERS, teacherId);
    await setDoc(teacherRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });

    const userRef = doc(db, COLLECTIONS.USERS, teacherId);
    await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    const teacherRef = doc(db, COLLECTIONS.TEACHERS, teacherId);
    await deleteDoc(teacherRef);

    const userRef = doc(db, COLLECTIONS.USERS, teacherId);
    await deleteDoc(userRef);
  },

  async getAllTeachers(): Promise<User[]> {
    // Prefer dedicated teachers collection for performance and completeness
    const teachersSnap = await getDocs(collection(db, COLLECTIONS.TEACHERS));
    let teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
    if (teachers.length > 0) {
      // Ensure role is set for UI filters
      teachers = teachers.map(t => ({ ...t, role: (t as any).role || 'teacher' } as User));
      // Sort by name if available
      teachers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return teachers;
    }

    // Fallback to users collection with role filter
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('role', 'in', ['teacher', 'hod']), orderBy('name'));
    const usersSnap = await getDocs(q);
    return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
  },

  // Bulk import teachers (writes to teachers and users collections)
  async bulkImportTeachers(teachers: User[]): Promise<void> {
    const batch = writeBatch(db);
    const now = serverTimestamp();
    for (const teacher of teachers) {
      const teacherId = teacher.id || (teacher.email || `teacher_${Date.now()}`);
      const base = {
        ...teacher,
        id: teacherId,
        role: 'teacher',
        accessLevel: teacher.accessLevel || 'approver',
        isActive: teacher.isActive !== false,
        updatedAt: now,
        createdAt: now
      } as any;
      const tRef = doc(db, COLLECTIONS.TEACHERS, teacherId);
      batch.set(tRef, base, { merge: true });
      const uRef = doc(db, COLLECTIONS.USERS, teacherId);
      batch.set(uRef, base, { merge: true });
    }
    await batch.commit();
  },


  // Update user (flat structure)
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Delete user (flat structure)
  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);
  },

  // Get students by year, semester, and division (flat structure)
  async getStudentsByYearSemDiv(year: string, sem: string, div: string): Promise<User[]> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(
      usersRef, 
      where('role', '==', 'student'),
      where('year', '==', year),
      where('sem', '==', sem),
      where('div', '==', div),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  // Get students by batch, department, year, semester, and division (from batch structure)
  async getStudentsByBatchDeptYearSemDiv(
    batch: string, 
    department: string, 
    year: string, 
    sem: string, 
    div: string
  ): Promise<User[]> {
    try {
      const batchPath = buildBatchPath.student(batch, department, year, sem, div);
      const studentsRef = collection(db, batchPath);
      const querySnapshot = await getDocs(studentsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('[userService] Error getting students from batch structure:', error);
      return [];
    }
  },

  // Get all students (flat structure)
  async getAllStudents(): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      
      // Try query with orderBy first, but fall back to just where clause if index doesn't exist
      let querySnapshot;
      try {
        const q = query(usersRef, where('role', '==', 'student'), orderBy('name'));
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        // If orderBy fails (likely missing index), try without orderBy
        console.log('[userService.getAllStudents] OrderBy query failed, trying without orderBy:', orderByError.message);
        const q = query(usersRef, where('role', '==', 'student'));
        querySnapshot = await getDocs(q);
        
        // Sort manually in memory
        const students = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        return students.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error: any) {
      console.error('[userService.getAllStudents] Error fetching students:', error);
      throw error;
    }
  },

  // Check if student exists by email (flat structure)
  async checkStudentExists(email: string): Promise<boolean> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('email', '==', email), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  // Check if student exists by roll number (flat structure)
  async checkStudentExistsByRollNumber(rollNumber: string): Promise<boolean> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('rollNumber', '==', rollNumber), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  // Validate student credentials (email and phone number)
  async validateStudentCredentials(email: string, phoneNumber: string): Promise<User | null> {
    console.log(`🔍 Searching for student with email: ${email}`);
    
    try {
      // Create all queries in parallel for organized collections
      const years = ['2', '3', '4']; // Common engineering years
      const sems = ['3', '5', '7']; // Common semesters
      const divs = ['A', 'B', 'C']; // Common divisions
      
      // Generate all possible collection paths
      const collectionPaths: string[] = [];
      for (const year of years) {
        for (const sem of sems) {
          for (const div of divs) {
            collectionPaths.push(`students/${year}/sems/${sem}/divs/${div}/students`);
          }
        }
      }
      
      // Create all queries in parallel using Promise.all - much faster!
      const queryPromises = collectionPaths.map(async (collectionPath) => {
        try {
          const studentsRef = collection(db, collectionPath);
          const q = query(studentsRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log(`✅ Student found in organized collection: ${collectionPath}`);
            const student = querySnapshot.docs[0].data() as User;
            
            // Check if phone number matches (with or without country code)
            const studentPhone = student.phone || '';
            
            // Only proceed if student has a phone number
            if (!studentPhone) {
              console.log(`❌ Student ${student.email} has no phone number`);
              return null;
            }
            
            const normalizedStudentPhone = studentPhone.toString().replace(/\D/g, ''); // Remove non-digits
            const normalizedInputPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
            
            console.log(`📱 Phone comparison: ${normalizedStudentPhone} vs ${normalizedInputPhone}`);
            
            // Check if phone numbers match (allowing for different formats)
            if (normalizedStudentPhone === normalizedInputPhone || 
                studentPhone.toString() === phoneNumber ||
                studentPhone.toString().endsWith(phoneNumber) ||
                phoneNumber.endsWith(normalizedStudentPhone.slice(-10))) {
              console.log(`✅ Phone number match found for student: ${student.name}`);
              const { id: _ignoredId, ...studentRest } = student as any;
              return { id: querySnapshot.docs[0].id, ...studentRest };
            }
            
            console.log(`❌ Phone number mismatch for student: ${student.name}`);
            return null;
          }
          return null;
        } catch (error) {
          console.log(`⚠️ Error searching in ${collectionPath}:`, error);
          return null; // Return null instead of continuing
        }
      });
      
      // Execute all queries in parallel using Promise.all
      const results = await Promise.all(queryPromises);
      
      // Find the first valid result
      const validResult = results.find(result => result !== null);
      if (validResult) {
        return validResult;
      }
      
      console.log(`❌ Student not found in organized collections`);
      
      // Fallback: Search in flat users collection
      console.log(`🔍 Checking flat users collection...`);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const flatQuery = query(usersRef, where('email', '==', email), where('role', '==', 'student'));
      const flatSnapshot = await getDocs(flatQuery);
      
      if (!flatSnapshot.empty) {
        console.log(`✅ Student found in flat collection`);
        const student = flatSnapshot.docs[0].data() as User;
        
        // Check if phone number matches (with or without country code)
        const studentPhone = student.phone || '';
        
        // Only proceed if student has a phone number
        if (!studentPhone) {
          console.log(`❌ Student ${student.email} has no phone number`);
          return null;
        }
        
        const normalizedStudentPhone = studentPhone.toString().replace(/\D/g, ''); // Remove non-digits
        const normalizedInputPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
        
        // Check if phone numbers match (allowing for different formats)
        if (normalizedStudentPhone === normalizedInputPhone || 
            studentPhone.toString() === phoneNumber ||
            studentPhone.toString().endsWith(phoneNumber) ||
            phoneNumber.endsWith(normalizedStudentPhone.slice(-10))) {
          const { id: _ignoredFallbackId, ...studentRest } = student as any;
          return { id: flatSnapshot.docs[0].id, ...studentRest };
        }
        
        console.log(`❌ Phone number doesn't match for student: ${student.name}`);
        return null;
      }
      
      console.log(`❌ Student not found in flat collection either`);
      return null;
    } catch (error) {
      console.error('❌ Error in validateStudentCredentials:', error);
      return null;
    }
  },

  // Validate teacher credentials (email and phone number)
  async validateTeacherCredentials(email: string, phoneNumber: string): Promise<User | null> {
    console.log(`🔍 Searching for teacher with email: ${email}, phone: ${phoneNumber}`);
    
    try {
      // Clean the email to remove any trailing spaces
      const cleanEmail = email.trim();
      console.log(`🔍 Cleaned email: "${cleanEmail}"`);
      
      // Debug: List all users in the collection to help identify the issue
      console.log(`🔍 Debug: Listing all users in users collection...`);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const allUsersQuery = query(usersRef, where('role', 'in', ['teacher', 'hod']));
      const allUsersSnap = await getDocs(allUsersQuery);
      console.log(`📊 Found ${allUsersSnap.size} teachers/HODs in users collection:`);
      allUsersSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.email} (role: ${data.role})`);
      });
      
      // PRIMARY: Check users collection first (as per requirement)
      console.log(`🔍 Step 1: Checking users collection for teacher...`);
      
      // First try direct document access by email as ID
      const userDocRef = doc(usersRef, cleanEmail);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log(`👤 Found user by document ID:`, {
          id: userDocSnap.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          phone: userData.phone
        });
        
        if (userData.role === 'teacher' || userData.role === 'hod') {
          console.log(`✅ User has teacher/HOD role, validating phone number...`);
          
          // Validate phone number
          const teacherPhone = userData.phone || '';
          console.log(`📞 Teacher phone: "${teacherPhone}", Input phone: "${phoneNumber}"`);
          
          if (!teacherPhone) {
            console.log(`❌ Teacher has no phone number`);
            return null;
          }
          
          const normalizedTeacherPhone = teacherPhone.replace(/\D/g, '');
          const normalizedInputPhone = phoneNumber.replace(/\D/g, '');
          
          console.log(`📞 Normalized teacher phone: "${normalizedTeacherPhone}", Normalized input phone: "${normalizedInputPhone}"`);
          
          if (
            normalizedTeacherPhone === normalizedInputPhone ||
            teacherPhone === phoneNumber ||
            teacherPhone.endsWith(phoneNumber) ||
            phoneNumber.endsWith(normalizedTeacherPhone.slice(-10))
          ) {
            console.log(`✅ Teacher phone number matches! Authentication successful.`);
            const { id: _ignoredTId, ...teacherRest } = userData as any;
            return { id: userDocSnap.id, ...teacherRest };
          } else {
            console.log(`❌ Teacher phone number does not match`);
            return null;
          }
        } else {
          console.log(`❌ User found but role is "${userData.role}", not "teacher" or "hod"`);
          return null;
        }
      } else {
        console.log(`❌ No document found with ID: ${cleanEmail}`);
        
        // Fallback: Search by email field using query
        console.log(`🔍 Fallback: Searching by email field in users collection...`);
        const emailQuery = query(usersRef, where('email', '==', cleanEmail), where('role', 'in', ['teacher', 'hod']));
        const emailQuerySnap = await getDocs(emailQuery);
        
        console.log(`📊 Email field query result: ${emailQuerySnap.size} documents found`);
        
        if (!emailQuerySnap.empty) {
          const doc = emailQuerySnap.docs[0];
          const userData = doc.data();
          console.log(`👤 Found user by email field:`, {
            id: doc.id,
            email: userData.email,
            role: userData.role,
            name: userData.name,
            phone: userData.phone
          });
          
          if (userData.role === 'teacher' || userData.role === 'hod') {
            console.log(`✅ User has teacher/HOD role, validating phone number...`);
            
            // Validate phone number
            const teacherPhone = userData.phone || '';
            console.log(`📞 Teacher phone: "${teacherPhone}", Input phone: "${phoneNumber}"`);
            
    if (!teacherPhone) {
              console.log(`❌ Teacher has no phone number`);
      return null;
    }
    
    const normalizedTeacherPhone = teacherPhone.replace(/\D/g, '');
    const normalizedInputPhone = phoneNumber.replace(/\D/g, '');
            
            console.log(`📞 Normalized teacher phone: "${normalizedTeacherPhone}", Normalized input phone: "${normalizedInputPhone}"`);

    if (
      normalizedTeacherPhone === normalizedInputPhone ||
      teacherPhone === phoneNumber ||
      teacherPhone.endsWith(phoneNumber) ||
      phoneNumber.endsWith(normalizedTeacherPhone.slice(-10))
    ) {
              console.log(`✅ Teacher phone number matches! Authentication successful.`);
              const { id: _ignoredTId, ...teacherRest } = userData as any;
              return { id: doc.id, ...teacherRest };
            } else {
              console.log(`❌ Teacher phone number does not match`);
              return null;
            }
          } else {
            console.log(`❌ User found but role is "${userData.role}", not "teacher" or "hod"`);
    return null;
          }
        } else {
          console.log(`❌ No teacher/HOD found with email: ${cleanEmail}`);
          
          // Final fallback: Search through all teachers/HODs we found earlier
          console.log(`🔍 Final fallback: Searching through known teachers/HODs...`);
          const allTeachersQuery = query(usersRef, where('role', 'in', ['teacher', 'hod']));
          const allTeachersSnap = await getDocs(allTeachersQuery);
          
          console.log(`📊 All teachers/HODs query result: ${allTeachersSnap.size} documents found`);
          
          for (const doc of allTeachersSnap.docs) {
            const userData = doc.data();
            console.log(`🔍 Checking teacher/HOD: ${doc.id} - email: "${userData.email}"`);
            
            // Check if email matches (with trimming)
            const docEmail = (userData.email || '').trim();
            if (docEmail === cleanEmail) {
              console.log(`✅ Found matching teacher/HOD by email comparison:`, {
                id: doc.id,
                email: userData.email,
                role: userData.role,
                name: userData.name,
                phone: userData.phone
              });
              
              if (userData.role === 'teacher' || userData.role === 'hod') {
                console.log(`✅ User has teacher/HOD role, validating phone number...`);
                
                // Validate phone number
                const teacherPhone = userData.phone || '';
                console.log(`📞 Teacher phone: "${teacherPhone}", Input phone: "${phoneNumber}"`);
                
                if (!teacherPhone) {
                  console.log(`❌ Teacher has no phone number`);
                  continue;
                }
                
                const normalizedTeacherPhone = teacherPhone.replace(/\D/g, '');
                const normalizedInputPhone = phoneNumber.replace(/\D/g, '');
                
                console.log(`📞 Normalized teacher phone: "${normalizedTeacherPhone}", Normalized input phone: "${normalizedInputPhone}"`);
                
                if (
                  normalizedTeacherPhone === normalizedInputPhone ||
                  teacherPhone === phoneNumber ||
                  teacherPhone.endsWith(phoneNumber) ||
                  phoneNumber.endsWith(normalizedTeacherPhone.slice(-10))
                ) {
                  console.log(`✅ Teacher phone number matches! Authentication successful.`);
                  const { id: _ignoredTId, ...teacherRest } = userData as any;
                  return { id: doc.id, ...teacherRest };
                } else {
                  console.log(`❌ Teacher phone number does not match for ${doc.id}`);
                }
              } else {
                console.log(`❌ User found but role is "${userData.role}", not "teacher" or "hod"`);
              }
            }
          }
          
          console.log(`❌ No matching teacher/HOD found after checking all teachers/HODs`);
        }
      }
      
      // FALLBACK: Check teachers collection if not found in users
      console.log(`🔍 Step 2: Checking teachers collection as fallback...`);
      const teachersRef = collection(db, COLLECTIONS.TEACHERS);
      const teacherDocRef = doc(teachersRef, cleanEmail); // Use cleaned email as document ID
      const teacherDocSnap = await getDoc(teacherDocRef);
      
      if (teacherDocSnap.exists()) {
        const teacherData = teacherDocSnap.data();
        console.log(`✅ Found teacher in teachers collection by document ID:`, {
          id: teacherDocSnap.id,
          email: teacherData.email,
          role: teacherData.role,
          name: teacherData.name,
          phone: teacherData.phone
        });
        
        // Validate phone number
        const teacherPhone = teacherData.phone || '';
        console.log(`📞 Teacher phone: "${teacherPhone}", Input phone: "${phoneNumber}"`);
        
        if (!teacherPhone) {
          console.log(`❌ Teacher has no phone number`);
          return null;
        }
        
        const normalizedTeacherPhone = teacherPhone.replace(/\D/g, '');
        const normalizedInputPhone = phoneNumber.replace(/\D/g, '');
        
        console.log(`📞 Normalized teacher phone: "${normalizedTeacherPhone}", Normalized input phone: "${normalizedInputPhone}"`);
        
        if (
          normalizedTeacherPhone === normalizedInputPhone ||
          teacherPhone === phoneNumber ||
          teacherPhone.endsWith(phoneNumber) ||
          phoneNumber.endsWith(normalizedTeacherPhone.slice(-10))
        ) {
          console.log(`✅ Teacher phone number matches! Authentication successful.`);
          const { id: _ignoredTId, ...teacherRest } = teacherData as any;
          return { id: teacherDocSnap.id, ...teacherRest };
        } else {
          console.log(`❌ Teacher phone number does not match`);
          return null;
        }
      }
      
      console.log(`❌ Teacher not found in either collection: ${cleanEmail}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error in validateTeacherCredentials:`, error);
      return null;
    }
  },

  // Validate non-teaching staff credentials (email and phone number)
  async validateNonTeachingCredentials(email: string, phoneNumber: string): Promise<User | null> {
    console.log(`🔍 Searching for non-teaching staff with email: ${email}, phone: ${phoneNumber}`);
    
    try {
      // Clean the email to remove any trailing spaces
      const cleanEmail = email.trim();
      console.log(`🔍 Cleaned email: "${cleanEmail}"`);
      
      // Check users collection for non-teaching staff
      console.log(`🔍 Checking users collection for non-teaching staff...`);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef, 
        where('email', '==', cleanEmail), 
        where('role', '==', 'non-teaching')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ Non-teaching staff not found in users collection: ${cleanEmail}`);
        return null;
      }
      
      const nonTeachingStaff = querySnapshot.docs[0].data() as User;
      console.log(`👤 Found non-teaching staff:`, {
        id: querySnapshot.docs[0].id,
        name: nonTeachingStaff.name,
        email: nonTeachingStaff.email,
        role: nonTeachingStaff.role,
        subRole: nonTeachingStaff.subRole,
        phone: nonTeachingStaff.phone
      });
      
      // Check if phone number matches (with or without country code)
      const staffPhone = nonTeachingStaff.phone || '';
      
      // Only proceed if staff has a phone number
      if (!staffPhone) {
        console.log(`❌ Non-teaching staff ${nonTeachingStaff.email} has no phone number`);
        return null;
      }
      
      const normalizedStaffPhone = staffPhone.toString().replace(/\D/g, ''); // Remove non-digits
      const normalizedInputPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      
      console.log(`📱 Phone comparison: ${normalizedStaffPhone} vs ${normalizedInputPhone}`);
      
      // Check if phone numbers match (allowing for different formats)
      if (normalizedStaffPhone === normalizedInputPhone || 
          staffPhone.toString() === phoneNumber ||
          staffPhone.toString().endsWith(phoneNumber) ||
          phoneNumber.endsWith(normalizedStaffPhone.slice(-10))) {
        console.log(`✅ Phone number match found for non-teaching staff: ${nonTeachingStaff.name}`);
        const { id: _ignoredId, ...staffRest } = nonTeachingStaff as any;
        return { id: querySnapshot.docs[0].id, ...staffRest };
      } else {
        console.log(`❌ Non-teaching staff phone number does not match`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error in validateNonTeachingCredentials:`, error);
      return null;
    }
  },

  // Bulk import students
  async bulkImportStudents(students: User[]): Promise<void> {
    const batch = writeBatch(db);
    
    for (const student of students) {
      const userRef = doc(db, COLLECTIONS.USERS, student.id);
      batch.set(userRef, {
        ...student,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  },

  // DEPRECATED: Create organized student collections by year, semester, division
  // This function is deprecated. Use createUser() which automatically creates students in the batch structure.
  async createOrganizedStudentCollection(student: User): Promise<void> {
    if (!student.year || !student.sem || !student.div || !student.rollNumber) {
      throw new Error('Missing year, sem, div, or rollNumber for organized collection path');
    }
    if (student.rollNumber.includes('/')) {
      throw new Error('rollNumber cannot contain slashes');
    }
    const collectionPath = `students/${student.year}/sems/${student.sem}/divs/${student.div}/students`;
    const studentRef = doc(db, collectionPath, student.rollNumber);
    await setDoc(studentRef, {
      ...student,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  },

  // DEPRECATED: Get students from organized collection
  // This function is deprecated. Use getStudentsByYearSemDiv() which queries the main users collection.
  async getStudentsFromOrganizedCollection(year: string, sem: string, div: string): Promise<User[]> {
    const collectionPath = `students/${year}/sems/${sem}/divs/${div}/students`;
    const studentsRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(studentsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  // Get all students from organized collections
  async getAllStudentsFromOrganizedCollections(): Promise<User[]> {
    const allStudents: User[] = [];
    
    // Get all years
    const yearsRef = collection(db, 'students');
    const yearsSnapshot = await getDocs(yearsRef);
    
    for (const yearDoc of yearsSnapshot.docs) {
      const year = yearDoc.id;
      
      // Get all semesters for this year
      const semsRef = collection(db, `students/${year}`);
      const semsSnapshot = await getDocs(semsRef);
      
      for (const semDoc of semsSnapshot.docs) {
        const sem = semDoc.id;
        
        // Get all divisions for this semester
        const divsRef = collection(db, `students/${year}/${sem}`);
        const divsSnapshot = await getDocs(divsRef);
        
        for (const divDoc of divsSnapshot.docs) {
          const div = divDoc.id;
          
          // Get all students for this division
          // Use batch structure instead of deprecated organized collection
          const batch = '2025'; // Default batch year
          const department = DEPARTMENTS.CSE; // Default department
          const students = await this.getStudentsByBatchDeptYearSemDiv(batch, department, year, sem, div);
          allStudents.push(...students);
        }
      }
    }
    
    return allStudents;
  },

  // Update organized student collection
  async updateOrganizedStudentCollection(student: User): Promise<void> {
    const collectionPath = `students/${student.year}/sems/${student.sem}/divs/${student.div}/students`;
    const studentRef = doc(db, collectionPath, student.rollNumber || student.id);
    await setDoc(studentRef, {
      ...student,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Delete organized student collection
  async deleteOrganizedStudentCollection(student: User): Promise<void> {
    const collectionPath = `students/${student.year}/sems/${student.sem}/divs/${student.div}/students`;
    const studentRef = doc(db, collectionPath, student.rollNumber || student.id);
    await deleteDoc(studentRef);
  },

  // Bulk delete all students from users collection only (excluding demo students)
  async bulkDeleteAllStudentsFromUsersCollection(
    onProgress?: (deleted: number, total: number, skipped: number) => void
  ): Promise<{ deleted: number; errors: number; skipped: number }> {
    try {
      console.log('[userService] Starting bulk delete of all students from users collection...');
      
      // Import dummy students to identify demo students
      const { dummyStudents } = await import('../utils/dummyData');
      
      // Create sets of demo student identifiers for fast lookup
      const demoStudentIds = new Set(dummyStudents.map(s => s.id));
      const demoStudentEmails = new Set(dummyStudents.map(s => s.email?.toLowerCase()));
      const demoStudentRollNumbers = new Set(dummyStudents.map(s => s.rollNumber));
      
      console.log(`[userService] Loaded ${dummyStudents.length} demo students to protect`);
      
      // Fetch all students from users collection
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      
      const totalStudents = querySnapshot.docs.length;
      console.log(`[userService] Found ${totalStudents} students in collection`);
      
      // Filter out demo students
      const studentsToDelete = querySnapshot.docs.filter(doc => {
        const studentData = doc.data() as User;
        const studentId = doc.id;
        const studentEmail = (studentData.email || '').toLowerCase();
        const studentRollNumber = studentData.rollNumber || '';
        
        // Check if this is a demo student
        const isDemoStudent = 
          demoStudentIds.has(studentId) ||
          demoStudentEmails.has(studentEmail) ||
          demoStudentRollNumbers.has(studentRollNumber) ||
          studentId.startsWith('student_'); // Also protect any student with ID pattern 'student_X'
        
        if (isDemoStudent) {
          console.log(`[userService] Skipping demo student: ${studentId} (${studentData.name})`);
          return false;
        }
        
        return true;
      });
      
      const skipped = totalStudents - studentsToDelete.length;
      console.log(`[userService] Will delete ${studentsToDelete.length} students, skipping ${skipped} demo students`);
      
      if (studentsToDelete.length === 0) {
        console.log('[userService] No students to delete (all are demo students)');
        return { deleted: 0, errors: 0, skipped };
      }

      let deleted = 0;
      let errors = 0;
      const BATCH_SIZE = 500; // Firestore batch limit

      // Process in batches
      for (let i = 0; i < studentsToDelete.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchStudents = studentsToDelete.slice(i, i + BATCH_SIZE);
        
        for (const studentDoc of batchStudents) {
          try {
            const studentRef = doc(db, COLLECTIONS.USERS, studentDoc.id);
            batch.delete(studentRef);
          } catch (error) {
            console.error(`[userService] Error preparing delete for student ${studentDoc.id}:`, error);
            errors++;
          }
        }

        try {
          await batch.commit();
          deleted += batchStudents.length;
          console.log(`[userService] Deleted batch: ${deleted}/${studentsToDelete.length} students`);
          
          if (onProgress) {
            onProgress(deleted, studentsToDelete.length, skipped);
          }

          // Small delay to avoid overwhelming Firestore
          if (i + BATCH_SIZE < studentsToDelete.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`[userService] Error committing batch:`, error);
          errors += batchStudents.length;
        }
      }

      console.log(`[userService] Bulk delete completed: ${deleted} deleted, ${errors} errors, ${skipped} skipped (demo students)`);
      return { deleted, errors, skipped };
    } catch (error) {
      console.error('[userService] Error in bulkDeleteAllStudentsFromUsersCollection:', error);
      throw error;
    }
  },

  // Validate library staff credentials (email and phone number)
  async validateLibraryStaffCredentials(email: string, phoneNumber: string): Promise<User | null> {
    console.log(`🔍 Searching for library staff with email: ${email}, phone: ${phoneNumber}`);
    
    try {
      // Clean the email to remove any trailing spaces
      const cleanEmail = email.trim();
      console.log(`🔍 Cleaned email: "${cleanEmail}"`);
      
      // Check users collection for library staff
      console.log(`🔍 Checking users collection for library staff...`);
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef, 
        where('email', '==', cleanEmail), 
        where('role', '==', 'library-staff')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ Library staff not found in users collection: ${cleanEmail}`);
        return null;
      }
      
      const libraryStaff = querySnapshot.docs[0].data() as User;
      console.log(`👤 Found library staff:`, {
        id: querySnapshot.docs[0].id,
        name: libraryStaff.name,
        email: libraryStaff.email,
        role: libraryStaff.role,
        phone: libraryStaff.phone
      });
      
      // Check if phone number matches (with or without country code)
      const staffPhone = libraryStaff.phone || '';
      
      // Only proceed if staff has a phone number
      if (!staffPhone) {
        console.log(`❌ Library staff ${libraryStaff.email} has no phone number`);
        return null;
      }
      
      const normalizedStaffPhone = staffPhone.toString().replace(/\D/g, ''); // Remove non-digits
      const normalizedInputPhone = phoneNumber.replace(/\D/g, '');
      
      // Check if phone numbers match (allowing for different formats)
      if (normalizedStaffPhone === normalizedInputPhone || 
          staffPhone.toString() === phoneNumber ||
          staffPhone.toString().endsWith(phoneNumber) ||
          phoneNumber.endsWith(normalizedStaffPhone.slice(-10))) {
        
        const { id: _ignoredId, ...staffRest } = libraryStaff as any;
        const result = {
          id: querySnapshot.docs[0].id,
          ...staffRest
        } as User;
        
        console.log(`✅ Library staff credentials validated: ${libraryStaff.name}`);
        return result;
      }
      
      console.log(`❌ Phone number mismatch for library staff: ${libraryStaff.name}`);
      return null;
    } catch (error) {
      console.log(`❌ Error in validateLibraryStaffCredentials:`, error);
      return null;
    }
  },

  // Validate driver credentials
  async validateDriverCredentials(email: string, phoneNumber: string): Promise<User | null> {
    try {
      console.log(`🔍 Validating driver credentials for email: ${email}, phone: ${phoneNumber}`);
      
      // Clean the email to remove any trailing spaces
      const cleanEmail = email.trim();
      console.log(`🔍 Cleaned email: "${cleanEmail}"`);
      
      // Search for driver by email or phone in the main users collection
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('role', '==', 'driver'), where('isActive', '==', true));
      
      const querySnapshot = await getDocs(q);
      console.log(`📊 Found ${querySnapshot.docs.length} driver users`);
      
      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as User;
        console.log(`🔍 Checking driver: ${userData.email} (${userData.phone})`);
        
        // Check if email or phone matches
        if (userData.email === cleanEmail || userData.phone === phoneNumber) {
          console.log(`✅ Driver credentials validated for: ${userData.email}`);
          return userData;
        }
      }
      
      console.log(`❌ No matching driver found for email: ${cleanEmail}, phone: ${phoneNumber}`);
      return null;
    } catch (error) {
      console.log(`❌ Error in validateDriverCredentials:`, error);
      return null;
    }
  }
};

// Leave Request Management
export const leaveService = {
  // Create leave request with automatic department faculty assignment
  async createLeaveRequest(leaveData: Omit<LeaveRequest, 'id'>): Promise<string> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const docData = {
      ...leaveData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending', // Always set
      // currentApprovalLevel and approvalFlow come from leaveData
    };
    console.log('[createLeaveRequest] Writing leave request:', docData);
    const docRef = await addDoc(leaveRef, docData);

    // Auto-detect student department and assign to department faculty
    try {
      const { year, sem, div, department, userId } = (leaveData as any) || {};
      const subject = ((leaveData as any)?.subject as string) || 'General';
      const fromDateStr = (leaveData as any)?.fromDate as string | undefined;

      if (year && sem && div && fromDateStr && userId) {
        const dateObj = new Date(fromDateStr);
        const batch = getBatchYear(year);
        
        // Auto-detect department if not provided
        let dept = department;
        if (!dept) {
          dept = await autoDetectDepartment(userId, 'student');
          console.log(`[createLeaveRequest] Auto-detected department for student ${userId}: ${dept}`);
        } else {
          dept = getDepartment({ department: dept });
        }
        
        // Get department faculty for leave approval
        const departmentFaculty = await getDepartmentFaculty(dept);
        const departmentHead = await getDepartmentHead(dept);
        
        // Prefer a regular faculty (teacher) for first stage; fallback to HOD
        const firstTeacher = departmentFaculty.find(f => !f.isDepartmentHead) || null;
        const assignedTo = firstTeacher || departmentHead || (departmentFaculty.length > 0 ? departmentFaculty[0] : null);
        
        // Update leave request with department and assigned faculty
        await updateDoc(docRef, {
          department: dept,
          assignedTo: assignedTo ? {
            id: assignedTo.id,
            name: assignedTo.name,
            email: assignedTo.email,
            role: assignedTo.isDepartmentHead ? 'HOD' : 'Teacher'
          } : null,
          departmentFaculty: departmentFaculty.map(f => ({
            id: f.id,
            name: f.name,
            email: f.email,
            role: f.isDepartmentHead ? 'HOD' : 'Teacher'
          })),
          approvalFlow: ['Teacher', 'HOD'],
          currentApprovalLevel: 'Teacher',
          updatedAt: serverTimestamp()
        });
        
        // Mirror to department-based structure
        const hierPath = buildBatchPath.leave(batch, dept, year, sem, div, subject, dateObj);
        const hierRef = doc(collection(db, hierPath), docRef.id);
        await setDoc(hierRef, {
          ...docData,
          id: docRef.id,
          batchYear: batch,
          department: dept,
          assignedTo: assignedTo ? {
            id: assignedTo.id,
            name: assignedTo.name,
            email: assignedTo.email,
            role: assignedTo.isDepartmentHead ? 'HOD' : 'Teacher'
          } : null,
          departmentFaculty: departmentFaculty.map(f => ({
            id: f.id,
            name: f.name,
            email: f.email,
            role: f.isDepartmentHead ? 'HOD' : 'Teacher'
          })),
          approvalFlow: ['Teacher', 'HOD'],
          currentApprovalLevel: 'Teacher'
        });

        // Approver inbox mirror for instant teacher visibility
        if (assignedTo?.id) {
          const inboxCol = collection(db, 'leaveApprovals', assignedTo.id, 'inbox');
          const approverRef = doc(inboxCol);
          await setDoc(approverRef, {
            leaveId: docRef.id,
            approverId: assignedTo.id,
            createdAt: serverTimestamp(),
            status: 'pending',
            studentId: (leaveData as any).userId,
            studentName: (leaveData as any).studentName,
            rollNumber: (leaveData as any).rollNumber,
            year,
            sem,
            div,
            department: dept,
            fromDate: (leaveData as any).fromDate,
            toDate: (leaveData as any).toDate,
            reason: (leaveData as any).reason,
            subject
          });
        }
        
        console.log(`[createLeaveRequest] Leave request assigned to department ${dept}, faculty: ${assignedTo?.name || 'No faculty found'}`);
        console.log('[createLeaveRequest] Mirrored leave to department-based path:', hierPath, 'id:', docRef.id);
        
        // Create notification for assigned faculty
        if (assignedTo) {
          await this.createLeaveNotification(assignedTo.id, docRef.id, leaveData, dept);
        }
      } else {
        console.warn('[createLeaveRequest] Skipped department assignment (missing year/sem/div/fromDate or userId)');
      }
    } catch (error) {
      console.error('[createLeaveRequest] Error in department assignment:', error);
      // Do not fail creation if department assignment fails
    }
    
    return docRef.id;
  },

  // Create notification for leave request assignment
  async createLeaveNotification(
    facultyId: string, 
    leaveId: string, 
    leaveData: any, 
    department: string
  ): Promise<void> {
    try {
      const notificationData = {
        userId: facultyId,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `New leave request from ${leaveData.studentName || 'Student'} (${leaveData.rollNumber || leaveData.userId}) in ${getDepartmentDisplayName(department)} department`,
        data: {
          leaveId: leaveId,
          studentId: leaveData.userId,
          studentName: leaveData.studentName,
          rollNumber: leaveData.rollNumber,
          department: department,
          fromDate: leaveData.fromDate,
          toDate: leaveData.toDate,
          reason: leaveData.reason
        },
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      await addDoc(notificationRef, notificationData);
      
      console.log(`[createLeaveNotification] Notification created for faculty ${facultyId} for leave request ${leaveId}`);
    } catch (error) {
      console.error('[createLeaveNotification] Error creating notification:', error);
    }
  },

  // Get leave request by ID
  async getLeaveRequest(requestId: string): Promise<LeaveRequest | null> {
    const leaveRef = doc(db, COLLECTIONS.LEAVE_REQUESTS, requestId);
    const leaveSnap = await getDoc(leaveRef);
    
    if (leaveSnap.exists()) {
      return { id: leaveSnap.id, ...leaveSnap.data() } as LeaveRequest;
    }
    return null;
  },

  // Get leave requests by user
  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
    
    // Sort by createdAt descending (most recent first)
    return requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  },

  // Get leave requests assigned to department faculty
  async getLeaveRequestsByFaculty(facultyId: string): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      where('assignedTo.id', '==', facultyId)
    );
    const querySnapshot = await getDocs(q);
    
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
    
    // Sort by createdAt descending (most recent first)
    return requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  },



  // Get pending leave requests for department faculty
  async getPendingLeaveRequestsByFaculty(facultyId: string): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      where('assignedTo.id', '==', facultyId),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
    
    // Sort by createdAt descending (most recent first)
    return requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  },

  // NEW: Read leaves from hierarchical leave structure for a specific date
  async getClassLeavesByDate(
    year: string,
    sem: string,
    div: string,
    subject: string,
    date: string // YYYY-MM-DD
  ): Promise<LeaveRequest[]> {
    const dateObj = new Date(date);
    const y = dateObj.getFullYear().toString();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const d = dateObj.getDate().toString().padStart(2, '0');
    const path = `${COLLECTIONS.LEAVE}/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${y}/${m}/${d}`;
    try {
      const colRef = collection(db, path);
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
    } catch (err) {
      console.log('[leaveService.getClassLeavesByDate] No data at', path);
      return [];
    }
  },

  // OPTIMIZED: Read leaves from hierarchical leave structure for an entire month using parallel queries
  async getClassLeavesByMonth(
    year: string,
    sem: string,
    div: string,
    subject: string,
    month: string, // MM
    yearForMonth: string, // YYYY
    department?: string // optional department to read from batch/department structure
  ): Promise<LeaveRequest[]> {
    console.log(`🚀 Starting optimized leave fetch for ${year}/${sem}/${div}/${subject}/${yearForMonth}/${month}`);
    
    const results: LeaveRequest[] = [];
    
    // Create all day queries in parallel instead of sequential
    const dayPromises: Promise<LeaveRequest[]>[] = [];
    
    // Get the number of days in the month
    const daysInMonth = new Date(parseInt(yearForMonth), parseInt(month), 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = String(day).padStart(2, '0');
      // If department provided, use batch+department-aware path; otherwise, fall back to legacy path
      let path: string;
      if (department) {
        const dateForDay = new Date(parseInt(yearForMonth), parseInt(month) - 1, day);
        const batch = getBatchYear(year);
        const dept = getDepartment({ department });
        path = buildBatchPath.leave(batch, dept, year, sem, div, subject, dateForDay);
      } else {
        path = `${COLLECTIONS.LEAVE}/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${yearForMonth}/${month}/${d}`;
      }

      const dayPromise = (async () => {
        try {
          const colRef = collection(db, path);
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
          }
          return [];
        } catch (error) {
          // Non-existent day path - skip silently
          console.log(`No leave data for ${path}`);
          return [];
        }
      })();
      
      dayPromises.push(dayPromise);
    }
    
    console.log(`⚡ Executing ${dayPromises.length} parallel day queries...`);
    
    // Execute all day queries in parallel
    const dayResults = await Promise.all(dayPromises);
    
    // Combine all results
    dayResults.forEach(dayLeaves => {
      results.push(...dayLeaves);
    });
    
    console.log(`✅ Found ${results.length} leave records for ${year}/${sem}/${div}/${subject}/${yearForMonth}/${month}`);
    
    return results;
  },

  // Get pending leave requests for approval
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
    
    // Sort by createdAt descending (most recent first)
    return requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  },

  // Update leave request status
  async updateLeaveRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected' | 'returned' | 'pending',
    approvedBy?: string,
    comments?: string
  ): Promise<void> {
    try {
      console.log('[updateLeaveRequestStatus] Starting update for request:', requestId, 'with status:', status, 'approvedBy:', approvedBy);
      
      const leaveRef = doc(db, COLLECTIONS.LEAVE_REQUESTS, requestId);
      console.log('[updateLeaveRequestStatus] Document reference created');
      
      const leaveDoc = await getDoc(leaveRef);
      console.log('[updateLeaveRequestStatus] Document fetched, exists:', leaveDoc.exists());
      
      if (!leaveDoc.exists()) {
        throw new Error('Leave request not found');
      }

      const leaveData = leaveDoc.data() as LeaveRequest;
      console.log('[updateLeaveRequestStatus] Found leave data:', leaveData);
      
      // Authorization: Only current approval level can act
      if (approvedBy) {
        try {
          const approver = await userService.getUser(approvedBy);
          // Map user roles to approval levels
          let approverLevel = '';
          if (approver?.role === 'hod') approverLevel = 'HOD';
          else if (approver?.role === 'teacher') approverLevel = 'Teacher';
          else if (approver?.role === 'registrar') approverLevel = 'Registrar';
          else if (approver?.role === 'principal') approverLevel = 'Principal';
          else if (approver?.role === 'admin') approverLevel = 'Admin';
          
          const currentLevel = leaveData.currentApprovalLevel || 'Teacher';
          const isPending = (leaveData.status || 'pending') === 'pending';
          if (!isPending || !approverLevel || approverLevel !== currentLevel) {
            throw new Error('Not authorized to act on this request at the current stage');
          }
        } catch (authErr) {
          console.error('[updateLeaveRequestStatus] Authorization failed:', authErr);
          throw authErr;
        }
      }
      
      // Multi-step approval logic: HOD → Registrar → Principal → Admin (for teachers)
      // Or Teacher → HOD (for students - default flow)
      let newStatus = status;
      let nextApprovalLevel = leaveData.currentApprovalLevel || 'Teacher';

      const flow = leaveData.approvalFlow && leaveData.approvalFlow.length > 0
        ? leaveData.approvalFlow
        : ['Teacher', 'HOD']; // Default flow for students

      if (status === 'approved') {
        const currentIndex = Math.max(0, flow.indexOf(nextApprovalLevel));
        const isLast = currentIndex >= flow.length - 1;
        if (isLast) {
          newStatus = 'approved'; // Final approval
          nextApprovalLevel = flow[currentIndex]; // Keep final approver level
        } else {
          nextApprovalLevel = flow[currentIndex + 1]; // Move to next approval level
          newStatus = 'pending';
        }
      }

      console.log('[updateLeaveRequestStatus] Will update with:', { newStatus, nextApprovalLevel });

      // Simple update without complex fields
      const updateData: any = {
        status: newStatus,
        currentApprovalLevel: nextApprovalLevel,
        updatedAt: serverTimestamp()
      };

      if (comments) {
        updateData.remarks = comments;
      }

      if (status === 'approved' && approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = serverTimestamp();
      }

      console.log('[updateLeaveRequestStatus] Update data:', updateData);
      
      // Perform the update
      await updateDoc(leaveRef, updateData);
      console.log('[updateLeaveRequestStatus] Leave request updated successfully');

      // Mirror the status update into the hierarchical leave document if present
      try {
        const { year, sem, div } = (leaveData as any) || {};
        const subject = ((leaveData as any)?.subject as string) || 'General';
        const fromDateStr = (leaveData as any)?.fromDate as string | undefined;
        const department = (leaveData as any)?.department as string | undefined;
        if (year && sem && div && fromDateStr) {
          const dateObj = new Date(fromDateStr);
          // Prefer department-based batch path
          if (department) {
            try {
              const batch = getBatchYear(year);
              const deptNorm = getDepartment({ department });
              const deptPath = buildBatchPath.leave(batch, deptNorm, year, sem, div, subject, dateObj);
              const deptRef = doc(collection(db, deptPath), requestId);
              await updateDoc(deptRef, updateData);
              console.log('[updateLeaveRequestStatus] Mirrored update to department leave doc:', deptPath, requestId);
            } catch (deptErr) {
              console.error('[updateLeaveRequestStatus] Department mirror failed, will try legacy path:', deptErr);
              // Fallback to legacy path below
              const y = dateObj.getFullYear().toString();
              const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const d = dateObj.getDate().toString().padStart(2, '0');
              const legacyPath = `${COLLECTIONS.LEAVE}/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${y}/${m}/${d}`;
              const legacyRef = doc(collection(db, legacyPath), requestId);
              await updateDoc(legacyRef, updateData);
              console.log('[updateLeaveRequestStatus] Mirrored update to legacy leave doc:', legacyPath, requestId);
            }
          } else {
            // Only legacy path available
            const y = dateObj.getFullYear().toString();
            const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const d = dateObj.getDate().toString().padStart(2, '0');
            const legacyPath = `${COLLECTIONS.LEAVE}/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${y}/${m}/${d}`;
            const legacyRef = doc(collection(db, legacyPath), requestId);
            await updateDoc(legacyRef, updateData);
            console.log('[updateLeaveRequestStatus] Mirrored update to legacy leave doc:', legacyPath, requestId);
          }
        }
      } catch (mirrorErr) {
        console.error('[updateLeaveRequestStatus] Failed to mirror hierarchical leave update:', mirrorErr);
      }

      // Create notification to student and optionally next approver
      try {
        // Build details object without undefined fields
        const details: any = {
          leaveType: leaveData.leaveType,
          fromDate: leaveData.fromDate,
          toDate: leaveData.toDate,
          reason: leaveData.reason,
          status: newStatus,
          approvedBy: updateData.approvedBy || leaveData.approvedBy,
          approvalLevel: nextApprovalLevel,
          approvalFlow: leaveData.approvalFlow,
          submittedAt: leaveData.submittedAt,
          daysCount: leaveData.daysCount,
        };
        if (updateData.remarks || leaveData.remarks) {
          details.remarks = updateData.remarks || leaveData.remarks;
        }
        const notificationData = {
          userId: leaveData.userId,
          title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your ${leaveData.leaveType} leave request has been ${status}${comments ? `: ${comments}` : ''}`,
          type: (status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning') as 'info' | 'success' | 'warning' | 'error',
          timestamp: new Date().toISOString(),
          category: 'leave' as 'leave' | 'attendance' | 'system' | 'announcement',
          priority: 'high' as 'low' | 'medium' | 'high',
          actionRequired: status === 'returned',
          read: false,
          details
        };

        await notificationService.createNotification(notificationData);

        // If moved to HOD, add to HOD inbox
        if (newStatus === 'pending' && nextApprovalLevel === 'HOD') {
          try {
            const hod = await getDepartmentHead(leaveData.department || DEPARTMENTS.CSE);
            if (hod?.id) {
              const inboxCol = collection(db, 'leaveApprovals', hod.id, 'inbox');
              const approverRef = doc(inboxCol);
              await setDoc(approverRef, {
                leaveId: requestId,
                approverId: hod.id,
                createdAt: serverTimestamp(),
                status: 'pending',
                studentId: (leaveData as any).userId,
                studentName: (leaveData as any).studentName,
                rollNumber: (leaveData as any).rollNumber,
                year: (leaveData as any).year,
                sem: (leaveData as any).sem,
                div: (leaveData as any).div,
                department: leaveData.department,
                fromDate: (leaveData as any).fromDate,
                toDate: (leaveData as any).toDate,
                reason: (leaveData as any).reason,
                subject: (leaveData as any).subject || 'General'
              });
            }
          } catch (err) {
            console.error('[updateLeaveRequestStatus] Failed to enqueue HOD approval:', err);
          }
        }
        console.log('[updateLeaveRequestStatus] Notification created successfully');
      } catch (notificationError) {
        console.error('[updateLeaveRequestStatus] Failed to create notification:', notificationError);
        // Don't throw error for notification failure
      }

    } catch (error) {
      console.error('[updateLeaveRequestStatus] Error details:', error);
      if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          console.error('[updateLeaveRequestStatus] Error message:', (error as any).message);
        }
        if ('code' in error) {
          console.error('[updateLeaveRequestStatus] Error code:', (error as any).code);
        }
      }
      throw error;
    }
  },

  // Get leave requests by department
  async getLeaveRequestsByDepartment(department: string): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      where('department', '==', department),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
  },

  // Get all leave requests (for testing)
  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef, 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LeaveRequest[];
  },

  // Test function to verify Firestore operations
  async testFirestoreConnection(): Promise<boolean> {
    try {
      console.log('[testFirestoreConnection] Testing Firestore connection...');
      const testRef = doc(db, 'test', 'connection');
      await setDoc(testRef, { test: true, timestamp: serverTimestamp() });
      console.log('[testFirestoreConnection] Write test successful');
      await deleteDoc(testRef);
      console.log('[testFirestoreConnection] Delete test successful');
      return true;
    } catch (error) {
      console.error('[testFirestoreConnection] Test failed:', error);
      return false;
    }
  },

  // Get leave requests by approver (for approval panel)
  async getLeaveRequestsByApprover(approverId: string): Promise<LeaveRequest[]> {
    try {
      // First get the user to determine their role
      const user = await userService.getUser(approverId);
      if (!user) {
        console.error('User not found:', approverId);
        return [];
      }

      // Optimized path: approver inbox mirror
      const inboxRef = collection(db, 'leaveApprovals', approverId, 'inbox');
      const inboxSnap = await getDocs(inboxRef);
      const inbox = inboxSnap.docs.map(d => ({ id: (d.data() as any).leaveId })) as { id: string }[];

      if (inbox.length === 0) {
        // Fallback to global pending
        const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
        const q = query(leaveRef, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeaveRequest[];
      }

      const results: LeaveRequest[] = [];
      for (const entry of inbox) {
        const full = await leaveService.getLeaveRequest(entry.id);
        if (full) results.push(full);
      }
      return results.sort((a, b) => (b.createdAt as any)?.seconds - (a.createdAt as any)?.seconds);
    } catch (error) {
      console.error('Error fetching leave requests by approver:', error);
      return [];
    }
  }
};

// Attendance Management
export const attendanceService = {
  // Mark attendance
  async markAttendance(attendanceData: Omit<AttendanceLog, 'id'> & { rollNumber?: string, userName?: string }): Promise<string> {
    // Extract year, sem, div, subject, rollNumber, date from attendanceData
    const { year, sem, div, subject, rollNumber, userId, userName, date } = attendanceData;
    if (!year || !sem || !div || !subject) {
      throw new Error('Missing year, sem, div, or subject for organized attendance path');
    }
    // Ensure date is a string in YYYY-MM-DD format
    let dateString = '';
    if (typeof date === 'string') {
      if ((date as string).length > 10) {
        dateString = (date as string).split('T')[0];
      } else {
        dateString = date as string;
      }
    } else if (date instanceof Date) {
      dateString = date.toISOString().split('T')[0];
    } else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateString = (date as any).toDate().toISOString().split('T')[0];
    }
    const docId = `${rollNumber || userId}_${dateString}`;
    
    // Extract year, month, and date from dateString
    const dateObj = new Date(dateString);
    const attendanceYear = dateObj.getFullYear().toString();
    const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // 01, 02, etc.
    const attendanceDate = dateObj.getDate().toString().padStart(2, '0'); // 01, 02, etc.
    
    const batch = getBatchYear(year);
    const department = (attendanceData as any).department || DEPARTMENTS.CSE;
    const studentYear = (attendanceData as any).studentYear || year; // Use studentYear if available, fallback to year
    const collectionPath = buildBatchPath.attendance(batch, department, studentYear, sem, div, subject, dateObj);
    const attendanceRef = doc(collection(db, collectionPath), docId);
    await setDoc(attendanceRef, {
      ...attendanceData,
      batchYear: batch,
      department: department,
      rollNumber: rollNumber || userId,
      userName: userName || '',
      subject: subject || null,
      id: docId,
      createdAt: serverTimestamp(),
      date: dateString
    });
    return docId;
  },

  // Get attendance by user and date range
  async getAttendanceByUserAndDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AttendanceLog[]> {
    const attendanceRef = collection(db, COLLECTIONS.ATTENDANCE);
    const q = query(
      attendanceRef,
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceLog[];
    
    // Sort by date descending (most recent first)
    return records.sort((a, b) => {
      const aDate = a.date instanceof Date ? a.date : 
                   (a.date as any)?.toDate?.() || new Date(a.date || 0);
      const bDate = b.date instanceof Date ? b.date : 
                   (b.date as any)?.toDate?.() || new Date(b.date || 0);
      return bDate.getTime() - aDate.getTime();
    });
  },

  // Get attendance by user
  async getAttendanceByUser(userId: string): Promise<AttendanceLog[]> {
    const attendanceRef = collection(db, COLLECTIONS.ATTENDANCE);
    const q = query(
      attendanceRef,
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      subject: doc.data().subject || null // Ensure subject is present
    })) as AttendanceLog[];
    return records.sort((a, b) => {
      const aDate = a.date instanceof Date ? a.date : 
                   (a.date as any)?.toDate?.() || new Date(a.date || 0);
      const bDate = b.date instanceof Date ? b.date : 
                   (b.date as any)?.toDate?.() || new Date(b.date || 0);
      return bDate.getTime() - aDate.getTime();
    });
  },

  // Get today's attendance
  async getTodayAttendance(): Promise<AttendanceLog[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendanceRef = collection(db, COLLECTIONS.ATTENDANCE);
    const q = query(
      attendanceRef,
      where('date', '>=', today),
      where('date', '<', tomorrow)
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceLog[];
    
    // Sort by date descending (most recent first)
    return records.sort((a, b) => {
      const aDate = a.date instanceof Date ? a.date : 
                   (a.date as any)?.toDate?.() || new Date(a.date || 0);
      const bDate = b.date instanceof Date ? b.date : 
                   (b.date as any)?.toDate?.() || new Date(b.date || 0);
      return bDate.getTime() - aDate.getTime();
    });
  },

  // ESL Biometric Machine Integration Functions
  async importESLAttendanceData(eslData: any[]): Promise<void> {
    const batch = writeBatch(db);
    
    for (const record of eslData) {
      const attendanceRef = doc(collection(db, COLLECTIONS.ATTENDANCE));
      const attendanceData = {
        id: attendanceRef.id,
        userId: record.rollNumber || record.userId,
        userName: record.employeeName || record.userName,
        date: new Date(record.date),
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        status: this.calculateAttendanceStatus(record.clockIn, record.clockOut),
        workingHours: this.calculateWorkingHours(record.clockIn, record.clockOut),
        deviceId: record.deviceId || 'ESL_Biometric',
        deviceType: 'ESL_Biometric_Thumb_Scanner',
        location: record.location || 'Main Gate',
        createdAt: serverTimestamp(),
        source: 'ESL_Biometric_Machine'
      };
      
      batch.set(attendanceRef, attendanceData);
    }
    
    await batch.commit();
  },

  // Calculate attendance status based on clock in/out times
  calculateAttendanceStatus(clockIn: string, clockOut?: string): string {
    const clockInTime = new Date(`2000-01-01 ${clockIn}`);
    const expectedTime = new Date('2000-01-01 09:00:00'); // Expected arrival time
    
    if (clockInTime > expectedTime) {
      return 'late';
    }
    
    if (!clockOut) {
      return 'present'; // Only clocked in
    }
    
    return 'present';
  },

  // Calculate working hours
  calculateWorkingHours(clockIn: string, clockOut?: string): string {
    if (!clockOut) {
      return '---';
    }
    
    const clockInTime = new Date(`2000-01-01 ${clockIn}`);
    const clockOutTime = new Date(`2000-01-01 ${clockOut}`);
    
    const diffMs = clockOutTime.getTime() - clockInTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  },

  // Sync attendance data from ESL machine
  async syncESLAttendance(deviceId: string, startDate: Date, endDate: Date): Promise<void> {
    // This function would integrate with ESL machine API
    // For now, we'll create a mock implementation
    
    // In real implementation, this would:
    // 1. Connect to ESL machine API
    // 2. Fetch attendance data for the specified period
    // 3. Transform data to our format
    // 4. Import using importESLAttendanceData
  },

  // Get attendance from organized structure by year, sem, div, subject, and date range
  async getOrganizedAttendanceByUserAndDateRange(
    rollNumber: string,
    year: string,
    sem: string,
    div: string,
    subject: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceLog[]> {
    // Path: /attendance/batch/{batch}/DEPARTMENT/year/{studentYear}/sems/{sem}/divs/{div}/subjects/{subject}/{year}/{month}/{day}
    // Use Promise.all for parallel date processing - much faster
    
    // Generate all dates in the range
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create promises for all dates to process in parallel
    const datePromises = dates.map(async (date) => {
      const dateString = date.toISOString().split('T')[0];
      const dateObj = new Date(dateString);
      
      // Use batch structure with student year
      const batch = getBatchYear(year);
      const department = DEPARTMENTS.CSE; // Default department, should be passed as parameter
      const collectionPath = buildBatchPath.attendance(batch, department, year, sem, div, subject, dateObj);
      
      try {
        const recordsRef = collection(db, collectionPath);
        const q = query(recordsRef, where('rollNumber', '==', rollNumber));
        const querySnapshot = await getDocs(q);
        
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceLog[];
        
        return records;
      } catch (error) {
        console.log(`No attendance data for date: ${dateString}`);
        return [];
      }
    });
    
    // Execute all date queries in parallel using Promise.all
    const dateResults = await Promise.all(datePromises);
    
    // Flatten and sort results
    const attendanceRecords = dateResults.flat().sort((a, b) => {
      const aDate = a.date instanceof Date ? a.date : (a.date as any)?.toDate?.() || new Date(a.date || 0);
      const bDate = b.date instanceof Date ? b.date : (b.date as any)?.toDate?.() || new Date(b.date || 0);
      return aDate.getTime() - bDate.getTime();
    });
    
    return attendanceRecords;
  },

  // Get attendance for a specific date from organized structure
  async getAttendanceByDate(
    year: string,
    sem: string,
    div: string,
    subject: string,
    date: string
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month/date
    const dateObj = new Date(date);
    const attendanceYear = dateObj.getFullYear().toString();
    const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const attendanceDate = dateObj.getDate().toString().padStart(2, '0');
    
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
    const recordsRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(recordsRef);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceLog[];
      
      return records;
    } catch (error) {
      console.log(`No attendance data for date: ${date}`);
      return [];
    }
  },

  // Get all attendance for a specific subject on a specific date
  async getAllAttendanceForSubjectAndDate(
    year: string,
    sem: string,
    div: string,
    subject: string,
    date: string
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month/date
    const dateObj = new Date(date);
    const attendanceYear = dateObj.getFullYear().toString();
    const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const attendanceDate = dateObj.getDate().toString().padStart(2, '0');
    
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
    const recordsRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(recordsRef);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceLog[];
      
      return records;
    } catch (error) {
      console.log(`No attendance data for subject ${subject} on date: ${date}`);
      return [];
    }
  },

  // Get all attendance for a specific subject in a specific month
  async getAttendanceByMonth(
    year: string,
    sem: string,
    div: string,
    subject: string,
    month: string, // Format: "01", "02", etc.
    yearForMonth: string // The year for the month (e.g., "2025")
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${yearForMonth}/${month}`;
    const monthRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(monthRef);
      const allRecords: AttendanceLog[] = [];
      
      // Iterate through all date collections in the month
      for (const dateDoc of querySnapshot.docs) {
        const dateCollectionPath = `${collectionPath}/${dateDoc.id}`;
        const dateRef = collection(db, dateCollectionPath);
        const dateQuerySnapshot = await getDocs(dateRef);
        
        const records = dateQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceLog[];
        
        allRecords.push(...records);
      }
      
      return allRecords;
    } catch (error) {
      console.log(`No attendance data for month: ${month}/${yearForMonth}`);
      return [];
    }
  },

  // Get all attendance for a specific subject in a specific year
  async getAttendanceByYear(
    year: string,
    sem: string,
    div: string,
    subject: string,
    yearForYear: string // The year for the year (e.g., "2025")
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${yearForYear}`;
    const yearRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(yearRef);
      const allRecords: AttendanceLog[] = [];
      
      // Iterate through all month collections in the year
      for (const monthDoc of querySnapshot.docs) {
        const monthCollectionPath = `${collectionPath}/${monthDoc.id}`;
        const monthRef = collection(db, monthCollectionPath);
        const monthQuerySnapshot = await getDocs(monthRef);
        
        // Iterate through all date collections in the month
        for (const dateDoc of monthQuerySnapshot.docs) {
          const dateCollectionPath = `${monthCollectionPath}/${dateDoc.id}`;
          const dateRef = collection(db, dateCollectionPath);
          const dateQuerySnapshot = await getDocs(dateRef);
          
          const records = dateQuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AttendanceLog[];
          
          allRecords.push(...records);
        }
      }
      
      return allRecords;
    } catch (error) {
      console.log(`No attendance data for year: ${yearForYear}`);
      return [];
    }
  },

  // Get all attendance for a specific subject in a specific month (optimized for exports)
  async getAttendanceByMonthOptimized(
    year: string,
    sem: string,
    div: string,
    subject: string,
    month: string, // Format: "01", "02", etc.
    yearForMonth: string // The year for the month (e.g., "2025")
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${yearForMonth}/${month}`;
    const monthRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(monthRef);
      const allRecords: AttendanceLog[] = [];
      
      // Iterate through all date collections in the month
      for (const dateDoc of querySnapshot.docs) {
        const dateCollectionPath = `${collectionPath}/${dateDoc.id}`;
        const dateRef = collection(db, dateCollectionPath);
        const dateQuerySnapshot = await getDocs(dateRef);
        
        const records = dateQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceLog[];
        
        allRecords.push(...records);
      }
      
      return allRecords;
    } catch (error) {
      console.log(`No attendance data for month: ${month}/${yearForMonth}`);
      return [];
    }
  },

  // Get all attendance for a specific date (optimized for exports)
  async getAttendanceByDateOptimized(
    year: string,
    sem: string,
    div: string,
    subject: string,
    date: string
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month/date
    const dateObj = new Date(date);
    const attendanceYear = dateObj.getFullYear().toString();
    const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const attendanceDate = dateObj.getDate().toString().padStart(2, '0');
    
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
    const recordsRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(recordsRef);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceLog[];
      
      return records;
    } catch (error) {
      console.log(`No attendance data for date: ${date}`);
      return [];
    }
  },

  // Get all students' attendance for a specific date and subject (for daily reports)
  async getAllStudentsAttendanceForDate(
    year: string,
    sem: string,
    div: string,
    subject: string,
    date: string
  ): Promise<AttendanceLog[]> {
    // Path: attendance/{year}/sems/{sem}/divs/{div}/subjects/{subject}/year/month/date
    const dateObj = new Date(date);
    const attendanceYear = dateObj.getFullYear().toString();
    const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const attendanceDate = dateObj.getDate().toString().padStart(2, '0');
    
    const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
    const recordsRef = collection(db, collectionPath);
    
    try {
      const querySnapshot = await getDocs(recordsRef);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceLog[];
      
      return records;
    } catch (error) {
      console.log(`No attendance data for date: ${date}`);
      return [];
    }
  },

  // Ultra-fast batch export function using optimized batching strategies
  async getBatchAttendanceForExport(
    year: string,
    sem: string,
    div: string,
    subjects: string[],
    startDate: Date,
    endDate: Date,
    studentRollNumbers: string[],
    progressCallback?: (progress: number) => void
  ): Promise<{ [studentRoll: string]: { [subject: string]: AttendanceLog[] } }> {
    // Add safety limits to prevent extremely long exports
    const MAX_STUDENTS = 100;
    const MAX_SUBJECTS = 15;
    const MAX_DAYS = 90; // 3 months max
    
    if (studentRollNumbers.length > MAX_STUDENTS) {
      throw new Error(`Too many students (${studentRollNumbers.length}). Maximum allowed: ${MAX_STUDENTS}`);
    }
    
    if (subjects.length > MAX_SUBJECTS) {
      throw new Error(`Too many subjects (${subjects.length}). Maximum allowed: ${MAX_SUBJECTS}`);
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > MAX_DAYS) {
      throw new Error(`Date range too large (${daysDiff} days). Maximum allowed: ${MAX_DAYS} days`);
    }

    console.log(`🚀 Starting ULTRA-FAST batch export for ${studentRollNumbers.length} students, ${subjects.length} subjects, ${daysDiff} days`);
    
    const result: { [studentRoll: string]: { [subject: string]: AttendanceLog[] } } = {};
    
    // Initialize result structure
    studentRollNumbers.forEach(roll => {
      result[roll] = {};
      subjects.forEach(subject => {
        result[roll][subject] = [];
      });
    });

    // Generate all dates in the range once
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // OPTIMIZATION: Use larger batch queries instead of individual date queries
    // Group dates by month to reduce the number of queries
    const monthGroups: { [key: string]: string[] } = {};
    dates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(dateStr);
    });

    console.log(`📅 Grouped ${dates.length} dates into ${Object.keys(monthGroups).length} month batches`);

    // Create promises for each subject-month combination (much fewer queries)
    const allPromises: Promise<{ subject: string; monthKey: string; records: AttendanceLog[] }>[] = [];

    subjects.forEach(subject => {
      Object.keys(monthGroups).forEach(monthKey => {
        const promise = (async () => {
          try {
            const [yearStr, monthStr] = monthKey.split('-');
            const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${yearStr}/${monthStr}`;
            const monthRef = collection(db, collectionPath);
            
            // Get all documents in this month
            const querySnapshot = await getDocs(monthRef);
            const allRecords: AttendanceLog[] = [];
            
            // Process each date subcollection
            const datePromises = querySnapshot.docs.map(async (dateDoc) => {
              const dateRef = collection(db, `${collectionPath}/${dateDoc.id}`);
              const dateSnapshot = await getDocs(dateRef);
              return dateSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as AttendanceLog[];
            });
            
            const dateResults = await Promise.all(datePromises);
            dateResults.forEach(records => {
              allRecords.push(...records);
            });
            
            return { subject, monthKey, records: allRecords };
          } catch (error) {
            console.log(`No data for ${subject} in ${monthKey}`);
            return { subject, monthKey, records: [] };
          }
        })();
        
        allPromises.push(promise);
      });
    });

    console.log(`⚡ Executing ${allPromises.length} optimized parallel queries (vs ${subjects.length * dates.length} individual queries)`);
    
    // Execute ALL promises simultaneously with progress updates
    const allResults = await Promise.all(allPromises);
    
    if (progressCallback) {
      progressCallback(1.0); // 100% complete
    }
    
    console.log(`✅ All queries completed. Processing results...`);
    
    // Process all results and organize by student
    allResults.forEach(({ subject, monthKey, records }) => {
      records.forEach(record => {
        // Extract roll number from the document ID (format: rollNumber_date)
        const rollNumber = record.id.split('_')[0];
        if (rollNumber && result[rollNumber] && result[rollNumber][subject]) {
          result[rollNumber][subject].push(record);
        }
      });
    });

    console.log(`🎉 ULTRA-FAST batch export completed successfully!`);
    return result;
  },

  // Test function to check student data in organized collections
  async testStudentSearch(email: string): Promise<{ found: boolean; locations: string[]; details?: any }> {
    console.log(`🧪 Testing student search for: ${email}`);
    const locations: string[] = [];
    
    try {
      // Search in all possible year/sem/div combinations
      const years = ['2', '3', '4'];
      const sems = ['3', '5', '7'];
      const divs = ['A', 'B', 'C'];
      
      for (const year of years) {
        for (const sem of sems) {
          for (const div of divs) {
            try {
              const collectionPath = `students/${year}/sems/${sem}/divs/${div}/students`;
              const studentsRef = collection(db, collectionPath);
              const q = query(studentsRef, where('email', '==', email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const location = `${collectionPath}/${querySnapshot.docs[0].id}`;
                locations.push(location);
                console.log(`✅ Found in: ${location}`);
                
                const student = querySnapshot.docs[0].data();
                console.log(`📋 Student details:`, student);
                
                return {
                  found: true,
                  locations: [location],
                  details: student
                };
              }
            } catch (error) {
              console.log(`⚠️ Error searching in ${year}/${sem}/${div}:`, error);
              continue;
            }
          }
        }
      }
      
      console.log(`❌ Student not found in organized collections`);
      return { found: false, locations: [] };
      
    } catch (error) {
      console.error('❌ Error in testStudentSearch:', error);
      return { found: false, locations: [] };
    }
  },

  // NEW: Ultra-fast parallel export for ALL students at once
  async getUltraFastParallelExport(
    year: string,
    sem: string,
    div: string,
    subjects: string[],
    startDate: Date,
    endDate: Date,
    studentRollNumbers: string[]
  ): Promise<{ [studentRoll: string]: { [subject: string]: AttendanceLog[] } }> {
    console.log(`🚀 Starting ULTRA-FAST parallel export for ${studentRollNumbers.length} students, ${subjects.length} subjects`);
    
    const result: { [studentRoll: string]: { [subject: string]: AttendanceLog[] } } = {};
    
    // Initialize result structure
    studentRollNumbers.forEach(roll => {
      result[roll] = {};
      subjects.forEach(subject => {
        result[roll][subject] = [];
      });
    });

    // Generate all dates in the range once
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📅 Processing ${dates.length} dates: ${dates.join(', ')}`);

    // Create ALL promises for parallel execution - ONE PROMISE PER SUBJECT-DATE COMBINATION
    const allPromises: Promise<{ subject: string; date: string; records: AttendanceLog[] }>[] = [];

    // Create promises for each subject-date combination
    subjects.forEach(subject => {
      dates.forEach(dateStr => {
        const promise = (async () => {
          try {
            const dateObj = new Date(dateStr);
            const attendanceYear = dateObj.getFullYear().toString();
            const attendanceMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const attendanceDate = dateObj.getDate().toString().padStart(2, '0');
            
            const collectionPath = `attendance/${year}/sems/${sem}/divs/${div}/subjects/${subject}/${attendanceYear}/${attendanceMonth}/${attendanceDate}`;
            const recordsRef = collection(db, collectionPath);
            
            const querySnapshot = await getDocs(recordsRef);
            const records = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as AttendanceLog[];
            
            return { subject, date: dateStr, records };
          } catch (error) {
            return { subject, date: dateStr, records: [] };
          }
        })();
        
        allPromises.push(promise);
      });
    });

    console.log(`⚡ Executing ${allPromises.length} parallel queries simultaneously...`);
    
    // Execute ALL promises simultaneously - THIS IS THE KEY!
    const allResults = await Promise.all(allPromises);
    
    console.log(`✅ All ${allResults.length} queries completed! Processing results...`);
    
    // Process all results and organize by student - SINGLE PASS
    allResults.forEach(({ subject, date, records }) => {
      records.forEach(record => {
        // Extract roll number from the document ID (format: rollNumber_date)
        const rollNumber = record.id.split('_')[0];
        if (rollNumber && result[rollNumber] && result[rollNumber][subject]) {
          result[rollNumber][subject].push(record);
        }
      });
    });

    console.log(`🎉 ULTRA-FAST parallel export completed successfully!`);
    return result;
  },

  // Edit attendance with reason
  async editAttendance(
    attendanceId: string,
    attendanceData: AttendanceLog,
    newStatus: 'present' | 'absent' | 'late' | 'leave' | 'half-day',
    reason: string,
    editedBy: string,
    editedByName: string
  ): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required to edit attendance');
    }

    const { year, sem, div, subject, date, userId, userName, rollNumber, status: oldStatus } = attendanceData;
    
    if (!year || !sem || !div || !subject || !date) {
      throw new Error('Missing required attendance data');
    }

    // Ensure date is a string in YYYY-MM-DD format
    let dateString = '';
    if (typeof date === 'string') {
      dateString = date.length > 10 ? date.split('T')[0] : date;
    } else if (date instanceof Date) {
      dateString = date.toISOString().split('T')[0];
    } else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateString = (date as any).toDate().toISOString().split('T')[0];
    }

    const dateObj = new Date(dateString);
    const batch = getBatchYear(year);
    const department = (attendanceData as any).department || DEPARTMENTS.CSE;
    const studentYear = (attendanceData as any).studentYear || year;
    
    // Update or create attendance record
    const collectionPath = buildBatchPath.attendance(batch, department, studentYear, sem, div, subject, dateObj);
    
    // Use the standard document ID format: {rollNumber}_{dateString}
    // This ensures consistency with how attendance is marked initially
    const standardDocId = `${rollNumber || userId}_${dateString}`;
    const attendanceRef = doc(collection(db, collectionPath), standardDocId);
    
    // Check if attendance exists
    const attendanceDoc = await getDoc(attendanceRef);
    const wasEdited = attendanceDoc.exists() && (attendanceDoc.data()?.isEdited || false);
    const previousStatus = attendanceDoc.exists() ? (attendanceDoc.data()?.status || oldStatus || 'absent') : (oldStatus || 'absent');
    
    // Use setDoc with merge to create or update
    await setDoc(attendanceRef, {
      ...attendanceData,
      id: standardDocId,
      status: newStatus,
      isEdited: true,
      editedAt: serverTimestamp(),
      editedBy: editedBy,
      updatedAt: serverTimestamp(),
      batchYear: batch,
      department: department,
      rollNumber: rollNumber || userId,
      userName: userName || '',
      date: dateString,
      createdAt: attendanceDoc.exists() ? attendanceDoc.data()?.createdAt : serverTimestamp()
    }, { merge: true });

    // Save edit reason to editAttendance collection
    // Use the actual Firestore document ID (standardDocId) for consistency
    const editReasonData = {
      id: standardDocId,
      attendanceId: standardDocId, // Use the actual document ID
      userId,
      userName: userName || '',
      rollNumber: rollNumber || userId,
      oldStatus: previousStatus,
      newStatus,
      reason: reason.trim(),
      date: dateString,
      subject,
      year,
      sem,
      div,
      editedBy,
      editedByName,
      editedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    // Use a composite key for the edit reason document to ensure uniqueness
    // Format: {rollNumber}_{dateString}_reason to match the attendance document ID pattern
    const editReasonDocId = `${standardDocId}_reason`;
    const editReasonRef = doc(collection(db, 'editAttendance'), editReasonDocId);
    await setDoc(editReasonRef, editReasonData);
  },

  // Get edit reason for attendance
  async getEditReason(attendanceId: string): Promise<any | null> {
    try {
      const editReasonRef = collection(db, 'editAttendance');
      
      // First, try to find by document ID pattern: {attendanceId}_reason
      const editReasonDocId = `${attendanceId}_reason`;
      const editReasonDocRef = doc(editReasonRef, editReasonDocId);
      const editReasonDoc = await getDoc(editReasonDocRef);
      
      if (editReasonDoc.exists()) {
        return {
          id: editReasonDoc.id,
          ...editReasonDoc.data()
        };
      }
      
      // If not found by document ID, try to find by attendanceId field
      let q = query(editReasonRef, where('attendanceId', '==', attendanceId), orderBy('editedAt', 'desc'), limit(1));
      let querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
      }
      
      // If still not found, try to find by document ID that starts with attendanceId (for backward compatibility)
      const allDocs = await getDocs(editReasonRef);
      const matchingDoc = Array.from(allDocs.docs).find(doc => {
        const data = doc.data();
        return data.attendanceId === attendanceId || doc.id.startsWith(attendanceId);
      });
      
      if (matchingDoc) {
        return {
          id: matchingDoc.id,
          ...matchingDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('[attendanceService] Error getting edit reason:', error);
      return null;
    }
  },

  // Get all edit reasons for a student
  async getEditReasonsByStudent(
    rollNumber: string,
    year?: string,
    sem?: string,
    div?: string
  ): Promise<any[]> {
    try {
      const editReasonRef = collection(db, 'editAttendance');
      let q = query(editReasonRef, where('rollNumber', '==', rollNumber), orderBy('editedAt', 'desc'));
      
      if (year) {
        q = query(editReasonRef, where('rollNumber', '==', rollNumber), where('year', '==', year), orderBy('editedAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[attendanceService] Error getting edit reasons:', error);
      return [];
    }
  }
};

// Batch Attendance Management
export const batchAttendanceService = {
  // Mark batch attendance
  async markBatchAttendance(attendanceData: Omit<AttendanceLog, 'id'> & { 
    rollNumber?: string, 
    userName?: string,
    batchName?: string,
    fromRollNo?: string,
    toRollNo?: string,
    isBatchAttendance?: boolean
  }): Promise<string> {
    const { year, sem, div, subject, rollNumber, userId, userName, date, batchName, fromRollNo, toRollNo } = attendanceData;
    
    if (!year || !sem || !div || !subject || !batchName) {
      throw new Error('Missing required fields for batch attendance: year, sem, div, subject, or batchName');
    }

    // Ensure date is a string in YYYY-MM-DD format
    let dateString = '';
    if (typeof date === 'string') {
      if ((date as string).length > 10) {
        dateString = (date as string).split('T')[0];
      } else {
        dateString = date as string;
      }
    } else if (date instanceof Date) {
      dateString = date.toISOString().split('T')[0];
    } else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateString = (date as any).toDate().toISOString().split('T')[0];
    }

    const docId = `${rollNumber || userId}_${dateString}`;
    const dateObj = new Date(dateString);
    
    const batch = getBatchYear(year);
    const department = (attendanceData as any).department || DEPARTMENTS.CSE;
    const studentYear = (attendanceData as any).studentYear || year;
    
    // Build batch attendance collection path
    const collectionPath = buildBatchPath.batchAttendance(batch, department, studentYear, sem, div, batchName, subject, dateObj);
    const attendanceRef = doc(collection(db, collectionPath), docId);
    
    await setDoc(attendanceRef, {
      ...attendanceData,
      batchYear: batch,
      department: department,
      rollNumber: rollNumber || userId,
      userName: userName || '',
      subject: subject || null,
      batchName: batchName,
      fromRollNo: fromRollNo || '',
      toRollNo: toRollNo || '',
      isBatchAttendance: true,
      id: docId,
      createdAt: serverTimestamp(),
      date: dateString
    });
    
    return docId;
  },

  // Get batch attendance by date and batch
  async getBatchAttendanceByDate(
    year: string, 
    sem: string, 
    div: string, 
    batchName: string, 
    subject: string, 
    date: string
  ): Promise<AttendanceLog[]> {
    const dateObj = new Date(date);
    const batch = getBatchYear(year);
    const department = DEPARTMENTS.CSE;
    const studentYear = year;
    
    const collectionPath = buildBatchPath.batchAttendance(batch, department, studentYear, sem, div, batchName, subject, dateObj);
    const attendanceRef = collection(db, collectionPath);
    const snapshot = await getDocs(attendanceRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceLog));
  },

  // Get all batch attendance for a subject and date
  async getAllBatchAttendanceForSubjectAndDate(
    year: string, 
    sem: string, 
    div: string, 
    subject: string, 
    date: string
  ): Promise<{ [batchName: string]: AttendanceLog[] }> {
    const batchNames = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];
    const result: { [batchName: string]: AttendanceLog[] } = {};
    
    await Promise.all(
      batchNames.map(async (batchName) => {
        try {
          const attendance = await this.getBatchAttendanceByDate(year, sem, div, batchName, subject, date);
          if (attendance.length > 0) {
            result[batchName] = attendance;
          }
        } catch (error) {
          // Batch might not exist, continue with other batches
          console.log(`No attendance found for batch ${batchName}`);
        }
      })
    );
    
    return result;
  }
};

// Batch Management Service
export const batchService = {
  // Create a new batch
  async createBatch(batchData: {
    batchName: string;
    fromRollNo: string;
    toRollNo: string;
    year: string;
    sem: string;
    div: string;
    department: string;
  }): Promise<string> {
    const { batchName, fromRollNo, toRollNo, year, sem, div, department } = batchData;
    
    if (!batchName || !fromRollNo || !toRollNo || !year || !sem || !div || !department) {
      throw new Error('Missing required fields for batch creation');
    }

    const batch = getBatchYear(year);
    const batchRef = doc(collection(db, 'batches'));
    
    const batchDoc = {
      id: batchRef.id,
      batchName,
      fromRollNo,
      toRollNo,
      year,
      sem,
      div,
      department,
      batchYear: batch,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(batchRef, batchDoc);
    return batchRef.id;
  },

  // Get batches by filters
  async getBatchesByFilters(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string
  ): Promise<any[]> {
    const batchesRef = collection(db, 'batches');
    const q = query(
      batchesRef,
      where('batchYear', '==', batch),
      where('department', '==', department),
      where('year', '==', year),
      where('sem', '==', sem),
      where('div', '==', div)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get a specific batch
  async getBatch(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string,
    batchName: string
  ): Promise<any | null> {
    const batchesRef = collection(db, 'batches');
    const q = query(
      batchesRef,
      where('batchYear', '==', batch),
      where('department', '==', department),
      where('year', '==', year),
      where('sem', '==', sem),
      where('div', '==', div),
      where('batchName', '==', batchName)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    return null;
  },

  // Update a batch
  async updateBatch(batchId: string, batchData: {
    batchName: string;
    fromRollNo: string;
    toRollNo: string;
    year: string;
    sem: string;
    div: string;
    department: string;
  }): Promise<void> {
    const { fromRollNo, toRollNo } = batchData;
    
    const batchRef = doc(db, 'batches', batchId);
    
    await updateDoc(batchRef, {
      fromRollNo,
      toRollNo,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a batch
  async deleteBatch(batchId: string): Promise<void> {
    const batchRef = doc(db, 'batches', batchId);
    await deleteDoc(batchRef);
  },

  // Get all batches for a division (for dropdown)
  async getBatchesForDivision(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string
  ): Promise<{ batchName: string; fromRollNo: string; toRollNo: string }[]> {
    const batches = await this.getBatchesByFilters(batch, department, year, sem, div);
    return batches.map(b => ({
      batchName: b.batchName,
      fromRollNo: b.fromRollNo,
      toRollNo: b.toRollNo
    }));
  },

  // Get roll numbers for a specific batch
  async getRollNumbersForBatch(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string,
    batchName: string
  ): Promise<number[]> {
    const batchData = await this.getBatch(batch, department, year, sem, div, batchName);
    if (!batchData) {
      return [];
    }
    
    const fromRoll = parseInt(batchData.fromRollNo);
    const toRoll = parseInt(batchData.toRollNo);
    const rollNumbers: number[] = [];
    
    for (let i = fromRoll; i <= toRoll; i++) {
      rollNumbers.push(i);
    }
    
    return rollNumbers;
  }
};

// Notification Management
export const notificationService = {
  // Create notification
  async createNotification(notificationData: Omit<Notification, 'id'>): Promise<string> {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const docRef = await addDoc(notificationRef, {
      ...notificationData,
      createdAt: serverTimestamp(),
      read: false
    });
    return docRef.id;
  },

  // Get notifications by user
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationRef,
      where('userId', '==', userId),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    
    // Sort by createdAt descending (most recent first)
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  },

  // Archive notification
  async archiveNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      archived: true,
      archivedAt: serverTimestamp()
    });
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await deleteDoc(notificationRef);
  },

  // Get unread notifications count
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  // Get all notifications (for testing)
  async getAllNotifications(): Promise<Notification[]> {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationRef,
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    
    // Sort in memory to avoid composite index requirement
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    
    // Sort by createdAt descending (most recent first)
    return notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });
  }
};

// Real-time listeners
export const realtimeService = {
  // Listen to user's leave requests
  onLeaveRequestsChange(userId: string, callback: (requests: LeaveRequest[]) => void) {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef,
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaveRequest[];
      
      // Sort in memory to avoid composite index requirement
      requests.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      callback(requests);
    });
  },

  // Listen to pending leave requests
  onPendingLeaveRequestsChange(callback: (requests: LeaveRequest[]) => void) {
    const leaveRef = collection(db, COLLECTIONS.LEAVE_REQUESTS);
    const q = query(
      leaveRef,
      where('status', '==', 'pending')
    );
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaveRequest[];
      
      // Sort in memory to avoid composite index requirement
      requests.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      callback(requests);
    });
  },

  // Listen to user's notifications
  onNotificationsChange(userId: string, callback: (notifications: Notification[]) => void) {
    const notificationRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationRef,
      where('userId', '==', userId),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort in memory to avoid composite index requirement
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      callback(notifications);
    });
  }
}; 

// Roll Number Change Management Service
export const rollNumberChangeService = {
  // Get roll number change history for a student
  async getRollNumberHistory(userId: string): Promise<any[]> {
    try {
      const mappingRef = doc(db, 'rollNumberMappings', userId);
      const mappingDoc = await getDoc(mappingRef);
      
      if (mappingDoc.exists()) {
        return [mappingDoc.data()];
      }
      
      return [];
    } catch (error) {
      console.error('[rollNumberChangeService] Error getting roll number history:', error);
      return [];
    }
  },

  // Get all students with roll number changes
  async getAllRollNumberChanges(): Promise<any[]> {
    try {
      const mappingsSnapshot = await getDocs(collection(db, 'rollNumberMappings'));
      return mappingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[rollNumberChangeService] Error getting all roll number changes:', error);
      return [];
    }
  },

  // Search records by old roll number
  async searchByOldRollNumber(oldRollNumber: string): Promise<any> {
    try {
      const results: {
        attendance: any[];
        leaves: any[];
        notifications: any[];
        auditLogs: any[];
      } = {
        attendance: [],
        leaves: [],
        notifications: [],
        auditLogs: []
      };

      // Search in main collections
      const attendanceQuery = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('previousRollNumber', '==', oldRollNumber)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      results.attendance = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const leaveQuery = query(
        collection(db, COLLECTIONS.LEAVE_REQUESTS),
        where('previousRollNumber', '==', oldRollNumber)
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      results.leaves = leaveSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const notificationQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('previousRollNumber', '==', oldRollNumber)
      );
      const notificationSnapshot = await getDocs(notificationQuery);
      results.notifications = notificationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const auditQuery = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        where('previousRollNumber', '==', oldRollNumber)
      );
      const auditSnapshot = await getDocs(auditQuery);
      results.auditLogs = auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return results;
    } catch (error) {
      console.error('[rollNumberChangeService] Error searching by old roll number:', error);
      return { attendance: [], leaves: [], notifications: [], auditLogs: [] };
    }
  },

  // Get complete student history including roll number changes
  async getCompleteStudentHistory(userId: string, currentRollNumber: string): Promise<any> {
    try {
      const history: {
        currentRollNumber: string;
        rollNumberChanges: any[];
        attendance: any[];
        leaves: any[];
        notifications: any[];
        auditLogs: any[];
      } = {
        currentRollNumber: currentRollNumber,
        rollNumberChanges: [],
        attendance: [],
        leaves: [],
        notifications: [],
        auditLogs: []
      };

      // Get roll number change history
      history.rollNumberChanges = await this.getRollNumberHistory(userId);

      // Get all attendance records (current and previous roll numbers)
      const attendanceQuery = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('userId', '==', userId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      history.attendance = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all leave records
      const leaveQuery = query(
        collection(db, COLLECTIONS.LEAVE_REQUESTS),
        where('userId', '==', userId)
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      history.leaves = leaveSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all notification records
      const notificationQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId)
      );
      const notificationSnapshot = await getDocs(notificationQuery);
      history.notifications = notificationSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all audit log records
      const auditQuery = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        where('userId', '==', userId)
      );
      const auditSnapshot = await getDocs(auditQuery);
      history.auditLogs = auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return history;
    } catch (error) {
      console.error('[rollNumberChangeService] Error getting complete student history:', error);
      return {
        currentRollNumber: currentRollNumber,
        rollNumberChanges: [],
        attendance: [],
        leaves: [],
        notifications: [],
        auditLogs: []
      };
    }
  },

  // Export student history with roll number changes
  async exportStudentHistoryWithRollNumberChanges(
    userId: string,
    currentRollNumber: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const history = await this.getCompleteStudentHistory(userId, currentRollNumber);
      
      if (!history.attendance.length && !history.leaves.length) {
        return {
          success: false,
          message: 'No historical data found for this student'
        };
      }

      const filename = `student_history_${currentRollNumber}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      return {
        success: true,
        data: history,
        filename: filename
      };
    } catch (error) {
      console.error('[rollNumberChangeService] Error exporting student history:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  }
};

// Result Management
export const resultService = {
  // Create or update a result entry (Teacher/HOD access)
  async upsertResult(result: Omit<ResultRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const {
      id,
      userId,
      userName,
      rollNumber,
      batch,
      department,
      year,
      sem,
      div,
      subject,
      examType,
      marksObtained,
      maxMarks,
      percentage,
      grade,
      remarks
    } = result;

    const studentYear = year; // align with attendance path builder
    const collectionPath = buildBatchPath.result(batch, department, studentYear, sem, div, subject, examType);

    // Document id: rollNumber for hierarchical path
    const docId = id || rollNumber;

    // Prepare data object, filtering out undefined values
    const resultData: any = {
      id: docId,
      userId,
      userName: userName || '',
      rollNumber,
      batch,
      department,
      year,
      sem,
      div,
      subject,
      examType,
      marksObtained,
      maxMarks,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    // Only add fields that have values
    if (typeof percentage === 'number') {
      resultData.percentage = percentage;
    } else if (maxMarks > 0) {
      resultData.percentage = (marksObtained / maxMarks) * 100;
    }

    if (grade && grade.trim()) {
      resultData.grade = grade;
    }

    if (remarks && remarks.trim()) {
      resultData.remarks = remarks;
    }

    // Write to hierarchical path
    const ref = doc(collection(db, collectionPath), docId);
    await setDoc(ref, resultData, { merge: true });

    // Also write to flat collection for easy querying (like attendance system)
    const flatRef = doc(collection(db, COLLECTIONS.RESULTS), `${batch}_${department}_${studentYear}_${sem}_${div}_${subject}_${examType}_${rollNumber}`);
    await setDoc(flatRef, resultData, { merge: true });

    return docId;
  },

  // Get class results by subject and exam type (Teacher/HOD)
  async getClassResults(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string,
    subject: string,
    examType: string
  ): Promise<ResultRecord[]> {
    try {
      const collectionPath = buildBatchPath.result(batch, department, year, sem, div, subject, examType);
      const qSnap = await getDocs(collection(db, collectionPath));
      return qSnap.docs.map(d => ({ id: d.id, ...d.data() } as ResultRecord));
    } catch (err) {
      console.error('Error getting class results:', err);
      return [];
    }
  },

  // Get a student's results across subjects/exams (similar to getAttendanceByUser)
  async getMyResults(userId: string): Promise<ResultRecord[]> {
    try {
      console.log('Getting results for userId:', userId);

      // Read user to get rollNumber fallback
      const userDocRef = doc(db, COLLECTIONS.USERS, userId);
      const userDocSnap = await getDoc(userDocRef);
      const rollNumber = userDocSnap.exists() ? (userDocSnap.data() as any).rollNumber : undefined;
      // Try to guess roll from userId if not present
      const guessedRoll = rollNumber || (userId.match(/\d{2,}/)?.[0] ?? undefined);

      const resultsRef = collection(db, COLLECTIONS.RESULTS);

      // Run both queries in parallel: by userId and by rollNumber (if available)
      const queries: Promise<QuerySnapshot<DocumentData>>[] = [];
      queries.push(getDocs(query(resultsRef, where('userId', '==', userId))));
      if (rollNumber) {
        queries.push(getDocs(query(resultsRef, where('rollNumber', '==', String(rollNumber)))));
      }

      const snaps = await Promise.all(queries);
      const merged: Record<string, ResultRecord> = {};
      snaps.forEach(snap => {
        snap.docs.forEach(d => {
          const rec = { id: d.id, ...(d.data() as any) } as ResultRecord;
          merged[d.id] = rec;
        });
      });

      let records = Object.values(merged);
      console.log('Found results (merged):', records.length);

      // If still empty, backfill from hierarchical path once (like attendance organized lookup)
      if (records.length === 0 && userDocSnap.exists()) {
        const userData = userDocSnap.data() as any;
        const batch = getBatchYear(userData.year || '1st');
        const department = getDepartmentCode(userData.department);
        const year = userData.year || '1st';
        const sem = userData.sem || '1';
        const div = userData.div || 'A';
        const targetIdOrRoll = guessedRoll || userId;
        console.log('Backfill scan:', { batch, department, year, sem, div, targetIdOrRoll });

        // Get subjects first
        const subjects = await subjectService.getSubjectsByDepartment(department, year, sem);
        const examTypes = ['UT1', 'UT2', 'Practical', 'Viva', 'Midterm', 'Endsem'];
        for (const s of subjects) {
          for (const examType of examTypes) {
            try {
              const hierPath = buildBatchPath.result(batch, department, year, sem, div, s.subjectName, examType);
              const marksSnap = await getDocs(collection(db, hierPath));
              for (const d of marksSnap.docs) {
                const data = d.data() as any;
                if (data.userId === userId || data.rollNumber === targetIdOrRoll || d.id === targetIdOrRoll) {
                  const rec = { id: d.id, ...data } as ResultRecord;
                  merged[`${batch}_${department}_${year}_${sem}_${div}_${s.subjectName}_${examType}_${d.id}`] = rec;
                  // Mirror into flat collection for future fast queries
                  const flatId = `${batch}_${department}_${year}_${sem}_${div}_${s.subjectName}_${examType}_${d.id}`;
                  await setDoc(doc(collection(db, COLLECTIONS.RESULTS), flatId), rec, { merge: true });
                }
              }
            } catch {}
          }
        }
        records = Object.values(merged);
        console.log('Backfill found:', records.length);
      }

      // Sort newest updated first if available
      return records.sort((a, b) => {
        const aT = (a.updatedAt as any)?.toDate?.() || new Date(a.updatedAt || 0);
        const bT = (b.updatedAt as any)?.toDate?.() || new Date(b.updatedAt || 0);
        return bT.getTime() - aT.getTime();
      });
    } catch (error) {
      console.error('Error getting user results:', error);
      return [];
    }
  },

  // Get a student's results filtered by subject and exam type
  async getMyResultsBySubjectExam(userId: string, subject: string, examType?: string): Promise<ResultRecord[]> {
    const allResults = await this.getMyResults(userId);
    
    // Filter by subject and exam type
    let filtered = allResults.filter(r => r.subject === subject);
    if (examType) {
      filtered = filtered.filter(r => r.examType === examType);
    }
    
    return filtered;
  },

  // Export results by batch (for teachers/HOD)
  async exportResultsByBatch(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string,
    subject: string,
    examType: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const results = await this.getClassResults(batch, department, year, sem, div, subject, examType);
      
      if (results.length === 0) {
        return {
          success: false,
          message: 'No results found for the specified criteria'
        };
      }

      const exportData = results.map(result => ({
        'Roll Number': result.rollNumber,
        'Student Name': result.userName || '',
        'Subject': result.subject,
        'Exam Type': result.examType,
        'Marks Obtained': result.marksObtained,
        'Max Marks': result.maxMarks,
        'Percentage': typeof result.percentage === 'number' ? `${result.percentage.toFixed(1)}%` : '',
        'Year': result.year,
        'Semester': result.sem,
        'Division': result.div,
        'Batch': result.batch,
        'Department': result.department
      }));

      const filename = `results_${batch}_${department}_${year}_${sem}_${div}_${subject}_${examType}.${format}`;

      return {
        success: true,
        data: exportData,
        filename: filename
      };
    } catch (error) {
      console.error('Error exporting results:', error);
      return {
        success: false,
        message: `Export failed: ${error}`
      };
    }
  },

  // Import results by batch (for teachers/HOD)
  async importResultsByBatch(
    batch: string,
    department: string,
    year: string,
    sem: string,
    div: string,
    resultsData: any[]
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      for (const row of resultsData) {
        try {
          const rollNumber = String(row.rollNumber || row.roll || '').trim();
          if (!rollNumber) {
            errors.push(`Row ${resultsData.indexOf(row) + 1}: Missing roll number`);
            continue;
          }

          const subject = String(row.subject || '').trim();
          if (!subject) {
            errors.push(`Row ${resultsData.indexOf(row) + 1}: Missing subject`);
            continue;
          }

          const examType = String(row.examType || row.exam || '').trim();
          if (!examType) {
            errors.push(`Row ${resultsData.indexOf(row) + 1}: Missing exam type`);
            continue;
          }

          const marksObtained = Number(row.marksObtained || row.obtained || row.marks || 0);
          const maxMarks = Number(row.maxMarks || row.total || row.max || 20);

          if (isNaN(marksObtained) || isNaN(maxMarks) || marksObtained < 0 || maxMarks <= 0) {
            errors.push(`Row ${resultsData.indexOf(row) + 1}: Invalid marks (${marksObtained}/${maxMarks})`);
            continue;
          }

          await this.upsertResult({
            userId: rollNumber, // fallback if student not found
            userName: String(row.name || row.studentName || ''),
            rollNumber,
            batch,
            department,
            year,
            sem,
            div,
            subject,
            examType,
            marksObtained,
            maxMarks
          });

          imported++;
        } catch (error) {
          errors.push(`Row ${resultsData.indexOf(row) + 1}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Import failed: ${error}`]
      };
    }
  }
};

// Batch Migration Service with Department Support
export const batchMigrationService = {
  // Migrate existing data to batch 2025 with department structure
  async migrateToBatch2025(): Promise<{ success: boolean; message?: string; details?: any }> {
    try {
      console.log('[batchMigrationService] Starting migration to batch 2025 with department structure...');
      
      const results = {
        students: { migrated: 0, errors: 0 },
        teachers: { migrated: 0, errors: 0 },
        attendance: { migrated: 0, errors: 0 },
        leaves: { migrated: 0, errors: 0 }
      };

      // Migrate students
      try {
        const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        for (const docSnapshot of studentsSnapshot.docs) {
          const student = docSnapshot.data();
          if (student.role === 'student') {
            try {
              if (student.year && student.sem && student.div) {
                // Use batch 2025 for existing data
                const department = getDepartment(student);
                const batchPath = buildBatchPath.student('2025', department, student.year, student.sem, student.div);
                const studentRef = doc(db, batchPath, student.rollNumber || student.id);
                await setDoc(studentRef, {
                  ...student,
                  batchYear: '2025',
                  department: department,
                  migratedFrom: 'legacy',
                  migratedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  createdAt: serverTimestamp()
                }, { merge: true });
                results.students.migrated++;
              }
            } catch (error) {
              console.error('[batchMigrationService] Error migrating student:', student.id, error);
              results.students.errors++;
            }
          }
        }
      } catch (error) {
        console.error('[batchMigrationService] Error migrating students:', error);
      }

      // Migrate teachers
      try {
        const teachersSnapshot = await getDocs(collection(db, COLLECTIONS.TEACHERS));
        for (const docSnapshot of teachersSnapshot.docs) {
          const teacher = docSnapshot.data();
          try {
            if (teacher.year && teacher.sem && teacher.div) {
              const department = getDepartment(teacher);
              const batchPath = buildBatchPath.teacher('2025', department, teacher.sem, teacher.div);
              const teacherRef = doc(db, batchPath, teacher.id);
              await setDoc(teacherRef, {
                ...teacher,
                batchYear: '2025',
                department: department,
                migratedFrom: 'legacy',
                migratedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
              }, { merge: true });
              results.teachers.migrated++;
            }
          } catch (error) {
            console.error('[batchMigrationService] Error migrating teacher:', teacher.id, error);
            results.teachers.errors++;
          }
        }
      } catch (error) {
        console.error('[batchMigrationService] Error migrating teachers:', error);
      }

      // Migrate attendance records
      try {
        const attendanceSnapshot = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
        for (const docSnapshot of attendanceSnapshot.docs) {
          const attendance = docSnapshot.data();
          try {
            if (attendance.year && attendance.sem && attendance.div && attendance.subject && attendance.date) {
              const batch = getBatchYear(attendance.year);
              const department = getDepartment(attendance);
              const dateObj = new Date(attendance.date);
              const batchPath = buildBatchPath.attendance(batch, department, attendance.year, attendance.sem, attendance.div, attendance.subject, dateObj);
              const attendanceRef = doc(db, batchPath, attendance.id);
              await setDoc(attendanceRef, {
                ...attendance,
                batchYear: batch,
                department: department,
                migratedFrom: 'legacy',
                migratedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
              }, { merge: true });
              results.attendance.migrated++;
            }
          } catch (error) {
            console.error('[batchMigrationService] Error migrating attendance:', attendance.id, error);
            results.attendance.errors++;
          }
        }
      } catch (error) {
        console.error('[batchMigrationService] Error migrating attendance:', error);
      }

      // Migrate leave requests
      try {
        const leavesSnapshot = await getDocs(collection(db, COLLECTIONS.LEAVE_REQUESTS));
        for (const docSnapshot of leavesSnapshot.docs) {
          const leave = docSnapshot.data();
          try {
            if (leave.year && leave.sem && leave.div && leave.fromDate) {
              const batch = getBatchYear(leave.year);
              const department = getDepartment(leave);
              const dateObj = new Date(leave.fromDate);
              const subject = leave.subject || 'General';
              const batchPath = buildBatchPath.leave(batch, department, leave.year, leave.sem, leave.div, subject, dateObj);
              const leaveRef = doc(db, batchPath, leave.id);
              await setDoc(leaveRef, {
                ...leave,
                batchYear: batch,
                department: department,
                migratedFrom: 'legacy',
                migratedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
              }, { merge: true });
              results.leaves.migrated++;
            }
          } catch (error) {
            console.error('[batchMigrationService] Error migrating leave:', leave.id, error);
            results.leaves.errors++;
          }
        }
      } catch (error) {
        console.error('[batchMigrationService] Error migrating leaves:', error);
      }

      console.log('[batchMigrationService] Migration completed:', results);
      return {
        success: true,
        message: 'Migration to batch 2025 with department structure completed successfully',
        details: results
      };
    } catch (error) {
      console.error('[batchMigrationService] Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${(error as any).message}`
      };
    }
  },

  // Check migration status
  async getMigrationStatus(): Promise<{ migrated: boolean; counts?: any }> {
    try {
      // Check if any batch 2025 data exists
      const batch2025Students = await getDocs(collection(db, buildBatchPath.student('2025', DEPARTMENTS.CSE, '2nd', '3', 'A')));
      const batch2025Teachers = await getDocs(collection(db, buildBatchPath.teacher('2025', DEPARTMENTS.CSE, '3', 'A')));
      
      if (!batch2025Students.empty || !batch2025Teachers.empty) {
        return {
          migrated: true,
          counts: {
            students: batch2025Students.size,
            teachers: batch2025Teachers.size
          }
        };
      }
      
      return { migrated: false };
    } catch (error) {
      console.error('[batchMigrationService] Error checking migration status:', error);
      return { migrated: false };
    }
  }
};

// Dummy Data Population Service
export const dummyDataService = {
  // Populate dummy students to Firestore in batch structure
  async populateDummyStudentsToFirestore(batch: string = '2026'): Promise<{ success: boolean; added: number; errors: string[] }> {
    try {
      console.log(`[dummyDataService] Starting to populate dummy students to batch ${batch}...`);
      const errors: string[] = [];
      let added = 0;
      
      // Import dummy students
      const { dummyStudents } = await import('../utils/dummyData');
      
      // Group students by batch path to optimize writes
      const studentsByPath: { [path: string]: User[] } = {};
      
      for (const student of dummyStudents) {
        if (!student.year || !student.sem || !student.div || !student.rollNumber) {
          errors.push(`Skipping student ${student.id}: missing year, sem, div, or rollNumber`);
          continue;
        }
        
        try {
          // Get department code from department name
          const deptCode = getDepartmentCode(student.department);
          
          // Build batch path: students/batch/{batch}/{department}/year/{year}/sems/{sem}/divs/{div}/students
          const batchPath = buildBatchPath.student(batch, deptCode, student.year, student.sem, student.div);
          
          // Group by path for batch writes
          if (!studentsByPath[batchPath]) {
            studentsByPath[batchPath] = [];
          }
          studentsByPath[batchPath].push(student);
        } catch (error) {
          errors.push(`Error processing student ${student.id}: ${(error as any).message}`);
        }
      }
      
      // Write students in batches (Firestore batch limit is 500)
      for (const [path, students] of Object.entries(studentsByPath)) {
        try {
          let currentBatch = writeBatch(db);
          let batchCount = 0;
          
          for (const student of students) {
            const studentRef = doc(db, path, student.rollNumber || student.id);
            
            // Prepare student data with timestamps
            const studentData: any = {
              ...student,
              batchYear: batch,
              department: student.department,
              updatedAt: serverTimestamp()
            };
            
            // Add createdAt if available
            if (student.createdAt) {
              try {
                studentData.createdAt = Timestamp.fromDate(new Date(student.createdAt));
              } catch {
                studentData.createdAt = serverTimestamp();
              }
            } else {
              studentData.createdAt = serverTimestamp();
            }
            
            // Add lastLogin if available
            if (student.lastLogin) {
              try {
                studentData.lastLogin = Timestamp.fromDate(new Date(student.lastLogin));
              } catch {
                // Skip lastLogin if invalid
              }
            }
            
            currentBatch.set(studentRef, studentData, { merge: true });
            batchCount++;
            
            // Firestore batch limit is 500, commit and start new batch if needed
            if (batchCount >= 500) {
              await currentBatch.commit();
              added += batchCount;
              batchCount = 0;
              currentBatch = writeBatch(db);
            }
          }
          
          // Commit remaining writes
          if (batchCount > 0) {
            await currentBatch.commit();
            added += batchCount;
          }
          
          console.log(`[dummyDataService] Added ${students.length} students to path: ${path}`);
        } catch (error) {
          errors.push(`Error writing students to path ${path}: ${(error as any).message}`);
          console.error(`[dummyDataService] Error writing to ${path}:`, error);
        }
      }
      
      console.log(`[dummyDataService] Populated ${added} dummy students to batch ${batch}`);
      return {
        success: added > 0,
        added,
        errors
      };
    } catch (error) {
      console.error('[dummyDataService] Error populating dummy students:', error);
      return {
        success: false,
        added: 0,
        errors: [`Failed to populate dummy students: ${(error as any).message}`]
      };
    }
  },
  
  // Populate all demo users to users collection
  async populateAllDemoUsersToUsersCollection(): Promise<{ success: boolean; added: number; errors: string[] }> {
    try {
      console.log('[dummyDataService] Starting to populate all demo users to users collection...');
      const errors: string[] = [];
      let added = 0;
      
      // Import all dummy users
      const { 
        dummyStudents, 
        dummyTeachers, 
        dummyAdmins, 
        dummyHODs, 
        dummyNonTeachingStaff, 
        dummyDrivers, 
        dummyVisitors 
      } = await import('../utils/dummyData');
      
      // Combine all users
      const allDemoUsers = [
        ...dummyStudents,
        ...dummyTeachers,
        ...dummyAdmins,
        ...dummyHODs,
        ...dummyNonTeachingStaff,
        ...dummyDrivers,
        ...dummyVisitors
      ];
      
      console.log(`[dummyDataService] Found ${allDemoUsers.length} demo users to add`);
      
      // Process in batches (Firestore batch limit is 500)
      const BATCH_SIZE = 500;
      for (let i = 0; i < allDemoUsers.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchUsers = allDemoUsers.slice(i, i + BATCH_SIZE);
        
        for (const user of batchUsers) {
          try {
            if (!user.id || !user.email) {
              errors.push(`Skipping user: missing id or email`);
              continue;
            }
            
            const userRef = doc(db, COLLECTIONS.USERS, user.id);
            
            // Prepare user data with timestamps
            const userData: any = {
              ...user,
              updatedAt: serverTimestamp()
            };
            
            // Add createdAt if available
            if (user.createdAt) {
              try {
                userData.createdAt = Timestamp.fromDate(new Date(user.createdAt));
              } catch {
                userData.createdAt = serverTimestamp();
              }
            } else {
              userData.createdAt = serverTimestamp();
            }
            
            // Add lastLogin if available
            if (user.lastLogin) {
              try {
                userData.lastLogin = Timestamp.fromDate(new Date(user.lastLogin));
              } catch {
                // Skip lastLogin if invalid
              }
            }
            
            // Add batchYear for students if not present
            if (user.role === 'student' && !userData.batchYear) {
              userData.batchYear = getCurrentBatchYear();
            }
            
            batch.set(userRef, userData, { merge: true });
          } catch (error) {
            errors.push(`Error processing user ${user.id}: ${(error as any).message}`);
          }
        }
        
        try {
          await batch.commit();
          added += batchUsers.length;
          console.log(`[dummyDataService] Added batch: ${added}/${allDemoUsers.length} users`);
          
          // Small delay to avoid overwhelming Firestore
          if (i + BATCH_SIZE < allDemoUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`[dummyDataService] Error committing batch:`, error);
          errors.push(`Error committing batch: ${(error as any).message}`);
        }
      }
      
      console.log(`[dummyDataService] Populated ${added} demo users to users collection`);
      return {
        success: added > 0,
        added,
        errors
      };
    } catch (error) {
      console.error('[dummyDataService] Error populating demo users:', error);
      return {
        success: false,
        added: 0,
        errors: [`Failed to populate demo users: ${(error as any).message}`]
      };
    }
  },
  
  // Populate dummy subjects to Firestore
  async populateDummySubjectsToFirestore(batch: string = '2026'): Promise<{ success: boolean; added: number; errors: string[] }> {
    try {
      console.log(`[dummyDataService] Starting to populate dummy subjects to batch ${batch}...`);
      const errors: string[] = [];
      let added = 0;
      
      // Import dummy subjects
      const { dummySubjects } = await import('../utils/dummyData');
      
      // Group subjects by path
      const subjectsByPath: { [path: string]: Subject[] } = {};
      
      for (const subject of dummySubjects) {
        try {
          const deptCode = getDepartmentCode(subject.department);
          const path = `${COLLECTIONS.SUBJECTS}/${batch}/${deptCode}/year/${subject.year}/sems/${subject.sem}`;
          
          if (!subjectsByPath[path]) {
            subjectsByPath[path] = [];
          }
          subjectsByPath[path].push(subject);
        } catch (error) {
          errors.push(`Error processing subject ${subject.id}: ${(error as any).message}`);
        }
      }
      
      // Write subjects
      for (const [path, subjects] of Object.entries(subjectsByPath)) {
        try {
          for (const subject of subjects) {
            const subjectRef = doc(db, path, subject.id);
            await setDoc(subjectRef, {
              ...subject,
              batch: batch,
              updatedAt: serverTimestamp(),
              createdAt: subject.createdAt ? Timestamp.fromDate(new Date(subject.createdAt)) : serverTimestamp()
            }, { merge: true });
            added++;
          }
          console.log(`[dummyDataService] Added ${subjects.length} subjects to path: ${path}`);
        } catch (error) {
          errors.push(`Error writing subjects to path ${path}: ${(error as any).message}`);
        }
      }
      
      console.log(`[dummyDataService] Populated ${added} dummy subjects to batch ${batch}`);
      return {
        success: added > 0,
        added,
        errors
      };
    } catch (error) {
      console.error('[dummyDataService] Error populating dummy subjects:', error);
      return {
        success: false,
        added: 0,
        errors: [`Failed to populate dummy subjects: ${(error as any).message}`]
      };
    }
  }
};

// Import/Export Service with Department Support
export const importExportService = {
  // Export attendance data by batch and department
  async exportAttendanceByBatch(
    batch: string,
    department: string,
    sem: string,
    div: string,
    subject: string,
    startDate: Date,
    endDate: Date,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const attendanceData: any[] = [];
      
      // Query attendance from department-based structure
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        try {
          const path = buildBatchPath.attendance(batch, department, '2nd', sem, div, subject, currentDate);
          const snapshot = await getDocs(collection(db, path));
          
          snapshot.docs.forEach(doc => {
            attendanceData.push({
              id: doc.id,
              ...doc.data(),
              date: currentDate.toISOString().split('T')[0]
            });
          });
        } catch (error) {
          // Collection might not exist for this date
          console.log(`[importExportService] No attendance data for ${currentDate.toISOString().split('T')[0]}`);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (attendanceData.length === 0) {
        return {
          success: false,
          message: 'No attendance data found for the specified criteria'
        };
      }

      const filename = `attendance_${batch}_${department}_${sem}_${div}_${subject}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      
      return {
        success: true,
        data: attendanceData,
        filename: filename
      };
    } catch (error) {
      console.error('[importExportService] Error exporting attendance:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  },

  // Export leave data by batch and department
  async exportLeavesByBatch(
    batch: string,
    department: string,
    sem: string,
    div: string,
    subject: string,
    startDate: Date,
    endDate: Date,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const leaveData: any[] = [];
      
      // Query leaves from department-based structure
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        try {
          const path = buildBatchPath.leave(batch, department, '2nd', sem, div, subject, currentDate);
          const snapshot = await getDocs(collection(db, path));
          
          snapshot.docs.forEach(doc => {
            leaveData.push({
              id: doc.id,
              ...doc.data(),
              date: currentDate.toISOString().split('T')[0]
            });
          });
        } catch (error) {
          // Collection might not exist for this date
          console.log(`[importExportService] No leave data for ${currentDate.toISOString().split('T')[0]}`);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (leaveData.length === 0) {
        return {
          success: false,
          message: 'No leave data found for the specified criteria'
        };
      }

      const filename = `leaves_${batch}_${department}_${sem}_${div}_${subject}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      
      return {
        success: true,
        data: leaveData,
        filename: filename
      };
    } catch (error) {
      console.error('[importExportService] Error exporting leaves:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  },

  // Export students by batch and department
  async exportStudentsByBatch(
    batch: string,
    department: string,
    sem: string,
    div: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const path = buildBatchPath.student(batch, department, '2nd', sem, div);
      const snapshot = await getDocs(collection(db, path));
      
      if (snapshot.empty) {
        return {
          success: false,
          message: 'No students found for the specified criteria'
        };
      }

      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const filename = `students_${batch}_${department}_${sem}_${div}.${format}`;
      
      return {
        success: true,
        data: students,
        filename: filename
      };
    } catch (error) {
      console.error('[importExportService] Error exporting students:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  },

  // Export comprehensive batch report
  async exportBatchReport(
    batch: string,
    department: string,
    sem: string,
    div: string,
    startDate: Date,
    endDate: Date,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      // Get students
      const studentsResult = await this.exportStudentsByBatch(batch, department, sem, div, format);
      if (!studentsResult.success) {
        return studentsResult;
      }

      // Get attendance
      const attendanceResult = await this.exportAttendanceByBatch(batch, department, sem, div, 'General', startDate, endDate, format);
      
      // Get leaves
      const leavesResult = await this.exportLeavesByBatch(batch, department, sem, div, 'General', startDate, endDate, format);

      const report = {
        summary: {
          batch: batch,
          department: getDepartmentDisplayName(department),
          semester: sem,
          division: div,
          totalStudents: studentsResult.data?.length || 0,
          totalAttendanceRecords: attendanceResult.data?.length || 0,
          totalLeaveRequests: leavesResult.data?.length || 0,
          dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        },
        students: studentsResult.data || [],
        attendance: attendanceResult.data || [],
        leaves: leavesResult.data || []
      };

      const filename = `batch_report_${batch}_${department}_${sem}_${div}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      
      return {
        success: true,
        data: report,
        filename: filename
      };
    } catch (error) {
      console.error('[importExportService] Error exporting batch report:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  },

  // Import students with batch and department assignment
  async importStudentsWithBatch(
    studentsData: any[],
    batch: string,
    department: string,
    sem: string,
    div: string
  ): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const errors: string[] = [];
      let imported = 0;

      for (const student of studentsData) {
        try {
          // Validate department
          if (!isValidDepartment(department)) {
            errors.push(`Invalid department for student ${student.name || student.id}: ${department}`);
            continue;
          }

          // Add batch and department info
          const studentWithBatch = {
            ...student,
            batchYear: batch,
            department: department,
            year: student.year || sem,
            sem: sem,
            div: div,
            role: 'student',
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          };

          // Save to main users collection
          await userService.createUser(studentWithBatch);
          imported++;
        } catch (error) {
          errors.push(`Error importing student ${student.name || student.id}: ${(error as any).message}`);
        }
      }

      return {
        success: imported > 0,
        imported,
        errors
      };
    } catch (error) {
      console.error('[importExportService] Error importing students:', error);
      return {
        success: false,
        imported: 0,
        errors: [`Import failed: ${(error as any).message}`]
      };
    }
  },

  // Get available batches
  async getAvailableBatches(): Promise<string[]> {
    try {
      const batches = new Set<string>();
      
      // Query students collection to find existing batches
      const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      studentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.batchYear) {
          batches.add(data.batchYear);
        }
      });

      return Array.from(batches).sort();
    } catch (error) {
      console.error('[importExportService] Error getting available batches:', error);
      return [];
    }
  },

  // Get batch statistics
  async getBatchStatistics(batch: string): Promise<any> {
    try {
      const stats = {
        batch: batch,
        departments: {} as any,
        totalStudents: 0,
        totalTeachers: 0
      };

      // Get statistics for each department
      for (const dept of Object.values(DEPARTMENTS)) {
        try {
          // Count students
          const studentsSnapshot = await getDocs(collection(db, buildBatchPath.student(batch, dept, '2nd', '3', 'A')));
          const studentCount = studentsSnapshot.size;

          // Count teachers
          const teachersSnapshot = await getDocs(collection(db, buildBatchPath.teacher(batch, dept, '3', 'A')));
          const teacherCount = teachersSnapshot.size;

          stats.departments[dept] = {
            students: studentCount,
            teachers: teacherCount
          };

          stats.totalStudents += studentCount;
          stats.totalTeachers += teacherCount;
        } catch (error) {
          // Department collection might not exist
          stats.departments[dept] = { students: 0, teachers: 0 };
        }
      }

      return stats;
    } catch (error) {
      console.error('[importExportService] Error getting batch statistics:', error);
      return { batch, error: (error as any).message };
    }
  }
};

// Subject Management Service
export const subjectService = {
  // Helper function to build subject collection path
  // New structure: /subjects/2025/CSE/year/2nd/sems/3
  buildSubjectPath: (batch: string, department: string, year: string, sem: string) => {
    return `${COLLECTIONS.SUBJECTS}/${batch}/${department}/year/${year}/sems/${sem}`;
  },

  // Create a new subject
  async createSubject(subjectData: Subject): Promise<void> {
    try {
      const path = this.buildSubjectPath(subjectData.batch, subjectData.department, subjectData.year, subjectData.sem);
      console.log(`[subjectService] Creating subject with path: ${path}`);
      console.log(`[subjectService] Subject ID: ${subjectData.id}`);
      
      const subjectRef = doc(db, path, subjectData.id);
      
      const subjectDoc = {
        ...subjectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(subjectRef, subjectDoc);
      console.log(`[subjectService] Subject created successfully: ${subjectData.subjectCode}`);
    } catch (error) {
      console.error('[subjectService] Error creating subject:', error);
      throw error;
    }
  },

  // Get subjects by year, sem, department (no division)
  async getSubjectsByYearSem(
    batch: string,
    department: string,
    year: string,
    sem: string
  ): Promise<Subject[]> {
    try {
      const path = this.buildSubjectPath(batch, department, year, sem);
      console.log(`[subjectService] Getting subjects with path: ${path}`);
      const subjectsRef = collection(db, path);
      const q = query(subjectsRef, orderBy('subjectCode'));
      const querySnapshot = await getDocs(q);
      
      console.log(`[subjectService] Found ${querySnapshot.docs.length} subjects`);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
    } catch (error) {
      console.error('[subjectService] Error getting subjects:', error);
      return [];
    }
  },

  // Get subjects for a department with optional year/semester filtering
  async getSubjectsByDepartment(
    department: string, 
    year?: string, 
    semester?: string
  ): Promise<Subject[]> {
    try {
      console.log(`[subjectService] Getting subjects for department: ${department}, year: ${year}, sem: ${semester}`);
      const subjects: Subject[] = [];
      
      // If specific year/semester is requested, only check those
      if (year && semester) {
        const batches = ['2025', '2024', '2023', '2022'];
        for (const batch of batches) {
          try {
            const path = this.buildSubjectPath(batch, department, year, semester);
            console.log(`[subjectService] Checking specific path: ${path}`);
            const subjectsRef = collection(db, path);
            const q = query(subjectsRef, orderBy('subjectCode'));
            const querySnapshot = await getDocs(q);
            
            console.log(`[subjectService] Query snapshot size: ${querySnapshot.docs.length} for path: ${path}`);
            if (querySnapshot.docs.length > 0) {
              console.log(`[subjectService] Found ${querySnapshot.docs.length} subjects in ${path}`);
              console.log(`[subjectService] Sample subject data:`, querySnapshot.docs[0].data());
            }
            
            const batchSubjects = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Subject[];
            
            subjects.push(...batchSubjects);
          } catch (error) {
            console.log(`[subjectService] Collection not found: ${this.buildSubjectPath(batch, department, year, semester)}`, error);
            continue;
          }
        }
      } else if (semester && !year) {
        // Get subjects for semester across all years
        const batches = ['2025', '2024', '2023', '2022'];
        const years = ['2nd', '3rd', '4th'];
        for (const batch of batches) {
          for (const y of years) {
            try {
              const path = this.buildSubjectPath(batch, department, y, semester);
              const subjectsRef = collection(db, path);
              const q = query(subjectsRef, orderBy('subjectCode'));
              const querySnapshot = await getDocs(q);
              const batchSubjects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Subject[];
              subjects.push(...batchSubjects);
            } catch (error) {
              continue;
            }
          }
        }
        // De-duplicate by subjectCode + subjectName across years
        const seen = new Set<string>();
        const deduped: Subject[] = [];
        for (const s of subjects) {
          const key = `${(s as any).subjectCode || ''}|${(s as any).subjectName || ''}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(s);
          }
        }
        return deduped;
      } else {
        // If no specific filters, get all subjects (original behavior)
        const batches = ['2025', '2024', '2023', '2022'];
        const sems = ['1', '2', '3', '4', '5', '6', '7', '8'];
        const years = ['2nd', '3rd', '4th'];
        
        for (const batch of batches) {
          for (const sem of sems) {
            for (const year of years) {
              try {
                const path = this.buildSubjectPath(batch, department, year, sem);
                const subjectsRef = collection(db, path);
                const q = query(subjectsRef, orderBy('subjectCode'));
                const querySnapshot = await getDocs(q);
                
                const batchSubjects = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Subject[];
                
                subjects.push(...batchSubjects);
              } catch (error) {
                continue;
              }
            }
          }
        }
      }
      
      console.log(`[subjectService] Total subjects found: ${subjects.length}`);
      
      // If no subjects found for the specific department, try to find any subjects in the system
      if (subjects.length === 0) {
        console.log(`[subjectService] No subjects found for ${department}, checking all departments...`);
        const allDepartments = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AI&ML', 'Data Science'];
        for (const dept of allDepartments) {
          if (dept === department) continue; // Skip the original department
          
          const batches = ['2025', '2024', '2023', '2022'];
          for (const batch of batches) {
            try {
              const path = this.buildSubjectPath(batch, dept, '2nd', semester || '3');
              console.log(`[subjectService] Checking fallback path: ${path}`);
              const subjectsRef = collection(db, path);
              const q = query(subjectsRef, orderBy('subjectCode'));
              const querySnapshot = await getDocs(q);
              
              if (querySnapshot.docs.length > 0) {
                console.log(`[subjectService] Found ${querySnapshot.docs.length} subjects in fallback path: ${path}`);
                const batchSubjects = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Subject[];
                subjects.push(...batchSubjects);
                break; // Found subjects, no need to check more
              }
            } catch (error) {
              continue;
            }
          }
          if (subjects.length > 0) break; // Found subjects, no need to check more departments
        }
      }
      
      // Apply year filter if provided - use flexible matching
      let finalSubjects = subjects;
      if (year) {
        console.log(`[subjectService] Applying year filter for: ${year}`);
        console.log(`[subjectService] Sample subject years:`, subjects.slice(0, 3).map(s => ({ 
          subjectCode: (s as any).subjectCode, 
          year: (s as any).year,
          yearType: typeof (s as any).year 
        })));
        
        finalSubjects = subjects.filter(s => {
          const subjectYear = String((s as any).year || '').trim().toLowerCase();
          const filterYear = String(year).trim().toLowerCase();
          
          console.log(`[subjectService] Comparing subject year "${subjectYear}" with filter year "${filterYear}"`);
          
          // Direct match
          if (subjectYear === filterYear) {
            console.log(`[subjectService] Direct match found`);
            return true;
          }
          
          // Flexible matching for different year formats
          const yearMappings = {
            '1': ['1', '1st', 'first'],
            '2': ['2', '2nd', 'second'], 
            '3': ['3', '3rd', 'third'],
            '4': ['4', '4th', 'fourth']
          };
          
          // Check if both years map to the same academic year
          for (const [academicYear, formats] of Object.entries(yearMappings)) {
            if (formats.includes(subjectYear) && formats.includes(filterYear)) {
              console.log(`[subjectService] Flexible match found for academic year ${academicYear}`);
              return true;
            }
          }
          
          return false;
        });
        console.log(`[subjectService] Final subjects after year filter: ${finalSubjects.length}`);
      }
      
      // If no subjects found with year filter, try without year filter
      if (finalSubjects.length === 0 && year) {
        console.log(`[subjectService] No subjects found for year ${year}, returning all subjects for department`);
        finalSubjects = subjects;
      }
      
      return finalSubjects;
    } catch (error) {
      console.error('[subjectService] Error getting subjects by department:', error);
      return [];
    }
  },

  // Get all subjects for a department across all years and sems (legacy method)
  async getAllSubjectsByDepartment(department: string): Promise<Subject[]> {
    return this.getSubjectsByDepartment(department);
  },

  // Get subject by ID
  async getSubjectById(
    batch: string,
    department: string,
    year: string,
    sem: string,
    subjectId: string
  ): Promise<Subject | null> {
    try {
      const path = this.buildSubjectPath(batch, department, year, sem);
      const subjectRef = doc(db, path, subjectId);
      const subjectDoc = await getDoc(subjectRef);
      
      if (subjectDoc.exists()) {
        return { id: subjectDoc.id, ...subjectDoc.data() } as Subject;
      }
      return null;
    } catch (error) {
      console.error('[subjectService] Error getting subject by ID:', error);
      return null;
    }
  },

  // Update subject
  async updateSubject(
    batch: string,
    department: string,
    year: string,
    sem: string,
    subjectId: string,
    updates: Partial<Subject>
  ): Promise<void> {
    try {
      const path = this.buildSubjectPath(batch, department, year, sem);
      const subjectRef = doc(db, path, subjectId);
      
      await setDoc(subjectRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`[subjectService] Subject updated: ${subjectId}`);
    } catch (error) {
      console.error('[subjectService] Error updating subject:', error);
      throw error;
    }
  },

  // Delete subject
  async deleteSubject(
    batch: string,
    department: string,
    year: string,
    sem: string,
    subjectId: string
  ): Promise<void> {
    try {
      const path = this.buildSubjectPath(batch, department, year, sem);
      const subjectRef = doc(db, path, subjectId);
      await deleteDoc(subjectRef);
      
      console.log(`[subjectService] Subject deleted: ${subjectId}`);
    } catch (error) {
      console.error('[subjectService] Error deleting subject:', error);
      throw error;
    }
  },

  // Assign teacher to subject
  async assignTeacherToSubject(
    batch: string,
    department: string,
    year: string,
    sem: string,
    subjectId: string,
    teacherId: string,
    teacherName: string,
    teacherEmail: string
  ): Promise<void> {
    try {
      const path = this.buildSubjectPath(batch, department, year, sem);
      const subjectRef = doc(db, path, subjectId);
      
      await setDoc(subjectRef, {
        teacherId,
        teacherName,
        teacherEmail,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`[subjectService] Teacher assigned to subject: ${subjectId}`);
    } catch (error) {
      console.error('[subjectService] Error assigning teacher:', error);
      throw error;
    }
  },

  // Get subjects assigned to a teacher
  async getSubjectsByTeacher(teacherId: string): Promise<Subject[]> {
    try {
      const subjects: Subject[] = [];
      const batches = ['2025', '2024', '2023', '2022'];
      const departments = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AI&ML', 'Data Science'];
      const sems = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const years = ['2nd', '3rd', '4th'];
      
      for (const batch of batches) {
        for (const department of departments) {
          for (const sem of sems) {
            for (const year of years) {
              try {
                const path = this.buildSubjectPath(batch, department, year, sem);
                const subjectsRef = collection(db, path);
                const q = query(subjectsRef, where('teacherId', '==', teacherId));
                const querySnapshot = await getDocs(q);
                
                const teacherSubjects = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as Subject[];
                
                subjects.push(...teacherSubjects);
              } catch (error) {
                // Collection might not exist, continue
                continue;
              }
            }
          }
        }
      }
      
      return subjects;
    } catch (error) {
      console.error('[subjectService] Error getting subjects by teacher:', error);
      return [];
    }
  },

  // Bulk import subjects
  async bulkImportSubjects(subjects: Subject[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const subject of subjects) {
        const path = this.buildSubjectPath(subject.batch, subject.department, subject.year, subject.sem);
        const subjectRef = doc(db, path, subject.id);
        
        batch.set(subjectRef, {
          ...subject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`[subjectService] Bulk imported ${subjects.length} subjects`);
    } catch (error) {
      console.error('[subjectService] Error bulk importing subjects:', error);
      throw error;
    }
  },

  // Migrate subjects from old structure to new structure
  async migrateSubjectsToNewStructure(
    batch: string = '2025',
    department: string = 'CSE',
    deleteOldData: boolean = false
  ): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    try {
      console.log('[subjectService] Starting subject migration...');
      const errors: string[] = [];
      let migratedCount = 0;
      
      // Define the mapping from old structure to new structure
      const yearSemMapping = [
        { oldSem: '3', newYear: '2nd', newSem: '3' },
        { oldSem: '4', newYear: '2nd', newSem: '4' },
        { oldSem: '5', newYear: '3rd', newSem: '5' },
        { oldSem: '6', newYear: '3rd', newSem: '6' },
        { oldSem: '7', newYear: '4th', newSem: '7' },
        { oldSem: '8', newYear: '4th', newSem: '8' }
      ];
      
      const divisions = ['A', 'B', 'C'];
      
      for (const mapping of yearSemMapping) {
        for (const div of divisions) {
          try {
            // Old path: /subjects/2025/CSE/sems/7/divs/A/
            const oldPath = `${COLLECTIONS.SUBJECTS}/${batch}/${department}/sems/${mapping.oldSem}/divs/${div}`;
            console.log(`[subjectService] Checking old path: ${oldPath}`);
            
            const oldSubjectsRef = collection(db, oldPath);
            const oldQuerySnapshot = await getDocs(oldSubjectsRef);
            
            if (oldQuerySnapshot.docs.length > 0) {
              console.log(`[subjectService] Found ${oldQuerySnapshot.docs.length} subjects in ${oldPath}`);
              
              // New path: /subjects/2025/CSE/year/4th/sems/7/
              const newPath = `${COLLECTIONS.SUBJECTS}/${batch}/${department}/year/${mapping.newYear}/sems/${mapping.newSem}`;
              console.log(`[subjectService] Migrating to new path: ${newPath}`);
              
              // Process each subject
              for (const docSnapshot of oldQuerySnapshot.docs) {
                try {
                  const subjectData = docSnapshot.data();
                  
                  // Update the subject data with new structure
                  const { div: _, ...subjectDataWithoutDiv } = subjectData;
                  const updatedSubjectData = {
                    ...subjectDataWithoutDiv,
                    year: mapping.newYear,
                    sem: mapping.newSem,
                    // Update the document ID to remove division
                    id: docSnapshot.id.replace(`_${div}`, ''),
                    migratedAt: serverTimestamp(),
                    migratedFrom: oldPath
                  };
                  
                  // Create new document in new structure
                  const newSubjectRef = doc(db, newPath, updatedSubjectData.id);
                  await setDoc(newSubjectRef, updatedSubjectData);
                  
                  console.log(`[subjectService] Migrated subject: ${updatedSubjectData.id}`);
                  migratedCount++;
                  
                  // Optionally delete old document
                  if (deleteOldData) {
                    await deleteDoc(docSnapshot.ref);
                    console.log(`[subjectService] Deleted old subject: ${docSnapshot.id}`);
                  }
                  
                } catch (subjectError) {
                  const errorMsg = `Error migrating subject ${docSnapshot.id}: ${subjectError}`;
                  console.error(`[subjectService] ${errorMsg}`);
                  errors.push(errorMsg);
                }
              }
            }
          } catch (pathError) {
            // Handle error silently
            // Continue with next path
          }
        }
      }
      
      console.log(`[subjectService] Migration completed. Migrated: ${migratedCount}, Errors: ${errors.length}`);
      
      return {
        success: errors.length === 0,
        migrated: migratedCount,
        errors: errors
      };
      
    } catch (error) {
      console.error('[subjectService] Error during migration:', error);
      return {
        success: false,
        migrated: 0,
        errors: [`Migration failed: ${error}`]
      };
    }
  },

  // Export subjects to Excel/CSV
  async exportSubjects(
    batch: string,
    department: string,
    year: string,
    sem: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const subjects = await this.getSubjectsByYearSem(batch, department, year, sem);
      
      if (subjects.length === 0) {
        return {
          success: false,
          message: 'No subjects found for the specified criteria'
        };
      }

      // Export only the required fields
      const exportData = subjects.map(subject => ({
        'Subject Code': subject.subjectCode,
        'Subject Name': subject.subjectName,
        'Subject Type': subject.subjectType,
        'Department': subject.department,
        'Year': subject.year,
        'Semester': subject.sem
      }));

      const filename = `subjects_${batch}_${department}_${year}_${sem}.${format}`;
      
      return {
        success: true,
        data: exportData,
        filename: filename
      };
    } catch (error) {
      console.error('[subjectService] Error exporting subjects:', error);
      return {
        success: false,
        message: `Export failed: ${(error as any).message}`
      };
    }
  }
};

// Department Management Service
export const departmentService = {
  // Create a new department
  async createDepartment(departmentData: Omit<Department, 'id' | 'totalTeachers' | 'totalStudents' | 'createdAt'>): Promise<string> {
    try {
      const departmentRef = doc(collection(db, COLLECTIONS.DEPARTMENTS));
      const department: Department = {
        id: departmentRef.id,
        ...departmentData,
        totalTeachers: 0,
        totalStudents: 0,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(departmentRef, department);
      console.log('[departmentService] Department created successfully:', department.id);
      return department.id;
    } catch (error) {
      console.error('[departmentService] Error creating department:', error);
      throw error;
    }
  },

  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    try {
      const departmentsRef = collection(db, COLLECTIONS.DEPARTMENTS);
      const q = query(departmentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const departments: Department[] = [];
      querySnapshot.forEach((doc) => {
        departments.push(doc.data() as Department);
      });
      
      console.log('[departmentService] Retrieved departments:', departments.length);
      return departments;
    } catch (error) {
      console.error('[departmentService] Error getting departments:', error);
      throw error;
    }
  },

  // Get department by ID
  async getDepartmentById(departmentId: string): Promise<Department | null> {
    try {
      const departmentRef = doc(db, COLLECTIONS.DEPARTMENTS, departmentId);
      const departmentSnap = await getDoc(departmentRef);
      
      if (departmentSnap.exists()) {
        return departmentSnap.data() as Department;
      } else {
        console.log('[departmentService] Department not found:', departmentId);
        return null;
      }
    } catch (error) {
      console.error('[departmentService] Error getting department:', error);
      throw error;
    }
  },

  // Update department
  async updateDepartment(departmentId: string, updateData: Partial<Department>): Promise<void> {
    try {
      const departmentRef = doc(db, COLLECTIONS.DEPARTMENTS, departmentId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(departmentRef, updatePayload);
      console.log('[departmentService] Department updated successfully:', departmentId);
    } catch (error) {
      console.error('[departmentService] Error updating department:', error);
      throw error;
    }
  },

  // Delete department
  async deleteDepartment(departmentId: string): Promise<void> {
    try {
      const departmentRef = doc(db, COLLECTIONS.DEPARTMENTS, departmentId);
      await deleteDoc(departmentRef);
      console.log('[departmentService] Department deleted successfully:', departmentId);
    } catch (error) {
      console.error('[departmentService] Error deleting department:', error);
      throw error;
    }
  },

  // Get departments by status
  async getDepartmentsByStatus(isActive: boolean): Promise<Department[]> {
    try {
      const departmentsRef = collection(db, COLLECTIONS.DEPARTMENTS);
      const q = query(
        departmentsRef, 
        where('isActive', '==', isActive),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const departments: Department[] = [];
      querySnapshot.forEach((doc) => {
        departments.push(doc.data() as Department);
      });
      
      console.log('[departmentService] Retrieved departments by status:', departments.length);
      return departments;
    } catch (error) {
      console.error('[departmentService] Error getting departments by status:', error);
      throw error;
    }
  },

  // Get department by code
  async getDepartmentByCode(code: string): Promise<Department | null> {
    try {
      const departmentsRef = collection(db, COLLECTIONS.DEPARTMENTS);
      const q = query(departmentsRef, where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Department;
      } else {
        console.log('[departmentService] Department not found with code:', code);
        return null;
      }
    } catch (error) {
      console.error('[departmentService] Error getting department by code:', error);
      throw error;
    }
  },

  // Update department statistics (teachers and students count)
  async updateDepartmentStats(departmentId: string): Promise<void> {
    try {
      // Get all users for this department from flat collection
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('department', '==', departmentId));
      const querySnapshot = await getDocs(q);
      
      let totalTeachers = 0;
      let totalStudents = 0;
      
      querySnapshot.forEach((doc) => {
        const user = doc.data() as User;
        if (user.role === 'teacher' || user.role === 'hod') {
          totalTeachers++;
        } else if (user.role === 'student') {
          totalStudents++;
        }
      });
      
      // Update department with new counts
      await this.updateDepartment(departmentId, {
        totalTeachers,
        totalStudents
      });
      
      console.log('[departmentService] Updated department stats:', { departmentId, totalTeachers, totalStudents });
    } catch (error) {
      console.error('[departmentService] Error updating department stats:', error);
      throw error;
    }
  },

  // Assign HOD to department
  async assignHOD(departmentId: string, hodId: string): Promise<void> {
    try {
      // Get HOD details
      const hodRef = doc(db, COLLECTIONS.USERS, hodId);
      const hodSnap = await getDoc(hodRef);
      
      if (!hodSnap.exists()) {
        throw new Error('HOD not found');
      }
      
      const hod = hodSnap.data() as User;
      
      // Update department with HOD details
      await this.updateDepartment(departmentId, {
        hodId,
        hodName: hod.name,
        hodEmail: hod.email
      });
      
      // Update HOD's role to 'hod' if not already
      if (hod.role !== 'hod') {
        await updateDoc(hodRef, {
          role: 'hod',
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('[departmentService] HOD assigned successfully:', { departmentId, hodId });
    } catch (error) {
      console.error('[departmentService] Error assigning HOD:', error);
      throw error;
    }
  },

  // Remove HOD from department
  async removeHOD(departmentId: string): Promise<void> {
    try {
      // Get current department
      const department = await this.getDepartmentById(departmentId);
      if (!department) {
        throw new Error('Department not found');
      }
      
      // Update department to remove HOD
      await this.updateDepartment(departmentId, {
        hodId: undefined,
        hodName: undefined,
        hodEmail: undefined
      });
      
      // If HOD exists, update their role back to teacher
      if (department.hodId) {
        const hodRef = doc(db, COLLECTIONS.USERS, department.hodId);
        await updateDoc(hodRef, {
          role: 'teacher',
          updatedAt: new Date().toISOString()
        });
      }
      
      console.log('[departmentService] HOD removed successfully:', departmentId);
    } catch (error) {
      console.error('[departmentService] Error removing HOD:', error);
      throw error;
    }
  },

  // Get available teachers for HOD assignment (flat structure)
  async getAvailableTeachersForHOD(): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef, 
        where('role', 'in', ['teacher', 'hod']),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      const teachers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log('[departmentService] Retrieved available teachers for HOD:', teachers.length);
      return teachers;
    } catch (error) {
      console.error('[departmentService] Error getting available teachers:', error);
      throw error;
    }
  },

  // Get teachers by department for HOD assignment (flat structure)
  async getTeachersByDepartment(departmentName: string): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef, 
        where('role', 'in', ['teacher', 'hod']),
        where('department', '==', departmentName),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      const teachers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log('[departmentService] Retrieved teachers for department:', departmentName, teachers.length);
      return teachers;
    } catch (error) {
      console.error('[departmentService] Error getting teachers by department:', error);
      throw error;
    }
  },

  // Initialize default departments
  async initializeDefaultDepartments(): Promise<void> {
    try {
      const existingDepartments = await this.getAllDepartments();
      
      if (existingDepartments.length > 0) {
        console.log('[departmentService] Departments already exist, skipping initialization');
        return;
      }
      
      const defaultDepartments = [
        {
          name: 'Computer Science Engineering',
          code: 'CSE',
          description: 'Computer Science and Engineering Department',
          isActive: true
        },
        {
          name: 'Information Technology',
          code: 'IT',
          description: 'Information Technology Department',
          isActive: true
        },
        {
          name: 'Electronics and Communication Engineering',
          code: 'ECE',
          description: 'Electronics and Communication Engineering Department',
          isActive: true
        },
        {
          name: 'Mechanical Engineering',
          code: 'ME',
          description: 'Mechanical Engineering Department',
          isActive: true
        },
        {
          name: 'Electrical Engineering',
          code: 'EE',
          description: 'Electrical Engineering Department',
          isActive: true
        },
        {
          name: 'Civil Engineering',
          code: 'CE',
          description: 'Civil Engineering Department',
          isActive: true
        }
      ];
      
      for (const dept of defaultDepartments) {
        await this.createDepartment(dept);
      }
      
      console.log('[departmentService] Default departments initialized successfully');
    } catch (error) {
      console.error('[departmentService] Error initializing default departments:', error);
      throw error;
    }
  }
};

// Institution Settings Service
export const institutionService = {
  // Academic Year Management
  async createAcademicYear(yearData: Omit<AcademicYear, 'id'>): Promise<string> {
    try {
      const yearRef = doc(collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years'));
      const yearId = yearRef.id;
      
      await setDoc(yearRef, {
        ...yearData,
        id: yearId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[institutionService] Academic year created:', yearId);
      return yearId;
    } catch (error) {
      console.error('[institutionService] Error creating academic year:', error);
      throw error;
    }
  },

  async getAllAcademicYears(): Promise<AcademicYear[]> {
    try {
      const yearsRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years');
      const q = query(yearsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AcademicYear));
    } catch (error) {
      console.error('[institutionService] Error getting academic years:', error);
      throw error;
    }
  },

  async updateAcademicYear(yearId: string, updateData: Partial<AcademicYear>): Promise<void> {
    try {
      const yearRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years', yearId);
      await updateDoc(yearRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[institutionService] Academic year updated:', yearId);
    } catch (error) {
      console.error('[institutionService] Error updating academic year:', error);
      throw error;
    }
  },

  async deleteAcademicYear(yearId: string): Promise<void> {
    try {
      const yearRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years', yearId);
      await deleteDoc(yearRef);
      
      console.log('[institutionService] Academic year deleted:', yearId);
    } catch (error) {
      console.error('[institutionService] Error deleting academic year:', error);
      throw error;
    }
  },

  async setActiveAcademicYear(yearId: string): Promise<void> {
    try {
      // Get current active year to copy fee structure from
      const yearsRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years');
      const activeYearQuery = query(yearsRef, where('isActive', '==', true));
      const activeYearSnapshot = await getDocs(activeYearQuery);
      
      let previousActiveYearId: string | null = null;
      if (!activeYearSnapshot.empty) {
        previousActiveYearId = activeYearSnapshot.docs[0].id;
      }

      // First, deactivate all years
      const allYearsQuery = query(yearsRef);
      const allYearsSnapshot = await getDocs(allYearsQuery);
      
      const updatePromises = allYearsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isActive: false, updatedAt: serverTimestamp() })
      );
      
      await Promise.all(updatePromises);
      
      // Then activate the selected year
      const yearRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years', yearId);
      await updateDoc(yearRef, {
        isActive: true,
        updatedAt: serverTimestamp()
      });

      // Check if the new academic year has fee structures
      const newYearFees = await this.getFeeItemsByAcademicYear(yearId);
      
      // If no fee structures exist for the new year and there was a previous active year, copy them
      if (newYearFees.length === 0 && previousActiveYearId && previousActiveYearId !== yearId) {
        console.log('[institutionService] Copying fee structure from previous year to new active year');
        await this.copyFeeStructureToAcademicYear(previousActiveYearId, yearId);
      }
      
      console.log('[institutionService] Active academic year set:', yearId);
    } catch (error) {
      console.error('[institutionService] Error setting active academic year:', error);
      throw error;
    }
  },

  // Fee Structure Management
  async createFeeItem(feeData: Omit<FeeStructureItem, 'id'>): Promise<string> {
    try {
      // Use subcollection structure for fee items
      const feesRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items');
      const docRef = doc(feesRef);
      const feeId = docRef.id;
      
      await setDoc(docRef, {
        ...feeData,
        id: feeId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[institutionService] Fee item created:', feeId);
      return feeId;
    } catch (error) {
      console.error('[institutionService] Error creating fee item:', error);
      throw error;
    }
  },

  async getAllFeeItems(): Promise<FeeStructureItem[]> {
    try {
      // Use subcollection structure for fee items
      const feesRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items');
      const q = query(feesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeeStructureItem[];
    } catch (error) {
      console.error('[institutionService] Error getting fee items:', error);
      throw error;
    }
  },

  async getFeeItemsByAcademicYear(academicYearId: string): Promise<FeeStructureItem[]> {
    try {
      // Use subcollection structure for fee items with academic year filtering
      const feesRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items');
      const q = query(feesRef, where('academicYearId', '==', academicYearId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeeStructureItem[];
    } catch (error) {
      console.error('[institutionService] Error getting fee items by academic year:', error);
      throw error;
    }
  },

  async findFeeItemById(feeId: string): Promise<{ category: string; feeId: string } | null> {
    try {
      // Use subcollection structure for fee items
      const feeRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items', feeId);
      const feeSnapshot = await getDoc(feeRef);
      
      if (feeSnapshot.exists()) {
        const feeData = feeSnapshot.data() as FeeStructureItem;
        return { category: feeData.category, feeId };
      }
      
      return null;
    } catch (error) {
      console.error('[institutionService] Error finding fee item:', error);
      throw error;
    }
  },

  async updateFeeItem(feeId: string, updateData: Partial<FeeStructureItem>): Promise<void> {
    try {
      // Use subcollection structure for fee items
      const feeRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items', feeId);
      await updateDoc(feeRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[institutionService] Fee item updated:', feeId);
    } catch (error) {
      console.error('[institutionService] Error updating fee item:', error);
      throw error;
    }
  },

  async deleteFeeItem(feeId: string): Promise<void> {
    try {
      // Use subcollection structure for fee items
      const feeRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items', feeId);
      await deleteDoc(feeRef);
      
      console.log('[institutionService] Fee item deleted:', feeId);
    } catch (error) {
      console.error('[institutionService] Error deleting fee item:', error);
      throw error;
    }
  },

  async toggleFeeItemStatus(feeId: string): Promise<void> {
    try {
      // Use subcollection structure for fee items
      const feeRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'fee-structure', 'items', feeId);
      const feeSnap = await getDoc(feeRef);
      
      if (feeSnap.exists()) {
        const currentStatus = feeSnap.data().isActive;
        await updateDoc(feeRef, {
          isActive: !currentStatus,
          updatedAt: serverTimestamp()
        });
        
        console.log('[institutionService] Fee item status toggled:', feeId, !currentStatus);
      } else {
        throw new Error('Fee item not found');
      }
    } catch (error) {
      console.error('[institutionService] Error toggling fee item status:', error);
      throw error;
    }
  },

  async copyFeeStructureToAcademicYear(fromAcademicYearId: string, toAcademicYearId: string): Promise<void> {
    try {
      // Get all fee items from the source academic year
      const sourceFees = await this.getFeeItemsByAcademicYear(fromAcademicYearId);
      
      if (sourceFees.length === 0) {
        console.log('[institutionService] No fee items to copy from academic year:', fromAcademicYearId);
        return;
      }

      // Create new fee items for the target academic year
      const copyPromises = sourceFees.map(async (fee) => {
        const newFeeData = {
          name: fee.name,
          category: fee.category,
          reservationCategory: fee.reservationCategory,
          department: fee.department,
          amount: fee.amount,
          description: fee.description,
          isActive: fee.isActive,
          academicYearId: toAcademicYearId
        };
        
        return this.createFeeItem(newFeeData);
      });

      await Promise.all(copyPromises);
      console.log('[institutionService] Fee structure copied from', fromAcademicYearId, 'to', toAcademicYearId);
    } catch (error) {
      console.error('[institutionService] Error copying fee structure:', error);
      throw error;
    }
  },

  // Institution Information Management
  async getInstitutionInfo(): Promise<InstitutionInfo> {
    try {
      const infoRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'institution-info');
      const infoSnap = await getDoc(infoRef);
      
      if (infoSnap.exists()) {
        return infoSnap.data() as InstitutionInfo;
      } else {
        // Return default info if not found
        return {
          name: "DYPSN College of Engineering",
          address: "123 Education Street, Pune, Maharashtra 411001",
          phone: "+91 20 1234 5678",
          email: "info@dypsn.edu",
          website: "www.dypsn.edu",
          establishedYear: "1995",
          affiliation: "Savitribai Phule Pune University",
          accreditation: "NAAC A+ Grade"
        };
      }
    } catch (error) {
      console.error('[institutionService] Error getting institution info:', error);
      throw error;
    }
  },

  async updateInstitutionInfo(infoData: InstitutionInfo): Promise<void> {
    try {
      const infoRef = doc(db, COLLECTIONS.INSTITUTION_SETTINGS, 'institution-info');
      await setDoc(infoRef, {
        ...infoData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('[institutionService] Institution info updated');
    } catch (error) {
      console.error('[institutionService] Error updating institution info:', error);
      throw error;
    }
  },

  // Initialize default data
  async initializeDefaultData(): Promise<void> {
    try {
      // Check if data already exists
      const yearsRef = collection(db, COLLECTIONS.INSTITUTION_SETTINGS, 'academic-years', 'years');
      const yearsSnapshot = await getDocs(yearsRef);
      
      if (yearsSnapshot.empty) {
        // Create default academic years
        const defaultYears = [
          {
            name: "2024-25",
            startDate: "2024-06-01",
            endDate: "2025-05-31",
            isActive: true
          },
          {
            name: "2023-24",
            startDate: "2023-06-01",
            endDate: "2024-05-31",
            isActive: false
          }
        ];
        
        for (const year of defaultYears) {
          await this.createAcademicYear(year);
        }
      }
      
      // Check if fee items exist
      const existingFees = await this.getAllFeeItems();
      
      if (existingFees.length === 0) {
        // Get the active academic year to assign fees to
        const activeYearQuery = query(yearsRef, where('isActive', '==', true));
        const activeYearSnapshot = await getDocs(activeYearQuery);
        
        if (!activeYearSnapshot.empty) {
          const activeYearId = activeYearSnapshot.docs[0].id;
          
          // Create default fee items
          const defaultFees = [
            {
              name: "Tuition Fee - CSE",
              category: "Tuition",
              reservationCategory: "Open",
              department: "CSE",
              amount: 50000,
              description: "Annual tuition fee for Computer Science Engineering",
              isActive: true,
              academicYearId: activeYearId
            },
            {
              name: "Library Fee",
              category: "Library",
              reservationCategory: "Open",
              department: "All",
              amount: 2000,
              description: "Annual library membership fee",
              isActive: true,
              academicYearId: activeYearId
            },
            {
              name: "Examination Fee",
              category: "Examination",
              reservationCategory: "Open",
              department: "All",
              amount: 1000,
              description: "Per semester examination fee",
              isActive: true,
              academicYearId: activeYearId
            }
          ];
          
          for (const fee of defaultFees) {
            await this.createFeeItem(fee);
          }
        }
      }
      
      console.log('[institutionService] Default institution data initialized successfully');
    } catch (error) {
      console.error('[institutionService] Error initializing default data:', error);
      throw error;
    }
  }
};

// Complaint Management Service
export const complaintService = {
  // Create a new complaint
  async createComplaint(complaintData: Omit<Complaint, 'id'>): Promise<string> {
    try {
      const complaintRef = doc(collection(db, COLLECTIONS.COMPLAINTS));
      const complaintId = complaintRef.id;
      
      await setDoc(complaintRef, {
        ...complaintData,
        id: complaintId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[complaintService] Complaint created:', complaintId);
      return complaintId;
    } catch (error) {
      console.error('[complaintService] Error creating complaint:', error);
      throw error;
    }
  },

  // Get all complaints
  async getAllComplaints(): Promise<Complaint[]> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const querySnapshot = await getDocs(complaintsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('[complaintService] Error getting complaints:', error);
      throw error;
    }
  },

  // Get complaints by status
  async getComplaintsByStatus(status: Complaint['status']): Promise<Complaint[]> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const q = query(complaintsRef, where('status', '==', status));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('[complaintService] Error getting complaints by status:', error);
      throw error;
    }
  },

  // Get complaints by category
  async getComplaintsByCategory(category: Complaint['category']): Promise<Complaint[]> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const q = query(complaintsRef, where('category', '==', category));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('[complaintService] Error getting complaints by category:', error);
      throw error;
    }
  },

  // Get complaints by priority
  async getComplaintsByPriority(priority: Complaint['priority']): Promise<Complaint[]> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const q = query(complaintsRef, where('priority', '==', priority));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('[complaintService] Error getting complaints by priority:', error);
      throw error;
    }
  },

  // Get complaints by department
  async getComplaintsByDepartment(department: string): Promise<Complaint[]> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const q = query(complaintsRef, where('department', '==', department));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('[complaintService] Error getting complaints by department:', error);
      throw error;
    }
  },

  // Update complaint
  async updateComplaint(complaintId: string, updateData: Partial<Complaint>): Promise<void> {
    try {
      const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
      await updateDoc(complaintRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[complaintService] Complaint updated:', complaintId);
    } catch (error) {
      console.error('[complaintService] Error updating complaint:', error);
      throw error;
    }
  },

  // Update complaint status
  async updateComplaintStatus(complaintId: string, status: Complaint['status'], resolution?: string): Promise<void> {
    try {
      const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
      
      // Get current complaint data to check current status
      const complaintDoc = await getDoc(complaintRef);
      if (!complaintDoc.exists()) {
        throw new Error('Complaint not found');
      }
      
      const currentData = complaintDoc.data() as Complaint;
      
      // Prevent reopening rejected complaints
      if (currentData.status === 'Rejected' && status !== 'Rejected') {
        throw new Error('Rejected complaints cannot be reopened');
      }
      
      const updateData: any = {
        status,
        lastUpdated: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };
      
      if (resolution) {
        updateData.resolution = resolution;
      }
      
      await updateDoc(complaintRef, updateData);
      
      console.log('[complaintService] Complaint status updated:', complaintId, status);
    } catch (error) {
      console.error('[complaintService] Error updating complaint status:', error);
      throw error;
    }
  },

  // Assign complaint to someone
  async assignComplaint(complaintId: string, assignedTo: string, assignedToEmail: string): Promise<void> {
    try {
      const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
      await updateDoc(complaintRef, {
        assignedTo,
        assignedToEmail,
        status: 'In Progress',
        lastUpdated: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[complaintService] Complaint assigned:', complaintId, assignedTo);
    } catch (error) {
      console.error('[complaintService] Error assigning complaint:', error);
      throw error;
    }
  },

  // Delete complaint
  async deleteComplaint(complaintId: string): Promise<void> {
    try {
      const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
      await deleteDoc(complaintRef);
      
      console.log('[complaintService] Complaint deleted:', complaintId);
    } catch (error) {
      console.error('[complaintService] Error deleting complaint:', error);
      throw error;
    }
  },

  // Get complaint statistics
  async getComplaintStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    rejected: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
      const querySnapshot = await getDocs(complaintsRef);
      
      const complaints = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));

      const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'Open').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        closed: complaints.filter(c => c.status === 'Closed').length,
        rejected: complaints.filter(c => c.status === 'Rejected').length,
        critical: complaints.filter(c => c.priority === 'Critical').length,
        high: complaints.filter(c => c.priority === 'High').length,
        medium: complaints.filter(c => c.priority === 'Medium').length,
        low: complaints.filter(c => c.priority === 'Low').length,
      };

      console.log('[complaintService] Complaint stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('[complaintService] Error getting complaint stats:', error);
      throw error;
    }
  }
};

// Visitor Service
export const visitorService = {
  async upsertVisitor(profile: Omit<VisitorProfile, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    try {
      const deviceId = profile.deviceId;
      // Use deviceId as document id for idempotency on the same device
      const docId = profile.id || deviceId;
      const ref = doc(db, COLLECTIONS.VISITORS, docId);
      const snapshot = await getDoc(ref);
      const nowIso = new Date().toISOString();
      if (snapshot.exists()) {
        await updateDoc(ref, {
          name: profile.name || snapshot.data().name || null,
          phone: profile.phone || snapshot.data().phone || null,
          purpose: profile.purpose || snapshot.data().purpose || null,
          lastLogin: nowIso,
          updatedAt: serverTimestamp()
        });
        return docId;
      } else {
        await setDoc(ref, {
          id: docId,
          deviceId,
          name: profile.name || null,
          phone: profile.phone || null,
          purpose: profile.purpose || null,
          createdAt: serverTimestamp(),
          lastLogin: nowIso
        });
        return docId;
      }
    } catch (error) {
      console.error('[visitorService] upsertVisitor error:', error);
      throw error;
    }
  },

  async getVisitorByDevice(deviceId: string): Promise<VisitorProfile | null> {
    try {
      const ref = doc(db, COLLECTIONS.VISITORS, deviceId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as any) } as VisitorProfile;
    } catch (error) {
      console.error('[visitorService] getVisitorByDevice error:', error);
      return null;
    }
  },

  async getAllVisitors(): Promise<VisitorProfile[]> {
    try {
      const visitorsRef = collection(db, COLLECTIONS.VISITORS);
      const querySnapshot = await getDocs(visitorsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VisitorProfile));
    } catch (error) {
      console.error('[visitorService] getAllVisitors error:', error);
      throw error;
    }
  }
};

// Bus Management Service
export const busService = {
  // Create a new bus with embedded route
  async createBus(busData: Omit<Bus, 'id'>): Promise<string> {
    try {
      const busRef = doc(collection(db, COLLECTIONS.BUSES));
      const busId = busRef.id;
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanBusData = cleanFirestoreData(busData);
      
      await setDoc(busRef, {
        ...cleanBusData,
        id: busId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[busService] Bus created:', busId);
      return busId;
    } catch (error) {
      console.error('[busService] Error creating bus:', error);
      throw error;
    }
  },

  // Get all buses
  async getAllBuses(): Promise<Bus[]> {
    try {
      const busesRef = collection(db, COLLECTIONS.BUSES);
      const q = query(busesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Bus));
    } catch (error) {
      console.error('[busService] Error getting buses:', error);
      throw error;
    }
  },

  // Get bus assigned to a specific driver
  async getBusByDriver(driverId: string): Promise<Bus | null> {
    try {
      const busesRef = collection(db, COLLECTIONS.BUSES);
      const q = query(busesRef, where('driverId', '==', driverId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const busDoc = querySnapshot.docs[0];
      return {
        id: busDoc.id,
        ...busDoc.data()
      } as Bus;
    } catch (error) {
      console.error('[busService] Error getting bus by driver:', error);
      throw error;
    }
  },

  // Update bus
  async updateBus(busId: string, updateData: Partial<Bus>): Promise<void> {
    try {
      const busRef = doc(db, COLLECTIONS.BUSES, busId);
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanUpdateData = cleanFirestoreData(updateData);
      
      await updateDoc(busRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[busService] Bus updated:', busId);
    } catch (error) {
      console.error('[busService] Error updating bus:', error);
      throw error;
    }
  },

  // Delete bus
  async deleteBus(busId: string): Promise<void> {
    try {
      const busRef = doc(db, COLLECTIONS.BUSES, busId);
      await deleteDoc(busRef);
      
      console.log('[busService] Bus deleted:', busId);
    } catch (error) {
      console.error('[busService] Error deleting bus:', error);
      throw error;
    }
  },

  // Get buses by status
  async getBusesByStatus(status: Bus['status']): Promise<Bus[]> {
    try {
      const busesRef = collection(db, COLLECTIONS.BUSES);
      const q = query(busesRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Bus));
    } catch (error) {
      console.error('[busService] Error getting buses by status:', error);
      throw error;
    }
  },

  // Get buses by route
  async getBusesByRoute(routeName: string): Promise<Bus[]> {
    try {
      const busesRef = collection(db, COLLECTIONS.BUSES);
      const q = query(busesRef, where('route.routeName', '==', routeName), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Bus));
    } catch (error) {
      console.error('[busService] Error getting buses by route:', error);
      throw error;
    }
  },

  // Get active buses
  async getActiveBuses(): Promise<Bus[]> {
    try {
      return await this.getBusesByStatus('active');
    } catch (error) {
      console.error('[busService] Error getting active buses:', error);
      throw error;
    }
  },

  // Get bus statistics
  async getBusStats(): Promise<{
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    ac: number;
    nonAc: number;
    semiAc: number;
  }> {
    try {
      const buses = await this.getAllBuses();
      
      return {
        total: buses.length,
        active: buses.filter(bus => bus.status === 'active').length,
        maintenance: buses.filter(bus => bus.status === 'maintenance').length,
        inactive: buses.filter(bus => bus.status === 'inactive').length,
        ac: buses.filter(bus => bus.type === 'AC').length,
        nonAc: buses.filter(bus => bus.type === 'Non-AC').length,
        semiAc: buses.filter(bus => bus.type === 'Semi-AC').length,
      };
    } catch (error) {
      console.error('[busService] Error getting bus statistics:', error);
      throw error;
    }
  },

  // Listen to buses changes
  listenBuses(callback: (buses: Bus[]) => void): () => void {
    const busesRef = collection(db, COLLECTIONS.BUSES);
    const q = query(busesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const buses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Bus));
      callback(buses);
    });
  },

  // Location tracking methods
  async updateBusLocation(busId: string, locationData: {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
  }): Promise<void> {
    try {
      const busRef = doc(db, COLLECTIONS.BUSES, busId);
      const locationRef = collection(busRef, 'locations');
      
      // Add new location
      await addDoc(locationRef, {
        ...locationData,
        createdAt: serverTimestamp()
      });
      
      // Get current locations count
      const locationsSnapshot = await getDocs(locationRef);
      const locations = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If more than 10 locations, remove the oldest one
      if (locations.length > 10) {
        // Sort by timestamp to find the oldest
        const sortedLocations = locations.sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        );
        
        // Delete the oldest location
        const oldestLocation = sortedLocations[0];
        if (oldestLocation.id) {
          await deleteDoc(doc(locationRef, oldestLocation.id));
        }
      }
      
      console.log('[busService] Location updated for bus:', busId);
    } catch (error) {
      console.error('[busService] Error updating bus location:', error);
      throw error;
    }
  },

  async getBusLocations(busId: string): Promise<any[]> {
    try {
      const busRef = doc(db, COLLECTIONS.BUSES, busId);
      const locationRef = collection(busRef, 'locations');
      const q = query(locationRef, orderBy('timestamp', 'desc'), limit(10));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[busService] Error getting bus locations:', error);
      throw error;
    }
  },

  async getLatestBusLocation(busId: string): Promise<any | null> {
    try {
      const busRef = doc(db, COLLECTIONS.BUSES, busId);
      const locationRef = collection(busRef, 'locations');
      const q = query(locationRef, orderBy('timestamp', 'desc'), limit(1));
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      console.error('[busService] Error getting latest bus location:', error);
      throw error;
    }
  },

  async getAllBusLocations(): Promise<Map<string, any>> {
    try {
      const buses = await this.getAllBuses();
      const locationsMap = new Map();
      
      for (const bus of buses) {
        if (bus.driverId) {
          const latestLocation = await this.getLatestBusLocation(bus.id);
          if (latestLocation) {
            locationsMap.set(bus.id, {
              busId: bus.id,
              busNumber: bus.busNumber,
              driverName: bus.driverName || 'Unknown Driver',
              location: latestLocation,
              isOnline: Date.now() - latestLocation.timestamp < 30000, // 30 seconds threshold
              lastUpdate: latestLocation.timestamp
            });
          }
        }
      }
      
      return locationsMap;
    } catch (error) {
      console.error('[busService] Error getting all bus locations:', error);
      throw error;
    }
  }
};

// Note: Bus routes are now embedded in the Bus collection
// The busRouteService has been removed as routes are managed as part of bus creation/updates

// Lost and Found Service
export const lostFoundService = {
  // Create a new lost and found item
  async createLostFoundItem(itemData: Omit<LostFoundItem, 'id'>): Promise<string> {
    try {
      const itemRef = doc(collection(db, COLLECTIONS.LOST_FOUND));
      const itemId = itemRef.id;
      
      await setDoc(itemRef, {
        ...itemData,
        id: itemId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[lostFoundService] Lost and found item created:', itemId);
      return itemId;
    } catch (error) {
      console.error('[lostFoundService] Error creating lost and found item:', error);
      throw error;
    }
  },

  // Get all lost and found items
  async getAllLostFoundItems(): Promise<LostFoundItem[]> {
    try {
      const itemsRef = collection(db, COLLECTIONS.LOST_FOUND);
      const q = query(itemsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LostFoundItem));
    } catch (error) {
      console.error('[lostFoundService] Error getting lost and found items:', error);
      throw error;
    }
  },

  // Update lost and found item
  async updateLostFoundItem(itemId: string, updateData: Partial<LostFoundItem>): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.LOST_FOUND, itemId);
      await updateDoc(itemRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[lostFoundService] Lost and found item updated:', itemId);
    } catch (error) {
      console.error('[lostFoundService] Error updating lost and found item:', error);
      throw error;
    }
  },

  // Delete lost and found item
  async deleteLostFoundItem(itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.LOST_FOUND, itemId);
      await deleteDoc(itemRef);
      
      console.log('[lostFoundService] Lost and found item deleted:', itemId);
    } catch (error) {
      console.error('[lostFoundService] Error deleting lost and found item:', error);
      throw error;
    }
  },

  // Listen to lost and found items changes
  listenLostFoundItems(callback: (items: LostFoundItem[]) => void): () => void {
    const itemsRef = collection(db, COLLECTIONS.LOST_FOUND);
    const q = query(itemsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LostFoundItem));
      
      callback(items);
    });
  }
};

// Hostel Room Service
export const hostelService = {
  // Create a new hostel room
  async createHostelRoom(roomData: Omit<HostelRoom, 'id'>): Promise<string> {
    try {
      const roomRef = doc(collection(db, COLLECTIONS.HOSTEL_ROOMS));
      const roomId = roomRef.id;
      
      await setDoc(roomRef, {
        ...roomData,
        id: roomId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[hostelService] Hostel room created:', roomId);
      return roomId;
    } catch (error) {
      console.error('[hostelService] Error creating hostel room:', error);
      throw error;
    }
  },

  // Get all hostel rooms
  async getAllHostelRooms(): Promise<HostelRoom[]> {
    try {
      const roomsRef = collection(db, COLLECTIONS.HOSTEL_ROOMS);
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HostelRoom));
    } catch (error) {
      console.error('[hostelService] Error getting hostel rooms:', error);
      throw error;
    }
  },

  // Update hostel room
  async updateHostelRoom(roomId: string, updateData: Partial<HostelRoom>): Promise<void> {
    try {
      const roomRef = doc(db, COLLECTIONS.HOSTEL_ROOMS, roomId);
      await updateDoc(roomRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[hostelService] Hostel room updated:', roomId);
    } catch (error) {
      console.error('[hostelService] Error updating hostel room:', error);
      throw error;
    }
  },

  // Delete hostel room
  async deleteHostelRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(db, COLLECTIONS.HOSTEL_ROOMS, roomId);
      await deleteDoc(roomRef);
      
      console.log('[hostelService] Hostel room deleted:', roomId);
    } catch (error) {
      console.error('[hostelService] Error deleting hostel room:', error);
      throw error;
    }
  },

  // Listen to hostel rooms changes
  listenHostelRooms(callback: (rooms: HostelRoom[]) => void): () => void {
    const roomsRef = collection(db, COLLECTIONS.HOSTEL_ROOMS);
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HostelRoom));
      
      callback(rooms);
    });
  }
};

// Utility function to clean data for Firestore
const cleanFirestoreData = (data: any): any => {
  if (data === null || data === undefined) {
    return undefined;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanFirestoreData).filter(item => item !== undefined);
  }
  
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanFirestoreData(value);
      if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  
  return data;
};

// Event Management Service
export const eventService = {
  // Create a new event
  async createEvent(eventData: Omit<Event, 'id'>): Promise<string> {
    try {
      const eventRef = doc(collection(db, COLLECTIONS.EVENTS));
      const eventId = eventRef.id;
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanEventData = cleanFirestoreData(eventData);
      
      await setDoc(eventRef, {
        ...cleanEventData,
        id: eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[eventService] Event created:', eventId);
      return eventId;
    } catch (error) {
      console.error('[eventService] Error creating event:', error);
      throw error;
    }
  },

  // Get all events
  async getAllEvents(): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const querySnapshot = await getDocs(eventsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting events:', error);
      throw error;
    }
  },

  // Get events by category
  async getEventsByCategory(category: Event['category']): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(eventsRef, where('category', '==', category));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting events by category:', error);
      throw error;
    }
  },

  // Get events by status
  async getEventsByStatus(status: Event['status']): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(eventsRef, where('status', '==', status));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting events by status:', error);
      throw error;
    }
  },

  // Get events by department
  async getEventsByDepartment(department: string): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(eventsRef, where('department', '==', department));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting events by department:', error);
      throw error;
    }
  },

  // Get upcoming events
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(
        eventsRef, 
        where('status', 'in', ['upcoming', 'ongoing']),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting upcoming events:', error);
      throw error;
    }
  },

  // Get events by date range
  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
    } catch (error) {
      console.error('[eventService] Error getting events by date range:', error);
      throw error;
    }
  },

  // Update event
  async updateEvent(eventId: string, updateData: Partial<Event>): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanUpdateData = cleanFirestoreData(updateData);
      
      await updateDoc(eventRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[eventService] Event updated:', eventId);
    } catch (error) {
      console.error('[eventService] Error updating event:', error);
      throw error;
    }
  },

  // Update event status
  async updateEventStatus(eventId: string, status: Event['status']): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log('[eventService] Event status updated:', eventId, status);
    } catch (error) {
      console.error('[eventService] Error updating event status:', error);
      throw error;
    }
  },

  // Update participant count
  async updateParticipantCount(eventId: string, currentParticipants: number): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        currentParticipants,
        updatedAt: serverTimestamp()
      });
      
      console.log('[eventService] Event participant count updated:', eventId, currentParticipants);
    } catch (error) {
      console.error('[eventService] Error updating participant count:', error);
      throw error;
    }
  },

  // Register for event
  async registerForEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data() as Event;
        const newCount = eventData.currentParticipants + 1;
        
        // Check if event has max participants limit
        if (eventData.maxParticipants && newCount > eventData.maxParticipants) {
          throw new Error('Event is full. Cannot register more participants.');
        }
        
        await updateDoc(eventRef, {
          currentParticipants: newCount,
          updatedAt: serverTimestamp()
        });
        
        console.log('[eventService] User registered for event:', eventId);
      }
    } catch (error) {
      console.error('[eventService] Error registering for event:', error);
      throw error;
    }
  },

  // Unregister from event
  async unregisterFromEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data() as Event;
        const newCount = Math.max(0, eventData.currentParticipants - 1);
        
        await updateDoc(eventRef, {
          currentParticipants: newCount,
          updatedAt: serverTimestamp()
        });
        
        console.log('[eventService] User unregistered from event:', eventId);
      }
    } catch (error) {
      console.error('[eventService] Error unregistering from event:', error);
      throw error;
    }
  },

  // Delete event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await deleteDoc(eventRef);
      
      console.log('[eventService] Event deleted:', eventId);
    } catch (error) {
      console.error('[eventService] Error deleting event:', error);
      throw error;
    }
  },

  // Get event statistics
  async getEventStats(): Promise<{
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    academic: number;
    cultural: number;
    sports: number;
    technical: number;
    social: number;
    other: number;
  }> {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const querySnapshot = await getDocs(eventsRef);
      
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));

      const stats = {
        total: events.length,
        upcoming: events.filter(e => e.status === 'upcoming').length,
        ongoing: events.filter(e => e.status === 'ongoing').length,
        completed: events.filter(e => e.status === 'completed').length,
        cancelled: events.filter(e => e.status === 'cancelled').length,
        academic: events.filter(e => e.category === 'Academic').length,
        cultural: events.filter(e => e.category === 'Cultural').length,
        sports: events.filter(e => e.category === 'Sports').length,
        technical: events.filter(e => e.category === 'Technical').length,
        social: events.filter(e => e.category === 'Social').length,
        other: events.filter(e => e.category === 'Other').length,
      };

      console.log('[eventService] Event stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('[eventService] Error getting event stats:', error);
      throw error;
    }
  }
};

// Club Management Service
export const clubService = {
  // Create a new club
  async createClub(clubData: Omit<Club, 'id'>): Promise<string> {
    try {
      const department = clubData.department || 'All';
      const clubRef = doc(collection(db, COLLECTIONS.CLUBS, department, 'clubs'));
      const clubId = clubRef.id;
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanClubData = cleanFirestoreData(clubData);
      
      await setDoc(clubRef, {
        ...cleanClubData,
        id: clubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubService] Club created:', clubId);
      return clubId;
    } catch (error) {
      console.error('[clubService] Error creating club:', error);
      throw error;
    }
  },

  // Get all clubs
  async getAllClubs(): Promise<Club[]> {
    try {
      // Get all department collections
      const departmentsRef = collection(db, COLLECTIONS.CLUBS);
      const departmentsSnapshot = await getDocs(departmentsRef);
      
      const allClubs: Club[] = [];
      
      // Fetch clubs from each department
      for (const departmentDoc of departmentsSnapshot.docs) {
        const departmentName = departmentDoc.id;
        const clubsRef = collection(db, COLLECTIONS.CLUBS, departmentName, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);
        
        const departmentClubs = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Club));
        
        allClubs.push(...departmentClubs);
      }
      
      return allClubs.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime());
    } catch (error) {
      console.error('[clubService] Error getting clubs:', error);
      throw error;
    }
  },

  // Get clubs by category
  async getClubsByCategory(category: Club['category']): Promise<Club[]> {
    try {
      // Get all department collections
      const departmentsRef = collection(db, COLLECTIONS.CLUBS);
      const departmentsSnapshot = await getDocs(departmentsRef);
      
      const allClubs: Club[] = [];
      
      // Fetch clubs from each department with the specified category
      for (const departmentDoc of departmentsSnapshot.docs) {
        const departmentName = departmentDoc.id;
        const clubsRef = collection(db, COLLECTIONS.CLUBS, departmentName, 'clubs');
        const q = query(clubsRef, where('category', '==', category));
        const clubsSnapshot = await getDocs(q);
        
        const departmentClubs = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Club));
        
        allClubs.push(...departmentClubs);
      }
      
      return allClubs.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime());
    } catch (error) {
      console.error('[clubService] Error getting clubs by category:', error);
      throw error;
    }
  },

  // Get clubs by status
  async getClubsByStatus(status: Club['status']): Promise<Club[]> {
    try {
      // Get all department collections
      const departmentsRef = collection(db, COLLECTIONS.CLUBS);
      const departmentsSnapshot = await getDocs(departmentsRef);
      
      const allClubs: Club[] = [];
      
      // Fetch clubs from each department with the specified status
      for (const departmentDoc of departmentsSnapshot.docs) {
        const departmentName = departmentDoc.id;
        const clubsRef = collection(db, COLLECTIONS.CLUBS, departmentName, 'clubs');
        const q = query(clubsRef, where('status', '==', status));
        const clubsSnapshot = await getDocs(q);
        
        const departmentClubs = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Club));
        
        allClubs.push(...departmentClubs);
      }
      
      return allClubs.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime());
    } catch (error) {
      console.error('[clubService] Error getting clubs by status:', error);
      throw error;
    }
  },

  // Get clubs by department
  async getClubsByDepartment(department: string): Promise<Club[]> {
    try {
      const allClubs: Club[] = [];
      
      // Get clubs from the specific department
      const departmentClubsRef = collection(db, COLLECTIONS.CLUBS, department, 'clubs');
      const departmentClubsSnapshot = await getDocs(departmentClubsRef);
      
      const departmentClubs = departmentClubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Club));
      
      allClubs.push(...departmentClubs);
      
      // Also get clubs from "All" department if they're not department-specific
      if (department !== 'All') {
        const allClubsRef = collection(db, COLLECTIONS.CLUBS, 'All', 'clubs');
        const allClubsSnapshot = await getDocs(allClubsRef);
        
        const generalClubs = allClubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Club));
        
        allClubs.push(...generalClubs);
      }
      
      return allClubs.sort((a, b) => new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime());
    } catch (error) {
      console.error('[clubService] Error getting clubs by department:', error);
      throw error;
    }
  },

  // Get active clubs
  async getActiveClubs(): Promise<Club[]> {
    try {
      return await this.getClubsByStatus('active');
    } catch (error) {
      console.error('[clubService] Error getting active clubs:', error);
      throw error;
    }
  },

  // Find club by ID across all departments
  async findClubById(clubId: string): Promise<{ department: string; clubId: string } | null> {
    try {
      const departmentsRef = collection(db, COLLECTIONS.CLUBS);
      const departmentsSnapshot = await getDocs(departmentsRef);
      
      for (const departmentDoc of departmentsSnapshot.docs) {
        const departmentName = departmentDoc.id;
        const clubsRef = collection(db, COLLECTIONS.CLUBS, departmentName, 'clubs');
        const clubDoc = doc(clubsRef, clubId);
        const clubSnapshot = await getDoc(clubDoc);
        
        if (clubSnapshot.exists()) {
          return { department: departmentName, clubId };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[clubService] Error finding club by ID:', error);
      throw error;
    }
  },

  // Update club
  async updateClub(clubId: string, updateData: Partial<Club>): Promise<void> {
    try {
      const clubLocation = await this.findClubById(clubId);
      if (!clubLocation) {
        throw new Error('Club not found');
      }
      
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubLocation.department, 'clubs', clubLocation.clubId);
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanUpdateData = cleanFirestoreData(updateData);
      
      await updateDoc(clubRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubService] Club updated:', clubId);
    } catch (error) {
      console.error('[clubService] Error updating club:', error);
      throw error;
    }
  },

  // Update club status
  async updateClubStatus(clubId: string, status: Club['status']): Promise<void> {
    try {
      const clubLocation = await this.findClubById(clubId);
      if (!clubLocation) {
        throw new Error('Club not found');
      }
      
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubLocation.department, 'clubs', clubLocation.clubId);
      await updateDoc(clubRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubService] Club status updated:', clubId, status);
    } catch (error) {
      console.error('[clubService] Error updating club status:', error);
      throw error;
    }
  },

  // Update member count
  async updateMemberCount(clubId: string, totalMembers: number): Promise<void> {
    try {
      const clubLocation = await this.findClubById(clubId);
      if (!clubLocation) {
        throw new Error('Club not found');
      }
      
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubLocation.department, 'clubs', clubLocation.clubId);
      await updateDoc(clubRef, {
        totalMembers,
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubService] Club member count updated:', clubId, totalMembers);
    } catch (error) {
      console.error('[clubService] Error updating member count:', error);
      throw error;
    }
  },

  // Delete club
  async deleteClub(clubId: string): Promise<void> {
    try {
      const clubLocation = await this.findClubById(clubId);
      if (!clubLocation) {
        throw new Error('Club not found');
      }
      
      const clubRef = doc(db, COLLECTIONS.CLUBS, clubLocation.department, 'clubs', clubLocation.clubId);
      await deleteDoc(clubRef);
      
      // Also delete all members of this club
      const membersRef = collection(db, COLLECTIONS.CLUB_MEMBERS);
      const q = query(membersRef, where('clubId', '==', clubId));
      const membersSnapshot = await getDocs(q);
      
      const deletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log('[clubService] Club and members deleted:', clubId);
    } catch (error) {
      console.error('[clubService] Error deleting club:', error);
      throw error;
    }
  },

  // Get club statistics
  async getClubStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    academic: number;
    cultural: number;
    sports: number;
    technical: number;
    social: number;
    literary: number;
    other: number;
  }> {
    try {
      const clubsRef = collection(db, COLLECTIONS.CLUBS);
      const querySnapshot = await getDocs(clubsRef);
      
      const clubs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Club));

      const stats = {
        total: clubs.length,
        active: clubs.filter(c => c.status === 'active').length,
        inactive: clubs.filter(c => c.status === 'inactive').length,
        suspended: clubs.filter(c => c.status === 'suspended').length,
        academic: clubs.filter(c => c.category === 'Academic').length,
        cultural: clubs.filter(c => c.category === 'Cultural').length,
        sports: clubs.filter(c => c.category === 'Sports').length,
        technical: clubs.filter(c => c.category === 'Technical').length,
        social: clubs.filter(c => c.category === 'Social').length,
        literary: clubs.filter(c => c.category === 'Literary').length,
        other: clubs.filter(c => c.category === 'Other').length,
      };

      console.log('[clubService] Club stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('[clubService] Error getting club stats:', error);
      throw error;
    }
  }
};

// Club Member Management Service
export const clubMemberService = {
  // Add member to club
  async addMember(memberData: Omit<ClubMember, 'id'>): Promise<string> {
    try {
      const memberRef = doc(collection(db, COLLECTIONS.CLUB_MEMBERS));
      const memberId = memberRef.id;
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanMemberData = cleanFirestoreData(memberData);
      
      await setDoc(memberRef, {
        ...cleanMemberData,
        id: memberId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update club member count
      await clubService.updateMemberCount(memberData.clubId, 0); // Will be recalculated
      
      console.log('[clubMemberService] Member added:', memberId);
      return memberId;
    } catch (error) {
      console.error('[clubMemberService] Error adding member:', error);
      throw error;
    }
  },

  // Get all members of a club
  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    try {
      const membersRef = collection(db, COLLECTIONS.CLUB_MEMBERS);
      const q = query(membersRef, where('clubId', '==', clubId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClubMember));
    } catch (error) {
      console.error('[clubMemberService] Error getting club members:', error);
      throw error;
    }
  },

  // Get members by role
  async getMembersByRole(clubId: string, role: ClubMember['role']): Promise<ClubMember[]> {
    try {
      const membersRef = collection(db, COLLECTIONS.CLUB_MEMBERS);
      const q = query(membersRef, where('clubId', '==', clubId), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClubMember));
    } catch (error) {
      console.error('[clubMemberService] Error getting members by role:', error);
      throw error;
    }
  },

  // Get active members
  async getActiveMembers(clubId: string): Promise<ClubMember[]> {
    try {
      const membersRef = collection(db, COLLECTIONS.CLUB_MEMBERS);
      const q = query(membersRef, where('clubId', '==', clubId), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClubMember));
    } catch (error) {
      console.error('[clubMemberService] Error getting active members:', error);
      throw error;
    }
  },

  // Update member
  async updateMember(memberId: string, updateData: Partial<ClubMember>): Promise<void> {
    try {
      const memberRef = doc(db, COLLECTIONS.CLUB_MEMBERS, memberId);
      
      // Clean data to avoid Firestore errors with undefined/null/empty values
      const cleanUpdateData = cleanFirestoreData(updateData);
      
      await updateDoc(memberRef, {
        ...cleanUpdateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubMemberService] Member updated:', memberId);
    } catch (error) {
      console.error('[clubMemberService] Error updating member:', error);
      throw error;
    }
  },

  // Update member status
  async updateMemberStatus(memberId: string, status: ClubMember['status']): Promise<void> {
    try {
      const memberRef = doc(db, COLLECTIONS.CLUB_MEMBERS, memberId);
      await updateDoc(memberRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log('[clubMemberService] Member status updated:', memberId, status);
    } catch (error) {
      console.error('[clubMemberService] Error updating member status:', error);
      throw error;
    }
  },

  // Remove member from club
  async removeMember(memberId: string): Promise<void> {
    try {
      const memberRef = doc(db, COLLECTIONS.CLUB_MEMBERS, memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const memberData = memberSnap.data() as ClubMember;
        await deleteDoc(memberRef);
        
        // Update club member count
        await clubService.updateMemberCount(memberData.clubId, 0); // Will be recalculated
        
        console.log('[clubMemberService] Member removed:', memberId);
      }
    } catch (error) {
      console.error('[clubMemberService] Error removing member:', error);
      throw error;
    }
  },

  // Get member statistics for a club
  async getMemberStats(clubId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    presidents: number;
    vicePresidents: number;
    secretaries: number;
    treasurers: number;
    members: number;
  }> {
    try {
      const members = await this.getClubMembers(clubId);
      
      const stats = {
        total: members.length,
        active: members.filter(m => m.status === 'active').length,
        inactive: members.filter(m => m.status === 'inactive').length,
        presidents: members.filter(m => m.role === 'President').length,
        vicePresidents: members.filter(m => m.role === 'Vice President').length,
        secretaries: members.filter(m => m.role === 'Secretary').length,
        treasurers: members.filter(m => m.role === 'Treasurer').length,
        members: members.filter(m => m.role === 'Member').length,
      };

      console.log('[clubMemberService] Member stats retrieved for club:', clubId, stats);
      return stats;
    } catch (error) {
      console.error('[clubMemberService] Error getting member stats:', error);
      throw error;
    }
  }
};

// Library Book Service
export const libraryBookService = {
  // Create a new book
  async createBook(bookData: Omit<LibraryBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const bookRef = await addDoc(collection(db, COLLECTIONS.LIBRARY_BOOKS), {
        ...cleanFirestoreData(bookData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[libraryBookService] Book created:', bookRef.id);
      return bookRef.id;
    } catch (error) {
      console.error('[libraryBookService] Error creating book:', error);
      throw error;
    }
  },

  // Get all books
  async getAllBooks(): Promise<LibraryBook[]> {
    try {
      const booksRef = collection(db, COLLECTIONS.LIBRARY_BOOKS);
      const q = query(booksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryBook[];
      
      console.log('[libraryBookService] Books retrieved:', books.length);
      return books;
    } catch (error) {
      console.error('[libraryBookService] Error getting books:', error);
      throw error;
    }
  },

  // Get book by ID
  async getBook(bookId: string): Promise<LibraryBook | null> {
    try {
      const bookRef = doc(db, COLLECTIONS.LIBRARY_BOOKS, bookId);
      const bookSnap = await getDoc(bookRef);
      
      if (bookSnap.exists()) {
        const book = { id: bookSnap.id, ...bookSnap.data() } as LibraryBook;
        console.log('[libraryBookService] Book retrieved:', bookId);
        return book;
      }
      
      return null;
    } catch (error) {
      console.error('[libraryBookService] Error getting book:', error);
      throw error;
    }
  },

  // Update book
  async updateBook(bookId: string, bookData: Partial<LibraryBook>): Promise<void> {
    try {
      const bookRef = doc(db, COLLECTIONS.LIBRARY_BOOKS, bookId);
      await updateDoc(bookRef, {
        ...cleanFirestoreData(bookData),
        updatedAt: serverTimestamp()
      });
      
      console.log('[libraryBookService] Book updated:', bookId);
    } catch (error) {
      console.error('[libraryBookService] Error updating book:', error);
      throw error;
    }
  },

  // Delete book
  async deleteBook(bookId: string): Promise<void> {
    try {
      const bookRef = doc(db, COLLECTIONS.LIBRARY_BOOKS, bookId);
      await deleteDoc(bookRef);
      
      console.log('[libraryBookService] Book deleted:', bookId);
    } catch (error) {
      console.error('[libraryBookService] Error deleting book:', error);
      throw error;
    }
  },

  // Search books
  async searchBooks(searchTerm: string): Promise<LibraryBook[]> {
    try {
      const booksRef = collection(db, COLLECTIONS.LIBRARY_BOOKS);
      const q = query(booksRef, orderBy('title'));
      const querySnapshot = await getDocs(q);
      
      const books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryBook[];
      
      const filteredBooks = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
      );
      
      console.log('[libraryBookService] Books searched:', filteredBooks.length);
      return filteredBooks;
    } catch (error) {
      console.error('[libraryBookService] Error searching books:', error);
      throw error;
    }
  },

  // Get books by category
  async getBooksByCategory(category: LibraryBook['category']): Promise<LibraryBook[]> {
    try {
      const booksRef = collection(db, COLLECTIONS.LIBRARY_BOOKS);
      const q = query(booksRef, where('category', '==', category), orderBy('title'));
      const querySnapshot = await getDocs(q);
      
      const books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryBook[];
      
      console.log('[libraryBookService] Books by category retrieved:', category, books.length);
      return books;
    } catch (error) {
      console.error('[libraryBookService] Error getting books by category:', error);
      throw error;
    }
  },

  // Get available books
  async getAvailableBooks(): Promise<LibraryBook[]> {
    try {
      const booksRef = collection(db, COLLECTIONS.LIBRARY_BOOKS);
      const q = query(booksRef, where('status', '==', 'Available'), orderBy('title'));
      const querySnapshot = await getDocs(q);
      
      const books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryBook[];
      
      console.log('[libraryBookService] Available books retrieved:', books.length);
      return books;
    } catch (error) {
      console.error('[libraryBookService] Error getting available books:', error);
      throw error;
    }
  }
};

// Library Member Service
export const libraryMemberService = {
  // Create a new member
  async createMember(memberData: Omit<LibraryMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const memberRef = await addDoc(collection(db, COLLECTIONS.LIBRARY_MEMBERS), {
        ...cleanFirestoreData(memberData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[libraryMemberService] Member created:', memberRef.id);
      return memberRef.id;
    } catch (error) {
      console.error('[libraryMemberService] Error creating member:', error);
      throw error;
    }
  },

  // Get all members
  async getAllMembers(): Promise<LibraryMember[]> {
    try {
      const membersRef = collection(db, COLLECTIONS.LIBRARY_MEMBERS);
      const q = query(membersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const members = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryMember[];
      
      console.log('[libraryMemberService] Members retrieved:', members.length);
      return members;
    } catch (error) {
      console.error('[libraryMemberService] Error getting members:', error);
      throw error;
    }
  },

  // Get member by ID
  async getMember(memberId: string): Promise<LibraryMember | null> {
    try {
      const memberRef = doc(db, COLLECTIONS.LIBRARY_MEMBERS, memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const member = { id: memberSnap.id, ...memberSnap.data() } as LibraryMember;
        console.log('[libraryMemberService] Member retrieved:', memberId);
        return member;
      }
      
      return null;
    } catch (error) {
      console.error('[libraryMemberService] Error getting member:', error);
      throw error;
    }
  },

  // Update member
  async updateMember(memberId: string, memberData: Partial<LibraryMember>): Promise<void> {
    try {
      const memberRef = doc(db, COLLECTIONS.LIBRARY_MEMBERS, memberId);
      await updateDoc(memberRef, {
        ...cleanFirestoreData(memberData),
        updatedAt: serverTimestamp()
      });
      
      console.log('[libraryMemberService] Member updated:', memberId);
    } catch (error) {
      console.error('[libraryMemberService] Error updating member:', error);
      throw error;
    }
  },

  // Delete member
  async deleteMember(memberId: string): Promise<void> {
    try {
      const memberRef = doc(db, COLLECTIONS.LIBRARY_MEMBERS, memberId);
      await deleteDoc(memberRef);
      
      console.log('[libraryMemberService] Member deleted:', memberId);
    } catch (error) {
      console.error('[libraryMemberService] Error deleting member:', error);
      throw error;
    }
  },

  // Get active members
  async getActiveMembers(): Promise<LibraryMember[]> {
    try {
      const membersRef = collection(db, COLLECTIONS.LIBRARY_MEMBERS);
      const q = query(membersRef, where('status', '==', 'Active'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const members = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryMember[];
      
      console.log('[libraryMemberService] Active members retrieved:', members.length);
      return members;
    } catch (error) {
      console.error('[libraryMemberService] Error getting active members:', error);
      throw error;
    }
  }
};

// Library Transaction Service
export const libraryTransactionService = {
  // Create a new transaction (issue book)
  async createTransaction(transactionData: Omit<LibraryTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const transactionRef = await addDoc(collection(db, COLLECTIONS.LIBRARY_TRANSACTIONS), {
        ...cleanFirestoreData(transactionData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update book availability
      await libraryBookService.updateBook(transactionData.bookId, {
        availableCopies: 0, // Will be calculated properly
        status: 'Issued'
      });
      
      // Update member's current books issued
      await libraryMemberService.updateMember(transactionData.memberId, {
        currentBooksIssued: 1 // Will be calculated properly
      });
      
      console.log('[libraryTransactionService] Transaction created:', transactionRef.id);
      return transactionRef.id;
    } catch (error) {
      console.error('[libraryTransactionService] Error creating transaction:', error);
      throw error;
    }
  },

  // Get all transactions
  async getAllTransactions(): Promise<LibraryTransaction[]> {
    try {
      const transactionsRef = collection(db, COLLECTIONS.LIBRARY_TRANSACTIONS);
      const q = query(transactionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryTransaction[];
      
      console.log('[libraryTransactionService] Transactions retrieved:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('[libraryTransactionService] Error getting transactions:', error);
      throw error;
    }
  },

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<LibraryTransaction | null> {
    try {
      const transactionRef = doc(db, COLLECTIONS.LIBRARY_TRANSACTIONS, transactionId);
      const transactionSnap = await getDoc(transactionRef);
      
      if (transactionSnap.exists()) {
        const transaction = { id: transactionSnap.id, ...transactionSnap.data() } as LibraryTransaction;
        console.log('[libraryTransactionService] Transaction retrieved:', transactionId);
        return transaction;
      }
      
      return null;
    } catch (error) {
      console.error('[libraryTransactionService] Error getting transaction:', error);
      throw error;
    }
  },

  // Update transaction (return book)
  async updateTransaction(transactionId: string, transactionData: Partial<LibraryTransaction>): Promise<void> {
    try {
      const transactionRef = doc(db, COLLECTIONS.LIBRARY_TRANSACTIONS, transactionId);
      await updateDoc(transactionRef, {
        ...cleanFirestoreData(transactionData),
        updatedAt: serverTimestamp()
      });
      
      console.log('[libraryTransactionService] Transaction updated:', transactionId);
    } catch (error) {
      console.error('[libraryTransactionService] Error updating transaction:', error);
      throw error;
    }
  },

  // Return book
  async returnBook(transactionId: string, returnedBy: string): Promise<void> {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) throw new Error('Transaction not found');
      
      // Update transaction
      await this.updateTransaction(transactionId, {
        status: 'Returned',
        returnDate: new Date().toISOString().split('T')[0],
        returnedBy
      });
      
      // Update book availability
      await libraryBookService.updateBook(transaction.bookId, {
        status: 'Available'
      });
      
      // Update member's current books issued
      await libraryMemberService.updateMember(transaction.memberId, {
        currentBooksIssued: 0 // Will be calculated properly
      });
      
      console.log('[libraryTransactionService] Book returned:', transactionId);
    } catch (error) {
      console.error('[libraryTransactionService] Error returning book:', error);
      throw error;
    }
  },

  // Get overdue transactions
  async getOverdueTransactions(): Promise<LibraryTransaction[]> {
    try {
      const transactionsRef = collection(db, COLLECTIONS.LIBRARY_TRANSACTIONS);
      const q = query(transactionsRef, where('status', '==', 'Issued'), orderBy('dueDate'));
      const querySnapshot = await getDocs(q);
      
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryTransaction[];
      
      const today = new Date().toISOString().split('T')[0];
      const overdueTransactions = transactions.filter(transaction => 
        transaction.dueDate < today
      );
      
      console.log('[libraryTransactionService] Overdue transactions retrieved:', overdueTransactions.length);
      return overdueTransactions;
    } catch (error) {
      console.error('[libraryTransactionService] Error getting overdue transactions:', error);
      throw error;
    }
  }
};
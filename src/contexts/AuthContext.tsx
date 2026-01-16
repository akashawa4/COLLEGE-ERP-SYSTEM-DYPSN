import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { userService, visitorService } from '../firebase/firestore';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  loginAsVisitor: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  ensureDemoUsersInFirestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default HOD user
const defaultHOD: User = {
  id: 'hod001',
  name: 'HOD CSE',
  email: 'hodcse@gmail.com',
  role: 'hod',
  department: 'CSE',
  accessLevel: 'full',
  isActive: true,
  phone: '+91 98765 43210',
  rollNumber: 'HOD001',
  joiningDate: '2020-01-01',
  designation: 'Head of Department',
  gender: 'Male',
  year: '1',
  sem: '1',
  div: 'A'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure demo users are in Firestore on app start
    ensureDemoUsersInFirestore();

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      // Ignore anonymous auth for app role/state to prevent role switches
      if (firebaseUser && (firebaseUser as any).isAnonymous) {
        setIsLoading(false);
        return;
      }

      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          // Try to get user data from Firestore
          const userData = await userService.getUser(firebaseUser.uid);

          if (userData) {
            setUser(userData);
            localStorage.setItem('dypsn_user', JSON.stringify(userData));
          } else {
            // Create basic user data for Firebase user
            const basicUserData: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'student', // Default role
              department: 'Computer Science',
              accessLevel: 'basic',
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              loginCount: 1
            };

            // Save to Firestore
            await userService.createUser(basicUserData);
            setUser(basicUserData);
            localStorage.setItem('dypsn_user', JSON.stringify(basicUserData));
          }
        } catch (error) {
          // Handle error silently
        }
      } else {
        // Check for stored demo user
        const storedUser = localStorage.getItem('dypsn_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First check if it's the default HOD user
      if (email === defaultHOD.email && password === 'hodcse2025@attendance') {

        // Check if user already exists in Firestore
        const existingHOD = await userService.getUser(defaultHOD.id);

        if (existingHOD) {
          // Update existing user with new login info
          await userService.updateUser(defaultHOD.id, {
            lastLogin: new Date().toISOString(),
            loginCount: (existingHOD.loginCount || 0) + 1
          });
        } else {
          // Create new user in Firestore
          await userService.createUser({
            ...defaultHOD,
            lastLogin: new Date().toISOString(),
            loginCount: 1,
            createdAt: new Date().toISOString()
          });
        }
        setUser(defaultHOD);
        localStorage.setItem('dypsn_user', JSON.stringify(defaultHOD));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      }

      // Check if it's an admin user (no Firebase Auth needed)
      // Admin hierarchy: Principal > Director > Registrar > Admin
      const adminUsers: { [key: string]: { password: string; user: User } } = {
        'principal@dypsn.edu': {
          password: 'principal@2025',
          user: {
            id: 'principal001',
            name: 'Dr. Rajesh Sharma',
            email: 'principal@dypsn.edu',
            phone: '9876543200',
            role: 'admin',
            adminRole: 'principal',
            department: 'Administration',
            accessLevel: 'full',
            isActive: true,
            rollNumber: 'PRIN001',
            joiningDate: '2015-01-01',
            designation: 'Principal',
            gender: 'Male'
          }
        },
        'director@dypsn.edu': {
          password: 'director@2025',
          user: {
            id: 'director001',
            name: 'Dr. Sunita Patil',
            email: 'director@dypsn.edu',
            phone: '9876543201',
            role: 'admin',
            adminRole: 'director',
            department: 'Administration',
            accessLevel: 'full',
            isActive: true,
            rollNumber: 'DIR001',
            joiningDate: '2016-01-01',
            designation: 'Director',
            gender: 'Female'
          }
        },
        'registrar@dypsn.edu': {
          password: 'registrar@2025',
          user: {
            id: 'registrar001',
            name: 'Mr. Anil Kumar',
            email: 'registrar@dypsn.edu',
            phone: '9876543202',
            role: 'admin',
            adminRole: 'registrar',
            department: 'Academic Administration',
            accessLevel: 'full',
            isActive: true,
            rollNumber: 'REG001',
            joiningDate: '2018-01-01',
            designation: 'Registrar',
            gender: 'Male'
          }
        },
        'admin@dypsn.edu': {
          password: 'admin@2025',
          user: {
            id: 'admin001',
            name: 'Mr. Vijay Deshmukh',
            email: 'admin@dypsn.edu',
            phone: '9876543212',
            role: 'admin',
            adminRole: 'admin',
            department: 'System Administration',
            accessLevel: 'full',
            isActive: true,
            rollNumber: 'ADMIN001',
            joiningDate: '2020-01-01',
            designation: 'System Administrator',
            gender: 'Male'
          }
        }
      };

      // Check if email matches any admin user
      if (adminUsers[email] && password === adminUsers[email].password) {
        const adminData = adminUsers[email];
        const adminUser = adminData.user;

        // Check if admin user exists in Firestore, create if not
        try {
          const existingAdmin = await userService.getUser(adminUser.id);
          if (existingAdmin) {
            // Update existing admin with new login info
            await userService.updateUser(adminUser.id, {
              lastLogin: new Date().toISOString(),
              loginCount: (existingAdmin.loginCount || 0) + 1
            });
          } else {
            // Create new admin user in Firestore
            await userService.createUser({
              ...adminUser,
              lastLogin: new Date().toISOString(),
              loginCount: 1,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('[AuthContext] Error managing admin user:', error);
        }

        setUser(adminUser);
        localStorage.setItem('dypsn_user', JSON.stringify(adminUser));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      }

      // Run student, teacher, non-teaching staff, library staff, and driver validation in parallel using Promise.all - much faster!

      const [studentResult, teacherResult, nonTeachingResult, libraryStaffResult, driverResult] = await Promise.all([
        userService.validateStudentCredentials(email, password).catch(() => {
          // Handle error silently
          return null;
        }),
        userService.validateTeacherCredentials(email, password).catch(() => {
          // Handle error silently
          return null;
        }),
        userService.validateNonTeachingCredentials(email, password).catch(() => {
          // Handle error silently
          return null;
        }),
        userService.validateLibraryStaffCredentials(email, password).catch(() => {
          // Handle error silently
          return null;
        }),
        userService.validateDriverCredentials(email, password).catch(() => {
          // Handle error silently
          return null;
        })
      ]);

      // Check student login result
      if (studentResult) {
        console.log('[AuthContext] Student login with phone number:', studentResult.email);
        await userService.updateUser(studentResult.id, {
          lastLogin: new Date().toISOString(),
          loginCount: (studentResult.loginCount || 0) + 1
        });
        setUser(studentResult);
        localStorage.setItem('dypsn_user', JSON.stringify(studentResult));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      }

      // Check teacher login result
      if (teacherResult) {
        console.log('[AuthContext] Teacher login successful:', teacherResult.email);
        await userService.updateUser(teacherResult.id, {
          lastLogin: new Date().toISOString(),
          loginCount: (teacherResult.loginCount || 0) + 1
        });
        setUser(teacherResult);
        localStorage.setItem('dypsn_user', JSON.stringify(teacherResult));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      } else {
        console.log('[AuthContext] Teacher validation returned null for:', email);
      }

      // Check non-teaching staff login result
      if (nonTeachingResult) {
        console.log('[AuthContext] Non-Teaching Staff login successful:', nonTeachingResult.email);
        await userService.updateUser(nonTeachingResult.id, {
          lastLogin: new Date().toISOString(),
          loginCount: (nonTeachingResult.loginCount || 0) + 1
        });
        setUser(nonTeachingResult);
        localStorage.setItem('dypsn_user', JSON.stringify(nonTeachingResult));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      } else {
        console.log('[AuthContext] Non-Teaching Staff validation returned null for:', email);
      }

      // Check library staff login result
      if (libraryStaffResult) {
        console.log('[AuthContext] Library Staff login successful:', libraryStaffResult.email);
        await userService.updateUser(libraryStaffResult.id, {
          lastLogin: new Date().toISOString(),
          loginCount: (libraryStaffResult.loginCount || 0) + 1
        });
        setUser(libraryStaffResult);
        localStorage.setItem('dypsn_user', JSON.stringify(libraryStaffResult));
        // Clear old page state and set to dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'dashboard');
        return;
      } else {
        console.log('[AuthContext] Library Staff validation returned null for:', email);
      }

      // Check driver login result
      if (driverResult) {
        console.log('[AuthContext] Driver login successful:', driverResult.email);
        await userService.updateUser(driverResult.id, {
          lastLogin: new Date().toISOString(),
          loginCount: (driverResult.loginCount || 0) + 1
        });
        setUser(driverResult);
        localStorage.setItem('dypsn_user', JSON.stringify(driverResult));
        // Clear old page state and set to driver dashboard on login
        localStorage.removeItem('dypsn_current_page');
        localStorage.setItem('dypsn_current_page', 'driver-dashboard');
        return;
      } else {
        console.log('[AuthContext] Driver validation returned null for:', email);
      }

      // Try regular Firebase authentication for teachers/HODs
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // User data will be handled by the auth state listener
        console.log('[AuthContext] Firebase authentication successful');
      } catch (firebaseError: any) {
        // If Firebase auth fails, check if user exists in our database
        const existingUser = await userService.getUser(email);
        if (existingUser) {
          throw new Error('Invalid password. Please try again.');
        } else {
          throw new Error('User not found. Please check your email or contact administrator.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      // Create complete user data
      const completeUserData: User = {
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.displayName || email.split('@')[0],
        email: email,
        role: userData.role || 'student',
        department: userData.department || 'Computer Science',
        accessLevel: userData.accessLevel || 'basic',
        isActive: true,
        phone: userData.phone,
        rollNumber: userData.rollNumber,
        joiningDate: userData.joiningDate,
        designation: userData.designation,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 1
      };
      // Save to Firestore
      await userService.createUser(completeUserData);
      setUser(completeUserData);
      localStorage.setItem('dypsn_user', JSON.stringify(completeUserData));
    } catch (error: any) {
      console.error('Error creating user account:', error);
      throw new Error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsVisitor = async () => {
    setIsLoading(true);
    try {
      // Create or reuse a local visitor session
      const existing = localStorage.getItem('dypsn_visitor');
      let visitor: User;
      if (existing) {
        visitor = JSON.parse(existing);
      } else {
        visitor = {
          id: `visitor_${Date.now()}`,
          name: 'Visitor',
          email: '',
          role: 'visitor',
          department: 'Guest',
          accessLevel: 'basic',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginCount: 1
        } as unknown as User;
        localStorage.setItem('dypsn_visitor', JSON.stringify(visitor));
      }
      // Ensure a stable deviceId
      const deviceId = localStorage.getItem('dypsn_device_id') || (() => {
        const id = `dev_${crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
        localStorage.setItem('dypsn_device_id', id);
        return id;
      })();
      // Upsert minimal visitor record (without PII if not provided yet)
      await visitorService.upsertVisitor({ deviceId, id: deviceId });

      // Determine if we already have name/phone either locally or in cloud
      const localVisitor = (() => {
        try { return JSON.parse(localStorage.getItem('dypsn_visitor') || 'null'); } catch { return null; }
      })();
      let hasDetails = Boolean(localVisitor?.name && localVisitor?.phone);
      if (!hasDetails) {
        try {
          const cloud = await visitorService.getVisitorByDevice(deviceId);
          if (cloud?.name && cloud?.phone) {
            localStorage.setItem('dypsn_visitor', JSON.stringify({ name: cloud.name, phone: cloud.phone, purpose: cloud.purpose }));
            hasDetails = true;
          }
        } catch { }
      }

      setUser(visitor);
      localStorage.setItem('dypsn_user', JSON.stringify(visitor));
      localStorage.setItem('dypsn_current_page', hasDetails ? 'visitor-home' : 'visitor-info');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
    }

    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('dypsn_user');
    localStorage.removeItem('dypsn_visitor');
    localStorage.removeItem('dypsn_current_page');
  };

  const ensureDemoUsersInFirestore = async () => {
    console.log('[AuthContext] Ensuring demo users are in Firestore...');
    
    // Populate dummy students to Firestore in batch structure
    try {
      const { dummyDataService, getCurrentBatchYear } = await import('../firebase/firestore');
      const batch = getCurrentBatchYear();
      console.log(`[AuthContext] Populating dummy students to batch ${batch}...`);
      const result = await dummyDataService.populateDummyStudentsToFirestore(batch);
      if (result.success) {
        console.log(`[AuthContext] Successfully populated ${result.added} dummy students`);
      } else {
        console.warn(`[AuthContext] Failed to populate dummy students:`, result.errors);
      }
    } catch (error) {
      console.error('[AuthContext] Error populating dummy students:', error);
    }

    // Demo users data
    const demoUsers = [
      {
        id: 'student001',
        name: 'Demo Student',
        email: 'student.demo@dypsn.edu',
        phone: '9876543210',
        role: 'student' as const,
        department: 'CSE',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'CS001',
        joiningDate: '2023-01-01',
        designation: 'Student',
        gender: 'Male',
        year: '2nd',
        sem: '3',
        div: 'A'
      },
      {
        id: 'teacher001',
        name: 'Prof. Sarah Johnson',
        email: 'sarah.johnson@dypsn.edu',
        phone: '9876543211',
        role: 'teacher' as const,
        department: 'CSE',
        accessLevel: 'approver' as const,
        isActive: true,
        rollNumber: 'T001',
        joiningDate: '2020-01-01',
        designation: 'Associate Professor',
        gender: 'Female',
        year: '1',
        sem: '1',
        div: 'A'
      },
      // Admin Users - Hierarchy: Principal > Director > Registrar > Admin
      {
        id: 'principal001',
        name: 'Dr. Rajesh Sharma',
        email: 'principal@dypsn.edu',
        phone: '9876543200',
        role: 'admin' as const,
        adminRole: 'principal' as const,
        department: 'Administration',
        accessLevel: 'full' as const,
        isActive: true,
        rollNumber: 'PRIN001',
        joiningDate: '2015-01-01',
        designation: 'Principal',
        gender: 'Male'
      },
      {
        id: 'director001',
        name: 'Dr. Sunita Patil',
        email: 'director@dypsn.edu',
        phone: '9876543201',
        role: 'admin' as const,
        adminRole: 'director' as const,
        department: 'Administration',
        accessLevel: 'full' as const,
        isActive: true,
        rollNumber: 'DIR001',
        joiningDate: '2016-01-01',
        designation: 'Director',
        gender: 'Female'
      },
      {
        id: 'registrar001',
        name: 'Mr. Anil Kumar',
        email: 'registrar@dypsn.edu',
        phone: '9876543202',
        role: 'admin' as const,
        adminRole: 'registrar' as const,
        department: 'Academic Administration',
        accessLevel: 'full' as const,
        isActive: true,
        rollNumber: 'REG001',
        joiningDate: '2018-01-01',
        designation: 'Registrar',
        gender: 'Male'
      },
      {
        id: 'admin001',
        name: 'Mr. Vijay Deshmukh',
        email: 'admin@dypsn.edu',
        phone: '9876543212',
        role: 'admin' as const,
        adminRole: 'admin' as const,
        department: 'System Administration',
        accessLevel: 'full' as const,
        isActive: true,
        rollNumber: 'ADMIN001',
        joiningDate: '2020-01-01',
        designation: 'System Administrator',
        gender: 'Male'
      },
      // Non-Teaching Staff Demo Users
      {
        id: 'cleaner001',
        name: 'Ramesh Kumar',
        email: 'cleaner.demo@dypsn.edu',
        phone: '9876543213',
        role: 'non-teaching' as const,
        department: 'Maintenance',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'CL001',
        joiningDate: '2022-01-01',
        designation: 'Cleaner',
        gender: 'Male',
        subRole: 'cleaner' as const,
        workShift: 'morning' as const,
        workLocation: 'Main Building',
        supervisor: 'Maintenance Head',
        contractType: 'permanent' as const,
        workStatus: 'active' as const
      },
      {
        id: 'peon001',
        name: 'Suresh Singh',
        email: 'peon.demo@dypsn.edu',
        phone: '9876543214',
        role: 'non-teaching' as const,
        department: 'Administration',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'PE001',
        joiningDate: '2021-06-01',
        designation: 'Peon',
        gender: 'Male',
        subRole: 'peon' as const,
        workShift: 'full-day' as const,
        workLocation: 'Admin Office',
        supervisor: 'Admin Officer',
        contractType: 'permanent' as const,
        workStatus: 'active' as const
      },
      {
        id: 'labassistant001',
        name: 'Priya Sharma',
        email: 'labassistant.demo@dypsn.edu',
        phone: '9876543215',
        role: 'non-teaching' as const,
        department: 'CSE',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'LA001',
        joiningDate: '2022-03-01',
        designation: 'Lab Assistant',
        gender: 'Female',
        subRole: 'lab-assistant' as const,
        workShift: 'full-day' as const,
        workLocation: 'Computer Lab',
        supervisor: 'Lab Incharge',
        contractType: 'permanent' as const,
        workStatus: 'active' as const
      },
      {
        id: 'security001',
        name: 'Vikram Singh',
        email: 'security.demo@dypsn.edu',
        phone: '9876543216',
        role: 'non-teaching' as const,
        department: 'Security',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'SEC001',
        joiningDate: '2021-01-01',
        designation: 'Security Guard',
        gender: 'Male',
        subRole: 'security' as const,
        workShift: 'night' as const,
        workLocation: 'Main Gate',
        supervisor: 'Security Head',
        contractType: 'permanent' as const,
        workStatus: 'active' as const
      },
      {
        id: 'library001',
        name: 'Dr. Meera Patel',
        email: 'library.demo@dypsn.edu',
        phone: '9876543217',
        role: 'non-teaching' as const,
        subRole: 'library-staff' as const,
        department: 'Library',
        accessLevel: 'full' as const,
        isActive: true,
        rollNumber: 'LIB001',
        joiningDate: '2020-08-01',
        designation: 'Librarian',
        gender: 'Female'
      },
      {
        id: 'driver001',
        name: 'Rajesh Kumar',
        email: 'driver@dypsn.edu',
        phone: '9876543218',
        role: 'driver' as const,
        department: 'Transport',
        accessLevel: 'basic' as const,
        isActive: true,
        rollNumber: 'DR001',
        joiningDate: '2020-01-01',
        designation: 'Bus Driver',
        gender: 'Male',
        year: '1',
        sem: '1',
        workShift: 'full-day' as const,
        workLocation: 'Transport Department',
        contractType: 'permanent' as const,
        workStatus: 'active' as const
      }
    ];

    try {
      // Ensure HOD user
      const existingHOD = await userService.getUser(defaultHOD.id);
      if (!existingHOD) {
        console.log('[AuthContext] Creating default HOD user in Firestore:', defaultHOD.email);
        await userService.createUser({
          ...defaultHOD,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          loginCount: 0
        });
        console.log('[AuthContext] Default HOD user created successfully');
      } else {
        console.log('[AuthContext] Default HOD user already exists in Firestore');
      }

      // Ensure demo users
      for (const demoUser of demoUsers) {
        try {
          const existingUser = await userService.getUser(demoUser.id);
          if (!existingUser) {
            console.log(`[AuthContext] Creating demo ${demoUser.role} user:`, demoUser.email);
            await userService.createUser({
              ...demoUser,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              loginCount: 0
            });
            console.log(`[AuthContext] Demo ${demoUser.role} user created successfully`);
          } else {
            console.log(`[AuthContext] Demo ${demoUser.role} user already exists in Firestore`);
          }
        } catch (error) {
          console.error(`[AuthContext] Error creating demo ${demoUser.role} user:`, error);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error ensuring demo users in Firestore:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, signUp, loginAsVisitor, logout, isLoading, ensureDemoUsersInFirestore }}>
      {children}
    </AuthContext.Provider>
  );
};



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
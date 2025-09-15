// Script to initialize default departments in Firestore
// Run this script to set up the initial department data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

async function initializeDepartments() {
  try {
    console.log('🚀 Starting department initialization...');
    
    // Check if departments already exist
    const departmentsRef = collection(db, 'departments');
    const existingDepartments = await getDocs(departmentsRef);
    
    if (!existingDepartments.empty) {
      console.log('✅ Departments already exist, skipping initialization');
      return;
    }
    
    // Create departments
    for (const dept of defaultDepartments) {
      const departmentRef = doc(collection(db, 'departments'));
      const departmentData = {
        id: departmentRef.id,
        ...dept,
        totalTeachers: 0,
        totalStudents: 0,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(departmentRef, departmentData);
      console.log(`✅ Created department: ${dept.name} (${dept.code})`);
    }
    
    console.log('🎉 Department initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error initializing departments:', error);
  }
}

// Run the initialization
initializeDepartments();


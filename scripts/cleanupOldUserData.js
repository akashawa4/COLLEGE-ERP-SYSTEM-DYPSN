// Script to clean up old user data that might be in wrong collections
// This script helps migrate from old user structure to new role-based structure

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase config (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupOldUserData() {
  console.log('Starting cleanup of old user data...');
  
  try {
    // Check if there are any users in the old structure (directly in /users collection)
    const oldUsersRef = collection(db, 'users');
    const oldUsersSnapshot = await getDocs(oldUsersRef);
    
    console.log(`Found ${oldUsersSnapshot.docs.length} documents in old users collection`);
    
    if (oldUsersSnapshot.docs.length > 0) {
      console.log('Found old user data. These should be migrated to role-based collections.');
      console.log('Old user documents:');
      
      for (const docSnapshot of oldUsersSnapshot.docs) {
        const userData = docSnapshot.data();
        console.log(`- ID: ${docSnapshot.id}, Role: ${userData.role}, Name: ${userData.name}`);
        
        // You can uncomment the following lines to delete old data
        // WARNING: Only do this after ensuring all users are properly migrated
        // await deleteDoc(docSnapshot.ref);
        // console.log(`Deleted old user document: ${docSnapshot.id}`);
      }
    } else {
      console.log('No old user data found. Structure is clean.');
    }
    
    // Check role-based collections
    const roles = ['student', 'teacher', 'hod', 'admin', 'non-teaching', 'visitor', 'driver'];
    
    for (const role of roles) {
      try {
        const roleUsersRef = collection(db, 'users', role);
        const roleUsersSnapshot = await getDocs(roleUsersRef);
        console.log(`Role '${role}': ${roleUsersSnapshot.docs.length} users`);
      } catch (error) {
        console.log(`Role '${role}': Collection doesn't exist or error accessing it`);
      }
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupOldUserData().then(() => {
  console.log('Cleanup completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});


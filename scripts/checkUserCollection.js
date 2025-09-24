const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to update the path to your service account key)
const serviceAccount = require('../path/to/your/serviceAccountKey.json'); // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserCollection() {
  console.log('🔍 Checking user collection structure...');

  try {
    // Check the root users collection
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    console.log(`📊 Found ${usersSnapshot.size} documents in root 'users' collection:`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- Document ID: ${doc.id}`);
      console.log(`  Role: ${data.role || 'No role'}`);
      console.log(`  Email: ${data.email || 'No email'}`);
      console.log(`  Name: ${data.name || 'No name'}`);
      console.log('---');
    });

    // Check for role subcollections
    const roles = ['student', 'teacher', 'hod', 'admin', 'non-teaching', 'visitor', 'driver'];
    
    for (const role of roles) {
      try {
        const roleRef = db.collection('users').doc(role);
        const roleDoc = await roleRef.get();
        
        if (roleDoc.exists) {
          console.log(`⚠️  Found document at users/${role} - this might be causing conflicts!`);
          console.log(`   Data:`, roleDoc.data());
        } else {
          console.log(`✅ No document at users/${role}`);
        }

        // Check if there are subcollections under this role
        const subcollections = await roleRef.listCollections();
        if (subcollections.length > 0) {
          console.log(`📁 Found ${subcollections.length} subcollections under users/${role}`);
          for (const subcol of subcollections) {
            const subcolSnapshot = await subcol.get();
            console.log(`   - ${subcol.id}: ${subcolSnapshot.size} documents`);
          }
        }
      } catch (error) {
        console.log(`❌ Error checking users/${role}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error checking user collection:', error);
  }
}

checkUserCollection().catch(console.error);


const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('/home/ubuntu/oceanpearl-ops-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createCEOUser() {
  const email = 'ceo@oceanpearlseafood.com';
  const password = 'OceanPearl2026!';
  
  try {
    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('✅ CEO user already exists:', email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create user
        userRecord = await auth.createUser({
          email,
          password,
          displayName: 'CEO Ocean Pearl',
          emailVerified: true
        });
        console.log('✅ Created CEO user:', email);
      } else {
        throw error;
      }
    }
    
    // Create/update Firestore profile
    await db.collection('v3_users').doc(userRecord.uid).set({
      email,
      role: 'ADMIN',
      displayName: 'CEO Ocean Pearl',
      allowedLocations: [],
      allowedUnits: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      bootstrapped: true
    }, { merge: true });
    
    console.log('✅ Created Firestore profile for CEO');
    console.log('\n🎉 CEO user ready!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now sign in at: https://oceanpearl-ops.web.app');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCEOUser();

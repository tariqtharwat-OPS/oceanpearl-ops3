const admin = require('firebase-admin');

// Initialize with explicit project ID
admin.initializeApp({
  projectId: 'oceanpearl-ops'
});

const testUsers = [
  { email: 'ceo@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'CEO', displayName: 'CEO' },
  { email: 'finance@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'HQ_FINANCE', displayName: 'Finance Manager' },
  { email: 'manager.kaimana@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'LOCATION_MANAGER', displayName: 'Kaimana Manager' },
  { email: 'operator.boat1@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'OPERATOR', displayName: 'Boat 1 Operator' },
  { email: 'investor@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'INVESTOR', displayName: 'Investor' }
];

async function createUsers() {
  const db = admin.firestore();
  
  for (const userData of testUsers) {
    try {
      // Create auth user
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      });
      
      console.log(`✓ Created auth user: ${userData.email} (UID: ${userRecord.uid})`);
      
      // Create Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        companyEmail: userData.email,
        allowedLocations: [],
        allowedUnits: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✓ Created Firestore doc for: ${userData.email}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠ User already exists: ${userData.email}`);
      } else {
        console.error(`✗ Error creating ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log('\n=== Test Users Created ===');
  console.log('Standard Password: OceanPearl2026!');
  console.log('\nAccounts:');
  testUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
}

createUsers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

const admin = require('firebase-admin');

// Initialize with explicit project ID
admin.initializeApp({
  projectId: 'oceanpearl-ops'
});

const testUsers = [
  { email: 'ceo@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'ceo', displayName: 'CEO' },
  { email: 'finance@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'finance_officer', displayName: 'Finance Manager' },
  { email: 'manager.kaimana@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'location_manager', displayName: 'Kaimana Manager' },
  { email: 'operator.boat1@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'unit_operator', displayName: 'Boat 1 Operator' },
  { email: 'investor@oceanpearlseafood.com', password: 'OceanPearl2026!', role: 'investor', displayName: 'Investor' }
];

async function createUsers() {
  const db = admin.firestore();

  for (const userData of testUsers) {
    try {
      // Create auth user
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(userData.email);
        console.log(`✓ Auth user exists: ${userData.email} (UID: ${userRecord.uid})`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await admin.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          });
          console.log(`✓ Created auth user: ${userData.email} (UID: ${userRecord.uid})`);
        } else {
          throw e;
        }
      }

      // Create Firestore user document (v3_users)
      await db.collection('v3_users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        companyEmail: userData.email,
        allowedLocations: [],
        allowedUnits: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`✓ Created/Updated v3_users doc for: ${userData.email} [${userData.role}]`);

    } catch (error) {
      console.error(`✗ Error processing ${userData.email}:`, error.message);
    }
  }

  console.log('\n=== Test Users Seeded (Canonical) ===');
  console.log('Standard Password: OceanPearl2026!');
  console.log('\nAccounts (v3_users):');
  testUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
}

createUsers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

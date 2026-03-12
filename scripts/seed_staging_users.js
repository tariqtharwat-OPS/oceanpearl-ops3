/**
 * Seed staging test users via Firebase Admin SDK
 * Creates all 6 test users in Firebase Auth + v3_users Firestore collection
 * Uses service account for admin access
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'oceanpearl-ops'
});

const db = admin.firestore();
const auth = admin.auth();

const PASSWORD = 'Test Test 123';

const TEST_USERS = [
  {
    email: 'tariq@oceanpearlseafood.com',
    displayName: 'Tariq Tharwat (CEO)',
    role: 'ceo',
    allowedLocationIds: ['LOC-HQ', 'LOC-HUB-01', 'LOC-FACTORY-01', 'LOC-BOAT-01'],
    allowedUnitIds: ['UNIT-HQ', 'UNIT-HUB-01', 'UNIT-FACTORY-01', 'UNIT-BOAT-01']
  },
  {
    email: 'admin@oceanpearlseafood.com',
    displayName: 'Admin User',
    role: 'admin',
    allowedLocationIds: ['LOC-HQ', 'LOC-HUB-01', 'LOC-FACTORY-01', 'LOC-BOAT-01'],
    allowedUnitIds: ['UNIT-HQ', 'UNIT-HUB-01', 'UNIT-FACTORY-01', 'UNIT-BOAT-01']
  },
  {
    email: 'hub.operator@oceanpearlseafood.com',
    displayName: 'Hub Operator',
    role: 'hub_operator',
    allowedLocationIds: ['LOC-HUB-01'],
    allowedUnitIds: ['UNIT-HUB-01']
  },
  {
    email: 'boat.operator@oceanpearlseafood.com',
    displayName: 'Boat Operator',
    role: 'boat_operator',
    allowedLocationIds: ['LOC-BOAT-01'],
    allowedUnitIds: ['UNIT-BOAT-01']
  },
  {
    email: 'factory.operator@oceanpearlseafood.com',
    displayName: 'Factory Operator',
    role: 'factory_operator',
    allowedLocationIds: ['LOC-FACTORY-01'],
    allowedUnitIds: ['UNIT-FACTORY-01']
  },
  {
    email: 'finance@oceanpearlseafood.com',
    displayName: 'Finance Officer',
    role: 'finance_officer',
    allowedLocationIds: ['LOC-HQ'],
    allowedUnitIds: ['UNIT-HQ']
  }
];

async function seedUsers() {
  console.log('Seeding staging test users...\n');
  
  for (const user of TEST_USERS) {
    try {
      // Try to get existing user first
      let uid;
      try {
        const existing = await auth.getUserByEmail(user.email);
        uid = existing.uid;
        // Update password
        await auth.updateUser(uid, { password: PASSWORD, displayName: user.displayName });
        console.log(`✓ Updated Auth user: ${user.email} (${uid})`);
      } catch (e) {
        // Create new user
        const created = await auth.createUser({
          email: user.email,
          password: PASSWORD,
          displayName: user.displayName,
          emailVerified: true
        });
        uid = created.uid;
        console.log(`✓ Created Auth user: ${user.email} (${uid})`);
      }
      
      // Write v3_users profile
      await db.collection('v3_users').doc(uid).set({
        uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        allowedLocationIds: user.allowedLocationIds,
        allowedUnitIds: user.allowedUnitIds,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'seed_script',
        active: true
      }, { merge: true });
      
      console.log(`  ✓ v3_users profile: role=${user.role}`);
      
    } catch (err) {
      console.error(`✗ Failed for ${user.email}:`, err.message);
    }
  }
  
  console.log('\n✅ All staging users seeded successfully!');
  console.log('\nCredentials:');
  TEST_USERS.forEach(u => {
    console.log(`  ${u.role.padEnd(18)} ${u.email}`);
  });
  console.log(`\nPassword for all users: "${PASSWORD}"`);
  
  process.exit(0);
}

seedUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Cleanup: Delete all test users except admin
 * Keeps only: admin@oceanpearlseafood.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'oceanpearl-ops'
});

const db = admin.firestore();
const auth = admin.auth();

// Keep only admin
const KEEP_EMAIL = 'admin@oceanpearlseafood.com';

// Delete these users
const DELETE_EMAILS = [
  'tariq@oceanpearlseafood.com',
  'hub.operator@oceanpearlseafood.com',
  'boat.operator@oceanpearlseafood.com',
  'factory.operator@oceanpearlseafood.com',
  'finance@oceanpearlseafood.com'
];

async function cleanup() {
  console.log('Cleaning up test users (keeping admin only)...\n');

  for (const email of DELETE_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      await db.collection('v3_users').doc(user.uid).delete();
      console.log(`✓ Deleted: ${email} (${user.uid})`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log(`  (not found, skipping): ${email}`);
      } else {
        console.error(`✗ Error deleting ${email}:`, e.message);
      }
    }
  }

  // Verify admin still exists
  try {
    const admin_user = await auth.getUserByEmail(KEEP_EMAIL);
    const profile = await db.collection('v3_users').doc(admin_user.uid).get();
    console.log(`\n✅ Admin account confirmed:`);
    console.log(`   Email: ${KEEP_EMAIL}`);
    console.log(`   UID: ${admin_user.uid}`);
    console.log(`   Role: ${profile.data()?.role}`);
    console.log(`   Password: Test Test 123`);
  } catch (e) {
    console.error('Admin account check failed:', e.message);
  }

  process.exit(0);
}

cleanup().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

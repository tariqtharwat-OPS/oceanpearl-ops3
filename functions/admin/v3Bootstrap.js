/**
 * V3 BOOTSTRAP
 * 
 * One-time initialization function to create the first admin user.
 * This function can only be called once and is secured by a secret key.
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

/**
 * v3Bootstrap
 * 
 * Creates the first admin user with a secret bootstrap key.
 * After first use, this function becomes disabled.
 */
exports.v3Bootstrap = onCall({ region: 'asia-southeast1' }, async (request) => {
  const db = admin.firestore();
  const auth = admin.auth();

  // Check if bootstrap has already been run
  const bootstrapDoc = await db.collection('v3_system').doc('bootstrap').get();
  if (bootstrapDoc.exists && bootstrapDoc.data().completed) {
    throw new HttpsError('failed-precondition', 'Bootstrap has already been completed');
  }

  // Verify bootstrap secret (hardcoded for one-time use)
  const secret = request.data.secret;
  if (secret !== 'OceanPearl2026Bootstrap!') {
    throw new HttpsError('permission-denied', 'Invalid bootstrap secret');
  }

  // Create the first admin user
  const adminEmail = 'ceo@oceanpearlseafood.com';
  const adminPassword = 'OceanPearl2026!';

  const logger = require('../lib/logger');

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(adminEmail);
    logger.info('Admin user already exists', { module: 'BOOTSTRAP', action: 'CHECK_USER', metadata: { adminEmail } });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'CEO Ocean Pearl',
        emailVerified: true
      });
      logger.info('Created admin user', { module: 'BOOTSTRAP', action: 'CREATE_USER', metadata: { adminEmail } });
    } else {
      throw error;
    }
  }

  // Create Firestore user profile with ADMIN role
  await db.collection('v3_users').doc(userRecord.uid).set({
    email: adminEmail,
    role: 'ADMIN',
    displayName: 'CEO Ocean Pearl',
    allowedLocationIds: [],
    allowedUnitIds: [],
    createdAt: FieldValue.serverTimestamp(),
    bootstrapped: true
  }, { merge: true });

  // Mark bootstrap as completed
  await db.collection('v3_system').doc('bootstrap').set({
    completed: true,
    completedAt: FieldValue.serverTimestamp(),
    adminUid: userRecord.uid
  });

  return {
    success: true,
    message: 'Bootstrap completed successfully',
    adminEmail,
    note: 'You can now sign in with this account and call v3SeedTestPack to create test data'
  };
});

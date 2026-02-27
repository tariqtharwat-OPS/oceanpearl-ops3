const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function runBootstrap() {
    console.log('Running v3Bootstrap sequence...');
    const adminEmail = 'ceo@oceanpearlseafood.com';

    // Directly set the profile if bootstrap is messy
    const userRecord = await admin.auth().getUserByEmail(adminEmail);

    await db.collection('v3_users').doc(userRecord.uid).set({
        email: adminEmail,
        role: 'ADMIN',
        displayName: 'CEO Ocean Pearl',
        allowedLocationIds: [],
        allowedUnitIds: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bootstrapped: true
    }, { merge: true });

    await db.collection('v3_system').doc('bootstrap').set({
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        adminUid: userRecord.uid
    });

    console.log('CEO Profile locked in v3_users.');
}

runBootstrap().catch(console.error);

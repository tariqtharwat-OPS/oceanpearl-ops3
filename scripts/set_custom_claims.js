/**
 * set_custom_claims.js
 * Sets Firebase Auth custom claims for the admin user so Firestore rules work.
 * Run from: cd functions && node ../scripts/set_custom_claims.js
 */
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../service-account.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'oceanpearl-ops',
});

const db = admin.firestore();

async function setCustomClaims() {
    // Get all v3_users and set their custom claims
    const snap = await db.collection('v3_users').get();
    
    console.log(`Found ${snap.size} users in v3_users`);
    
    for (const doc of snap.docs) {
        const data = doc.data();
        const uid = doc.id;
        const role = data.role || 'unit_operator';
        const email = data.email || '';
        
        try {
            // Set custom claims on Firebase Auth token
            await admin.auth().setCustomUserClaims(uid, {
                role: role,
                company_id: 'oceanpearl',
                allowedLocationIds: data.allowedLocationIds || [],
                allowedUnitIds: data.allowedUnitIds || [],
            });
            console.log(`✅ Set claims for ${email} (${uid}): role=${role}`);
        } catch (err) {
            console.log(`❌ Failed for ${email} (${uid}): ${err.message}`);
        }
    }
    
    console.log('\nDone. Users must log out and log back in for new claims to take effect.');
    process.exit(0);
}

setCustomClaims().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

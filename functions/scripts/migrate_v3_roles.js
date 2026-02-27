const admin = require('firebase-admin');

// Adjust path to service account if needed, but in cloud/emulator it often auto-detects
// or relies on GOOGLE_APPLICATION_CREDENTIALS.
// If running locally with 'firebase emulators:start', this script needs to connect to it.
const projectId = 'oceanpearl-ops';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

if (!admin.apps.length) {
    admin.initializeApp({ projectId });
}

const db = admin.firestore();

const ROLE_MAP = {
    'ADMIN': 'admin',
    'CEO': 'ceo',
    'HQ_FINANCE': 'finance_officer',
    'FINANCE_OFFICER': 'finance_officer',
    'LOCATION_MANAGER': 'location_manager',
    'OPERATOR': 'unit_operator',
    'UNIT_OPERATOR': 'unit_operator',
    'INVESTOR': 'investor',
    'admin': 'admin',
    'ceo': 'ceo',
    'finance_officer': 'finance_officer',
    'location_manager': 'location_manager',
    'unit_operator': 'unit_operator',
    'investor': 'investor'
};

async function migrate() {
    console.log("Starting Migration: users (legacy) -> v3_users (canonical)...");

    // 1. Read Legacy Users
    const legacySnap = await db.collection('users').get();
    console.log(`Found ${legacySnap.size} legacy user docs.`);

    let migrated = 0;
    let errors = 0;

    for (const doc of legacySnap.docs) {
        const data = doc.data();
        const uid = doc.id;
        const rawRole = data.role || '';
        const canonicalRole = ROLE_MAP[rawRole] || rawRole.toLowerCase();

        console.log(`Migrating ${data.email} (${rawRole}) -> ${canonicalRole}`);

        const v3Profile = {
            ...data,
            role: canonicalRole,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationSource: 'legacy_users'
        };

        try {
            // Write to v3_users
            await db.collection('v3_users').doc(uid).set(v3Profile, { merge: true });
            // Delete legacy (optional, but good for cleanup - keeping strict for now)
            // await val.ref.delete(); 
            migrated++;
        } catch (e) {
            console.error(`Failed to migrate ${uid}:`, e);
            errors++;
        }
    }

    console.log(`Migration Complete. Migrated: ${migrated}, Errors: ${errors}`);
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

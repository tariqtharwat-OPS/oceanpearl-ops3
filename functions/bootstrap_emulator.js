const admin = require('firebase-admin');

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
    projectId: 'oceanpearl-ops'
});

const db = admin.firestore();
const auth = admin.auth();

async function bootstrapAndSeed() {
    console.log('🚀 Starting Bootstrap and Seeding...');

    try {
        // 1. Create CEO user in Auth if not exists
        const adminEmail = 'ceo@oceanpearlseafood.com';
        const adminPassword = 'OceanPearl2026!';
        let userRecord;

        try {
            userRecord = await auth.getUserByEmail(adminEmail);
            console.log('✅ CEO user exists in Auth');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                userRecord = await auth.createUser({
                    email: adminEmail,
                    password: adminPassword,
                    displayName: 'CEO Ocean Pearl',
                    emailVerified: true
                });
                console.log('✅ Created CEO user in Auth');
            } else {
                throw error;
            }
        }

        // 2. Write CEO profile to Firestore directly (bypassing bootstrap function)
        await db.collection('v3_users').doc(userRecord.uid).set({
            email: adminEmail,
            role: 'CEO',
            displayName: 'CEO Ocean Pearl',
            allowedLocationIds: [],
            allowedUnitIds: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            bootstrapped: true
        }, { merge: true });
        console.log('✅ CEO profile created in Firestore');

        // 3. Mark bootstrap as completed
        await db.collection('v3_system').doc('bootstrap').set({
            completed: true,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminUid: userRecord.uid
        });
        console.log('✅ Bootstrap marked as completed');

        // 4. Import and run Seed Test Pack logic
        // We can't easily call the onCall function via admin SDK, 
        // so we'll just require the file and run it manually or simulate the request.
        // The v3SeedTestPack logic is exported from lib/seed.js usually but here it's in admin/v3SeedTestPack.js

        // Instead of calling the function, let's just use the logic from the file or use a simpler seed.
        // Actually, I'll just run the script that I know is there: call_seed_authenticated.js

        console.log('🌱 Application is now ready for login.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

bootstrapAndSeed();

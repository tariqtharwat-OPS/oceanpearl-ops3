const admin = require('firebase-admin');
const path = require('path');

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
    projectId: 'oceanpearl-ops'
});

async function runSeed() {
    console.log('🌱 Starting Seed Test Pack...');

    try {
        const adminEmail = 'ceo@oceanpearlseafood.com';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        console.log(`✅ Found CEO user: ${userRecord.uid}`);

        // Import the function logic directly
        const { v3SeedTestPack } = require('./admin/v3SeedTestPack');

        // Create mock request object
        const mockRequest = {
            auth: {
                uid: userRecord.uid,
                token: {
                    email: adminEmail
                }
            },
            data: {
                packId: 'V3_TP1'
            }
        };

        console.log('🚀 Executing v3SeedTestPack logic...');
        // We call .run() because it's a v2 onCall function in the emulator environment (mocked)
        // Actually, onCall functions return a function that takes (request)
        const result = await v3SeedTestPack.run(mockRequest);

        console.log('\n✅ SEED COMPLETE!');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        process.exit(1);
    }
}

runSeed();

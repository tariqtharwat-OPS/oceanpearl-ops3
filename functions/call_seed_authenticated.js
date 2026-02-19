#!/usr/bin/env node
/**
 * Call v3SeedTestPack with proper Firebase authentication
 */
const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/.firebase/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'oceanpearl-ops'
});

async function callSeedFunction() {
  try {
    console.log('Getting CEO user...');
    const userRecord = await admin.auth().getUserByEmail('ceo@oceanpearlseafood.com');
    console.log(`Found user: ${userRecord.uid}`);
    
    // Create custom token for CEO
    console.log('Creating custom token...');
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log('Custom token created');
    
    // Sign in with custom token to get ID token
    console.log('\\nNow you need to use this custom token to get an ID token.');
    console.log('Custom Token:', customToken);
    console.log('\\nUse this token to sign in via Firebase Auth REST API or use the Firebase SDK.');
    
    // Alternative: Call the function directly using Admin SDK
    console.log('\\n=== Calling v3SeedTestPack directly ===');
    const db = admin.firestore();
    
    // Import the function
    const { v3SeedTestPack } = require('/home/ubuntu/oceanpearl-ops-v2/functions/admin/v3SeedTestPack');
    
    // Create mock request object
    const mockRequest = {
      auth: {
        uid: userRecord.uid,
        token: {}
      },
      data: {
        packId: 'V3_TP1'
      }
    };
    
    console.log('Executing v3SeedTestPack...');
    const result = await v3SeedTestPack.run(mockRequest);
    
    console.log('\\n✅ SUCCESS!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('\\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

callSeedFunction();

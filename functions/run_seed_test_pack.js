const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('/home/ubuntu/oceanpearl-ops-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Import the seed function
const { v3SeedTestPack } = require('./admin/v3SeedTestPack');

async function runSeedTestPack() {
  console.log('🌱 Running V3 Seed Test Pack...\n');
  
  try {
    // Get CEO user
    const ceoUser = await admin.auth().getUserByEmail('ceo@oceanpearlseafood.com');
    
    // Create mock request context
    const mockRequest = {
      auth: {
        uid: ceoUser.uid,
        token: {
          email: ceoUser.email
        }
      },
      data: {
        packId: 'V3_TP1'
      }
    };
    
    // Call the function
    const result = await v3SeedTestPack.run(mockRequest);
    
    console.log('\n✅ SEED TEST PACK COMPLETE!');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

runSeedTestPack();

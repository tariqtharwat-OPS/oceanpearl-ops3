const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/.firebase/service-account.json');

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  projectId: 'oceanpearl-ops'
});

const db = admin.firestore();

(async () => {
  try {
    const ceoUid = 'FGPhqOkS1XTOlRMGObdXfFhH1bg2';
    console.log('Checking CEO user role...');
    
    const userDoc = await db.collection('v3_users').doc(ceoUid).get();
    
    if (!userDoc.exists) {
      console.log('❌ CEO user document NOT FOUND in v3_users collection');
      console.log('Creating CEO user document with ADMIN role...');
      
      await db.collection('v3_users').doc(ceoUid).set({
        email: 'ceo@oceanpearlseafood.com',
        role: 'ADMIN',
        displayName: 'CEO',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ CEO user document created with ADMIN role');
    } else {
      const userData = userDoc.data();
      console.log('✅ CEO user found:', JSON.stringify(userData, null, 2));
      
      if (userData.role !== 'ADMIN') {
        console.log(`⚠️  CEO role is ${userData.role}, updating to ADMIN...`);
        await db.collection('v3_users').doc(ceoUid).update({
          role: 'ADMIN',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ CEO role updated to ADMIN');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
})();

const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/oceanpearl-ops-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function checkCEOProfile() {
  try {
    // Get CEO user from Auth
    const ceoUser = await auth.getUserByEmail('ceo@oceanpearlseafood.com');
    console.log('CEO Auth UID:', ceoUser.uid);
    
    // Check if profile exists in Firestore
    const profileDoc = await db.collection('v3_users').doc(ceoUser.uid).get();
    
    if (profileDoc.exists) {
      console.log('CEO Profile EXISTS in Firestore:');
      console.log(JSON.stringify(profileDoc.data(), null, 2));
    } else {
      console.log('❌ CEO Profile DOES NOT EXIST in Firestore!');
      console.log('Expected document path: v3_users/' + ceoUser.uid);
    }
    
    // List all v3_users documents
    const allUsers = await db.collection('v3_users').get();
    console.log('\nAll v3_users documents:');
    allUsers.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().email} (${doc.data().role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkCEOProfile();

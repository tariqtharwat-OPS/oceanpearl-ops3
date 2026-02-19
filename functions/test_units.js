const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/upload/oceanpearl-ops-4885c37bfeaf.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testUnits() {
  // Create test location
  const testLocationId = 'loc_test_' + Date.now();
  await db.collection('locations').doc(testLocationId).set({
    name: 'Test Location for Units',
    type: 'PROCESSING_PLANT',
    country: 'Thailand',
    region: 'Bangkok',
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Created test location:', testLocationId);

  // Create test unit
  const testUnitId = 'unit_test_' + Date.now();
  await db.collection('units').doc(testUnitId).set({
    name: 'Test Processing Unit',
    unitType: 'PROCESSING_FACTORY',
    locationId: testLocationId,
    active: true,
    createdTs: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('✅ Created test unit:', testUnitId);

  // Verify units can be read
  const unitsSnapshot = await db.collection('units').where('active', '==', true).get();
  console.log('✅ Total active units:', unitsSnapshot.size);
  
  unitsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${doc.id}: ${data.name} (${data.unitType}) at location ${data.locationId}`);
  });

  process.exit(0);
}

testUnits().catch(console.error);

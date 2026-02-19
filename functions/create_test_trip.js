const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/.firebase/service-account.json');

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  projectId: 'oceanpearl-ops'
});

const db = admin.firestore();

(async () => {
  try {
    console.log('Creating test trip...');
    
    const tripId = 'V3_TP1-TRIP-001';
    const tripData = {
      tripId: tripId,
      unitId: 'UNIT-BOAT-1',
      locationId: 'LOC-KAI',
      status: 'ACTIVE',
      departureDate: admin.firestore.Timestamp.now(),
      crew: [
        { name: 'Captain Ahmad', role: 'CAPTAIN', sharePercent: 15 },
        { name: 'Engineer Budi', role: 'ENGINEER', sharePercent: 10 },
        { name: 'Crew Member 1', role: 'CREW', sharePercent: 5 },
        { name: 'Crew Member 2', role: 'CREW', sharePercent: 5 }
      ],
      expenses: [],
      totalExpenses: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'FGPhqOkS1XTOlRMGObdXfFhH1bg2', // CEO UID
      seedPack: 'V3_TP1'
    };
    
    await db.collection('v3_trips').doc(tripId).set(tripData);
    
    console.log(`✅ Test trip created: ${tripId}`);
    console.log('Trip details:', JSON.stringify(tripData, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
})();

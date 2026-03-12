const admin = require('firebase-admin');

// Initialize with application default credentials
// The FIREBASE_TOKEN is a CI token - we need to use it differently
// Use the firebase-admin with the project ID and rely on ADC
process.env.GOOGLE_CLOUD_PROJECT = 'oceanpearl-ops';

// Try to use the token as a credential
const { GoogleAuth } = require('google-auth-library');

async function main() {
  // Initialize Firebase Admin with project ID
  // This will use GOOGLE_APPLICATION_CREDENTIALS or ADC
  try {
    admin.initializeApp({
      projectId: 'oceanpearl-ops'
    });
  } catch(e) {
    // Already initialized
  }
  
  const db = admin.firestore();
  
  const users = [
    {
      uid: "IIxU1hdULxbSAPLpesD487ci1u02",
      email: "ceo@oceanpearl.test",
      displayName: "CEO Test",
      role: "ceo",
      allowedLocationIds: ["LOC-HQ", "LOC-HUB-01", "LOC-BOAT-01", "LOC-FACTORY-01"],
      allowedUnitIds: ["UNIT-HQ", "UNIT-HUB-01", "UNIT-BOAT-01", "UNIT-FACTORY-01"]
    },
    {
      uid: "vEdIYzKkQYO51N6ykfw5fwcujM83",
      email: "admin@oceanpearl.test",
      displayName: "Admin Test",
      role: "admin",
      allowedLocationIds: ["LOC-HQ", "LOC-HUB-01", "LOC-BOAT-01", "LOC-FACTORY-01"],
      allowedUnitIds: ["UNIT-HQ", "UNIT-HUB-01", "UNIT-BOAT-01", "UNIT-FACTORY-01"]
    },
    {
      uid: "xyxXPWNrDCQZs9GVw15TTcAiqbi2",
      email: "boat.captain@oceanpearl.test",
      displayName: "Boat Captain Test",
      role: "boat_captain",
      allowedLocationIds: ["LOC-BOAT-01"],
      allowedUnitIds: ["UNIT-BOAT-01"]
    },
    {
      uid: "IjVixuVxz9bY1Q8MfB5l0PY64on2",
      email: "hub.operator@oceanpearl.test",
      displayName: "Hub Operator Test",
      role: "hub_operator",
      allowedLocationIds: ["LOC-HUB-01"],
      allowedUnitIds: ["UNIT-HUB-01"]
    },
    {
      uid: "OHfzDsO77khmzkzM5hcVmK1CXwB2",
      email: "factory.operator@oceanpearl.test",
      displayName: "Factory Operator Test",
      role: "factory_operator",
      allowedLocationIds: ["LOC-FACTORY-01"],
      allowedUnitIds: ["UNIT-FACTORY-01"]
    },
    {
      uid: "efZmSiyVz9W91R3bn8aiJS7L7d42",
      email: "finance@oceanpearl.test",
      displayName: "Finance Test",
      role: "finance",
      allowedLocationIds: ["LOC-HQ"],
      allowedUnitIds: ["UNIT-HQ"]
    }
  ];
  
  for (const user of users) {
    const { uid, ...profile } = user;
    profile.uid = uid;
    profile.createdAt = admin.firestore.FieldValue.serverTimestamp();
    profile.active = true;
    
    try {
      await db.collection('v3_users').doc(uid).set(profile, { merge: true });
      console.log(`✅ Created v3_users/${uid} for ${user.email}`);
    } catch(e) {
      console.log(`❌ Failed for ${user.email}: ${e.message}`);
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

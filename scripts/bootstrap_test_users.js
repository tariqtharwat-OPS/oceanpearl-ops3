/**
 * Bootstrap Test Users for Phase 4 Browser QA
 * Creates 6 test accounts in Auth emulator + v3_users Firestore collection
 */
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const admin = require("firebase-admin");
admin.initializeApp({ projectId: "oceanpearl-ops" });
const db = admin.firestore();
const auth = admin.auth();

const COMPANY_ID = "oceanpearl";
const LOCATION_ID = "LOC-HQ-01";

const TEST_USERS = [
  {
    email: "ceo@oceanpearl.test",
    password: "Test1234!",
    displayName: "Tariq CEO",
    role: "ceo",
    phone: "+6281100000001",
    allowedLocationIds: ["LOC-HQ-01", "LOC-BOAT-01", "LOC-HUB-01", "LOC-FACTORY-01"],
    allowedUnitIds: ["UNIT-BOAT-01", "UNIT-HUB-01", "UNIT-FACTORY-01", "UNIT-FINANCE-01"],
  },
  {
    email: "admin@oceanpearl.test",
    password: "Test1234!",
    displayName: "Admin User",
    role: "admin",
    phone: "+6281100000002",
    allowedLocationIds: ["LOC-HQ-01", "LOC-BOAT-01", "LOC-HUB-01", "LOC-FACTORY-01"],
    allowedUnitIds: ["UNIT-BOAT-01", "UNIT-HUB-01", "UNIT-FACTORY-01", "UNIT-FINANCE-01"],
  },
  {
    email: "boat@oceanpearl.test",
    password: "Test1234!",
    displayName: "Boat Operator",
    role: "boat_operator",
    phone: "+6281100000003",
    allowedLocationIds: ["LOC-BOAT-01"],
    allowedUnitIds: ["UNIT-BOAT-01"],
  },
  {
    email: "hub@oceanpearl.test",
    password: "Test1234!",
    displayName: "Hub Operator",
    role: "hub_operator",
    phone: "+6281100000004",
    allowedLocationIds: ["LOC-HUB-01"],
    allowedUnitIds: ["UNIT-HUB-01"],
  },
  {
    email: "factory@oceanpearl.test",
    password: "Test1234!",
    displayName: "Factory Operator",
    role: "factory_operator",
    phone: "+6281100000005",
    allowedLocationIds: ["LOC-FACTORY-01"],
    allowedUnitIds: ["UNIT-FACTORY-01"],
  },
  {
    email: "finance@oceanpearl.test",
    password: "Test1234!",
    displayName: "Finance Officer",
    role: "finance_officer",
    phone: "+6281100000006",
    allowedLocationIds: ["LOC-HQ-01"],
    allowedUnitIds: ["UNIT-FINANCE-01"],
  },
];

async function bootstrap() {
  console.log("🚀 Bootstrapping Phase 4 test users...\n");
  const results = [];

  for (const u of TEST_USERS) {
    try {
      // Create or get Auth user
      let authUser;
      try {
        authUser = await auth.getUserByEmail(u.email);
        console.log(`  ♻️  Auth user exists: ${u.email} (${authUser.uid})`);
      } catch {
        authUser = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
        });
        console.log(`  ✅ Auth user created: ${u.email} (${authUser.uid})`);
      }

      // Write v3_users profile
      await db.collection("v3_users").doc(authUser.uid).set({
        uid: authUser.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        company_id: COMPANY_ID,
        location_id: LOCATION_ID,
        phone: u.phone,
        allowedLocationIds: u.allowedLocationIds,
        allowedUnitIds: u.allowedUnitIds,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`  ✅ v3_users profile written: ${u.role}`);
      results.push({ email: u.email, uid: authUser.uid, role: u.role, status: "OK" });
    } catch (e) {
      console.error(`  ❌ Failed for ${u.email}: ${e.message}`);
      results.push({ email: u.email, role: u.role, status: "FAIL", error: e.message });
    }
  }

  console.log("\n📊 Bootstrap Summary:");
  console.table(results.map(r => ({ email: r.email, role: r.role, uid: r.uid || "N/A", status: r.status })));

  const allOk = results.every(r => r.status === "OK");
  if (allOk) {
    console.log("\n🎉 All 6 test users created successfully.");
  } else {
    console.log("\n⚠️  Some users failed — check errors above.");
    process.exit(1);
  }

  process.exit(0);
}

bootstrap().catch(e => { console.error(e); process.exit(1); });

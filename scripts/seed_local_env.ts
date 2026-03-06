import * as admin from 'firebase-admin';

// Initialize emulator config
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
    projectId: 'ops3-production', // Phase 0 emulator target
});

const db = admin.firestore();
const auth = admin.auth();

async function seed() {
    console.log("Seeding Local Emulator Environment for Phase 0...");

    // 1. Ensure minimal tree
    const companyId = 'co_oceanpearl';
    const locationId = 'loc_kaimana';
    const boatUnitId = 'unit_boat_01';
    const factoryUnitId = 'unit_factory_01';

    await db.collection("companies").doc(companyId).set({
        name: "Ocean Pearl"
    });

    await db.collection("locations").doc(locationId).set({
        company_id: companyId,
        name: "Kaimana Hub"
    });

    await db.collection("units").doc(boatUnitId).set({
        location_id: locationId,
        name: "Boat 01",
        type: "boat"
    });

    await db.collection("units").doc(factoryUnitId).set({
        location_id: locationId,
        name: "Factory 01",
        type: "factory"
    });

    // 2. Auth emulator seeds
    const mockUid = "user_captain_a";
    try {
        await auth.createUser({
            uid: mockUid,
            email: "captain_a@oceanpearl.com",
            password: "password123",
            displayName: "Captain A"
        });
    } catch (e: any) {
        if (e.code !== 'auth/uid-already-exists') throw e;
    }

    // Inject scope hierarchy into custom claims
    await auth.setCustomUserClaims(mockUid, {
        role: "boat_operator",
        company_id: companyId,
        location_id: locationId,
        unit_id: boatUnitId,
        trip_id: "trip_001"
    });

    console.log("✅ Seed script complete.");
    console.log("Mock User: captain_a@oceanpearl.com / password123");
}

seed().catch(console.error);

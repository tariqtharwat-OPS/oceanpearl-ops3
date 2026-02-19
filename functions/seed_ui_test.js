const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
    projectId: 'oceanpearl-ops',
    apiKey: 'fake-api-key',
    authDomain: 'oceanpearl-ops.firebaseapp.com'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'asia-southeast1');

connectAuthEmulator(auth, 'http://127.0.0.1:9099');
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

async function seed() {
    console.log("=== SEEDING FOR UI TEST ===");

    try {
        const callBootstrap = httpsCallable(functions, 'v3Bootstrap');

        console.log("1. Bootstrapping...");
        try {
            await callBootstrap({ secret: 'OceanPearl2026Bootstrap!' });
            console.log("Bootstrap COMPLETED.");
        } catch (e) {
            console.log("Bootstrap skipped (likely already done).");
        }

        console.log("2. Logging in as CEO...");
        await signInWithEmailAndPassword(auth, 'ceo@oceanpearlseafood.com', 'OceanPearl2026!');
        console.log("Logged in.");

        const callSeed = httpsCallable(functions, 'v3SeedTestPack');
        const callOpenPeriod = httpsCallable(functions, 'periods-adminOpenPeriod');

        console.log("3. Seeding test pack...");
        await callSeed({ packId: 'V3_REAL_SIM' });
        console.log("Seed COMPLETED.");

        console.log("4. Opening period...");
        await callOpenPeriod({ periodId: '2026-02', startDate: '2026-02-01', endDate: '2026-02-28' });
        console.log("Period OPENED.");

        console.log("=== SEEDING SUCCESSFUL ===");
        process.exit(0);
    } catch (e) {
        console.error("Seeding FAILED:", e);
        process.exit(1);
    }
}

seed();

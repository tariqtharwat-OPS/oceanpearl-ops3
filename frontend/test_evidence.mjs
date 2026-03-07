import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestoreWriterService } from './src/services/firestoreWriterService.ts'; // We can use ts if using tsx/ts-node, or maybe build it?

// Using Node's native crypto webcrypto as global crypto for jsdom/nodejs
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const firebaseConfig = { projectId: 'oceanpearl-ops' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function runTest() {
    console.log("Submitting Trip Start Event...");
    const payload = {
        wallet_id: "TRIP-WALLET-B1",
        event_type: "trip_start",
        amount: 0,
        source_screen: "boat_start",
        recorded_at: new Date().toISOString(),
        trip_id: "TRIP-B1-0226"
    };

    const result = await firestoreWriterService.writeWalletEvent(payload);
    console.log("Inbox request queued:", result);

    console.log("Waiting 2s for backend processing...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("Checking wallet_events...");
    const eventDoc = await getDoc(doc(db, "wallet_events", result.eventId));
    if (eventDoc.exists()) {
        console.log("✅ Event processed successfully:", eventDoc.data());
    } else {
        console.error("❌ Event not found in wallet_events");
    }

    console.log("Checking wallet_states...");
    const stateDoc = await getDoc(doc(db, "wallet_states", "TRIP-WALLET-B1"));
    if (stateDoc.exists()) {
        console.log("✅ State updated successfully:", stateDoc.data());
    } else {
        console.error("❌ State not found or created");
    }

    process.exit(0);
}

runTest().catch(console.error);

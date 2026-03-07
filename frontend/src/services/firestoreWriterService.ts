import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const HMAC_SECRET = "OPS3_PHASE0_DEV_SECRET";

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateHmacId(payloadHashHex: string, nonce: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(HMAC_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(payloadHashHex + nonce)
    );
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const firestoreWriterService = {
    async writeWalletEvent(payload: any) {
        // The backend extracts idempotency_key and nonce, and JSON.stringifies the rest.
        // So we must hash exactly what will be left: the plain payload object.
        const payloadString = JSON.stringify(payload);
        const payloadHashHex = await sha256(payloadString);
        const nonce = crypto.randomUUID();

        const idempotency_key = await generateHmacId(payloadHashHex, nonce);

        const documentToWrite = {
            ...payload,
            idempotency_key,
            nonce
        };

        const docRef = doc(db, 'wallet_event_requests', idempotency_key);
        await setDoc(docRef, documentToWrite);

        return { eventId: idempotency_key, nonce, payloadHash: payloadHashHex };
    },

    async writeInventoryEvent(payload: any) {
        const payloadString = JSON.stringify(payload);
        const payloadHashHex = await sha256(payloadString);
        const nonce = crypto.randomUUID();

        const idempotency_key = await generateHmacId(payloadHashHex, nonce);

        const documentToWrite = {
            ...payload,
            idempotency_key,
            nonce
        };

        const docRef = doc(db, 'inventory_event_requests', idempotency_key);
        await setDoc(docRef, documentToWrite);

        return { eventId: idempotency_key, nonce, payloadHash: payloadHashHex };
    }
};

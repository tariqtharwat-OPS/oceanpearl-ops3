/**
 * OPS3 — Phase 4 Financial Settlement Simulation (ROBUST)
 */

const admin = require("firebase-admin");
const crypto = require("crypto");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const HMAC_SECRET = "OPS3_PHASE0_DEV_SECRET";

if (!admin.apps.length) admin.initializeApp({ projectId: "oceanpearl-ops" });
const db = admin.firestore();

function hmac(payload, nonce) {
    const str = JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(str).digest("hex");
    return crypto.createHmac("sha256", HMAC_SECRET).update(hash + nonce).digest("hex");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0;

async function post(payload) {
    step++;
    const nonce = `phase4_${step}_${Date.now()}`;
    const key = hmac(payload, nonce);
    await db.collection("document_requests").doc(key).set({
        ...payload,
        idempotency_key: key,
        nonce,
    });

    for (let i = 0; i < 20; i++) {
        await sleep(1000);
        const lock = await db.collection("idempotency_locks").doc(key).get();
        if (lock.exists) {
            if (lock.data().status === "COMPLETED") return key;
            if (lock.data().status === "FAILED") {
                console.error(`  ❌ Document ${payload.document_id} FAILED: ${lock.data().error}`);
                process.exit(1);
            }
        }
    }
    console.error(`  ❌ Document ${payload.document_id} TIMEOUT`);
    process.exit(1);
}

async function clearEmulator() {
    const cols = ["settlement_views", "payable_views", "receivable_views", "trip_profit_views",
        "stock_batch_views", "transfer_views", "stock_views", "processing_batches",
        "documents", "inventory_states", "inventory_events", "wallet_states", "wallet_events",
        "idempotency_locks", "document_requests", "trip_states"];
    for (const c of cols) {
        const s = await db.collection(c).get();
        const batch = db.batch();
        s.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

const CO = "Ocean-Pearl-SC", LOC_K = "Kaimana", BOAT = "Boat-KM-01", HUB = "Hub-Intake-KM", PROC = "Factory-Proc-KM", TRIP = "T-200";

async function run() {
    console.log("══════════════════════════════════════════════════════════════");
    console.log("  OPS3 — Phase 4 Financial Settlement Layer");
    console.log("══════════════════════════════════════════════════════════════\n");

    await clearEmulator();
    await db.collection("wallet_states").doc("Hub-Kaimana").set({ current_balance: 20000000, sequence_number: 0 });

    console.log("═══ Stage 1: Boat Landing & Expenses ═══");
    const landingId = await post({
        document_id: "LANDING", document_type: "receiving", company_id: CO, location_id: LOC_K, unit_id: BOAT, trip_id: TRIP,
        lines: [{ sku_id: "snapper-whole", amount: 500, event_type: "receive_own", unit_cost: 30000, location_id: LOC_K, unit_id: BOAT }]
    });

    await post({
        document_id: "FUEL", document_type: "expense", company_id: CO, location_id: LOC_K, unit_id: BOAT, trip_id: TRIP,
        lines: [{ wallet_id: "Hub-Kaimana", amount: 1000000, event_type: "expense_trip" }]
    });

    console.log("\n═══ Stage 2: Trip Closure & Hub Intake ═══");
    await post({
        document_id: "CLOSE-BOAT", document_type: "trip_closure", company_id: CO, location_id: LOC_K, unit_id: BOAT, trip_id: TRIP,
        lines: []
    });

    await post({
        document_id: "HUBREC", document_type: "hub_receive_from_boat", company_id: CO, location_id: LOC_K, unit_id: HUB, trip_id: TRIP, source_document_id: landingId,
        lines: [
            { sku_id: "snapper-whole", amount: 500, event_type: "transfer_initiated", location_id: LOC_K, unit_id: BOAT },
            {
                sku_id: "snapper-whole", amount: 500, event_type: "transfer_received", location_id: LOC_K, unit_id: HUB, unit_cost: 30000,
                wallet_id: "Hub-Kaimana", payment_amount: 15000000, payment_event_type: "revenue_cash"
            }
        ]
    });

    console.log("\n═══ Stage 3: Factory Processing & Cost Allocation ═══");
    await post({
        document_id: "TRANSFORM", document_type: "inventory_transformation", company_id: CO, location_id: LOC_K, unit_id: PROC, batch_id: "B-200", source_document_id: "HUBREC",
        lines: [
            { sku_id: "snapper-whole", amount: 400, event_type: "transformation_out", location_id: LOC_K, unit_id: HUB },
            { sku_id: "snapper-loin", amount: 200, event_type: "transformation_in", location_id: LOC_K, unit_id: PROC }
        ]
    });

    await post({
        document_id: "LABOR", document_type: "factory_expense", company_id: CO, location_id: LOC_K, unit_id: PROC,
        lines: [{
            sku_id: "snapper-loin", location_id: LOC_K, unit_id: PROC, amount: 500000, event_type: "cost_allocation",
            wallet_id: "Hub-Kaimana", payment_amount: 500000, payment_event_type: "expense"
        }]
    });

    console.log("\n═══ Stage 4: AP/AR Settlements ═══");
    const purcId = await post({
        document_id: "PURC", document_type: "receiving", company_id: CO, location_id: LOC_K, unit_id: HUB, supplier_id: "S-01", is_credit: true,
        lines: [{ sku_id: "snapper-whole", amount: 100, event_type: "receive_buy", unit_cost: 32000, location_id: LOC_K, unit_id: HUB }]
    });

    const saleId = await post({
        document_id: "SALE", document_type: "receiving", company_id: CO, location_id: LOC_K, unit_id: HUB, customer_id: "C-01", is_credit: true,
        lines: [{ sku_id: "snapper-whole", amount: 50, event_type: "sale_out", unit_price: 50000, location_id: LOC_K, unit_id: HUB }]
    });

    await post({ document_id: "PAY", document_type: "payment_payable", source_document_id: purcId, company_id: CO, location_id: LOC_K, unit_id: HUB, lines: [{ wallet_id: "Hub-Kaimana", amount: 3200000, event_type: "payment_made" }] });
    await post({ document_id: "RECV", document_type: "payment_receivable", source_document_id: saleId, company_id: CO, location_id: LOC_K, unit_id: HUB, lines: [{ wallet_id: "Hub-Kaimana", amount: 2500000, event_type: "payment_received" }] });

    console.log("\n═══ Stage 5: Final Validation ═══");
    const profit = await db.collection("trip_profit_views").doc(TRIP).get();
    const sett = await db.collection("settlement_views").doc(TRIP).get();
    const pay = await db.collection("payable_views").doc(purcId).get();
    const recv = await db.collection("receivable_views").doc(saleId).get();

    console.log(`  ✓ Trip P&L: Rev=${profit.data()?.total_revenue}, Exp=${profit.data()?.total_expenses}, Net=${profit.data()?.net_profit}`);
    console.log(`  ✓ Settlement View Status: ${sett.data()?.status}`);
    console.log(`  ✓ AP Status: ${pay.data()?.status}`);
    console.log(`  ✓ AR Status: ${recv.data()?.status}`);

    if (profit.data()?.net_profit === 14000000 && pay.data()?.status === "settled") {
        console.log("\n  ✅ SUCCESS: Phase 4 Verified");
    } else {
        console.log("\n  ❌ WARNING: Reconciliation drift. Expected Net: 14,000,000 (15M Rev - 1M Exp)");
    }
}

run().catch(e => { console.error(e); process.exit(1); });

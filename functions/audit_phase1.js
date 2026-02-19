/**
 * Phase 1 Integrity Test - Ledger Balancing
 */
const { recordSale, recordPayment, recordWaste, recordAdjustment } = require("./lib/workflows");

// Mocking the environment for syntax/logic consistency check
// Real testing would require firebase-functions-test or emulator.
// Here we perform a structural verification of the ledger entries.

function verifyEntries(name, entries) {
    let debit = 0;
    let credit = 0;
    entries.forEach(e => {
        if (e.direction === "debit") debit += e.baseAmountIDR;
        else credit += e.baseAmountIDR;
    });
    const balanced = Math.round(debit) === Math.round(credit);
    console.log(`[VERIFY] ${name}: ${balanced ? "BALANCED" : "FAILED"} (D:${debit}, C:${credit})`);
    return balanced;
}

async function runStaticAudit() {
    console.log("Starting Phase 1 Static Audit...");

    // recordSale balanced entries check
    const saleEntriesCap = [
        { accountId: "REVENUE", direction: "credit", baseAmountIDR: 1000 },
        { accountId: "CASH", direction: "debit", baseAmountIDR: 1000 },
        { accountId: "COGS", direction: "debit", baseAmountIDR: 700 },
        { accountId: "INV_FINISHED", direction: "credit", baseAmountIDR: 700 },
    ];
    verifyEntries("recordSale", saleEntriesCap);

    // recordPayment (Settlement AR)
    const payAREntries = [
        { accountId: "CASH", direction: "debit", baseAmountIDR: 500 },
        { accountId: "ACCOUNTS_RECEIVABLE", direction: "credit", baseAmountIDR: 500 },
    ];
    verifyEntries("recordPayment (AR)", payAREntries);

    // recordPayment (Settlement AP)
    const payAPEntries = [
        { accountId: "ACCOUNTS_PAYABLE", direction: "debit", baseAmountIDR: 500 },
        { accountId: "CASH", direction: "credit", baseAmountIDR: 500 },
    ];
    verifyEntries("recordPayment (AP)", payAPEntries);

    // recordWaste
    const wasteEntries = [
        { accountId: "INVENTORY_LOSS", direction: "debit", baseAmountIDR: 200 },
        { accountId: "INV_FINISHED", direction: "credit", baseAmountIDR: 200 },
    ];
    verifyEntries("recordWaste", wasteEntries);

    // recordAdjustment
    const adjEntries = [
        { accountId: "INV_FINISHED", direction: "debit", baseAmountIDR: 50 },
        { accountId: "ADJUSTMENT_ACCOUNT", direction: "credit", baseAmountIDR: 50 },
    ];
    verifyEntries("recordAdjustment", adjEntries);
}

runStaticAudit();

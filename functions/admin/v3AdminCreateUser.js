/**
 * v3AdminCreateUser — Admin-only callable function to create new system users.
 *
 * Creates a Firebase Auth user and a corresponding v3_users profile document.
 * Only accessible to users with role: 'admin' or 'ceo'.
 *
 * Input:
 *   email            {string}   User's email address
 *   password         {string}   Initial password (min 8 chars)
 *   role             {string}   One of: hub_operator, factory_operator, unit_operator,
 *                               location_manager, finance_officer, hq_analyst, ceo, admin
 *   allowedLocationIds {string[]} Location IDs the user can access
 *   allowedUnitIds   {string[]} Unit IDs the user can access (optional)
 *   displayName      {string}   Display name (optional)
 *
 * Output:
 *   { success: true, uid: string }
 */
"use strict";

const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { FieldValue } = require("firebase-admin/firestore");

const ADMIN_ROLES = ["admin", "ceo"];

const VALID_ROLES = [
    "hub_operator",
    "factory_operator",
    "unit_operator",
    "boat_operator",
    "location_manager",
    "finance_officer",
    "hq_analyst",
    "ceo",
    "admin",
    "investor"
];

exports.admin_createUser = onCall({ region: "asia-southeast1" }, async (request) => {
    // ── Auth guard ──────────────────────────────────────────────────────────
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }

    // ── Role guard: only admin/ceo may create users ─────────────────────────
    const db = admin.firestore();
    const callerDoc = await db.collection("v3_users").doc(request.auth.uid).get();
    if (!callerDoc.exists) {
        throw new HttpsError("not-found", "Caller profile not found.");
    }
    const callerRole = callerDoc.data().role;
    if (!ADMIN_ROLES.includes(callerRole)) {
        throw new HttpsError("permission-denied", "Only admin or CEO can create users.");
    }

    // ── Input validation ────────────────────────────────────────────────────
    const { email, password, role, allowedLocationIds = [], allowedUnitIds = [], displayName = "" } = request.data;

    if (!email || typeof email !== "string" || !email.includes("@")) {
        throw new HttpsError("invalid-argument", "A valid email address is required.");
    }
    if (!password || typeof password !== "string" || password.length < 8) {
        throw new HttpsError("invalid-argument", "Password must be at least 8 characters.");
    }
    if (!role || !VALID_ROLES.includes(role)) {
        throw new HttpsError("invalid-argument", `Role must be one of: ${VALID_ROLES.join(", ")}.`);
    }
    if (!Array.isArray(allowedLocationIds)) {
        throw new HttpsError("invalid-argument", "allowedLocationIds must be an array.");
    }

    // ── Create Firebase Auth user ────────────────────────────────────────────
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || email.split("@")[0],
            emailVerified: false
        });
    } catch (err) {
        if (err.code === "auth/email-already-exists") {
            throw new HttpsError("already-exists", "A user with this email already exists.");
        }
        throw new HttpsError("internal", `Failed to create Auth user: ${err.message}`);
    }

    // ── Create v3_users profile ──────────────────────────────────────────────
    try {
        await db.collection("v3_users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            role,
            displayName: displayName || email.split("@")[0],
            allowedLocationIds,
            allowedUnitIds: Array.isArray(allowedUnitIds) ? allowedUnitIds : [],
            createdAt: FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
            disabled: false
        });
    } catch (err) {
        // Rollback: delete the Auth user if Firestore write fails
        await admin.auth().deleteUser(userRecord.uid).catch(() => {});
        throw new HttpsError("internal", `Failed to create user profile: ${err.message}`);
    }

    return { success: true, uid: userRecord.uid };
});

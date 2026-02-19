/**
 * OPS V3 - Auth & RBAC helpers (server-side enforcement)
 *
 * NOTE: Cloud Functions use Admin SDK which bypasses Firestore Rules.
 * Therefore every callable MUST enforce:
 *  - request.auth exists
 *  - user profile exists in v3_users/{uid}
 *  - role is permitted
 *  - scope (location/unit) is permitted for the user
 */
const { HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();

async function getUserProfile(uid) {
  const snap = await db.collection("v3_users").doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "User profile not initialized.");
  }
  const user = snap.data() || {};
  user.uid = uid;
  return user;
}

function requireAuth(request) {
  if (!request || !request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return request.auth.uid;
}

function requireRole(user, allowedRoles) {
  const role = (user && user.role) ? String(user.role).toLowerCase() : "";
  const allowed = (allowedRoles || []).map(r => String(r).toLowerCase());
  if (!allowed.includes(role)) {
    throw new HttpsError("permission-denied", `Role '${role || "unknown"}' is not permitted.`);
  }
}

function normalizeList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function requireLocationScope(user, locationId) {
  if (!locationId) return;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || role === "ceo" || role === "finance_officer") return;

  const allowed = normalizeList(user.allowedLocationIds);
  if (!allowed.includes(String(locationId))) {
    throw new HttpsError("permission-denied", "User not allowed for this location.");
  }
}

function requireUnitScope(user, unitId) {
  if (!unitId) return;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || role === "ceo" || role === "finance_officer") return;

  const allowed = normalizeList(user.allowedUnitIds);
  if (!allowed.includes(String(unitId))) {
    throw new HttpsError("permission-denied", "User not allowed for this unit.");
  }
}

module.exports = {
  requireAuth,
  getUserProfile,
  requireRole,
  requireLocationScope,
  requireUnitScope,
};

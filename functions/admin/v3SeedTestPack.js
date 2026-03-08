/**
 * V3 CONTROLLED TEST SEEDED FOR PILOT
 * 
 * Creates minimal but complete pilot data for OPS V3 deployment validation.
 * Idempotent: running multiple times will not duplicate data.
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

/**
 * v3SeedTestPack
 */
exports.v3SeedTestPack = onCall({ region: 'asia-southeast1' }, async (request) => {
  const db = admin.firestore();
  const auth = admin.auth();

  // 1. Security check: admin or ceo only
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required');
  const userDoc = await db.collection('v3_users').doc(request.auth.uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const userRole = (userData && userData.role) ? userData.role.toLowerCase() : '';
  if (!userDoc.exists || (userRole !== 'admin' && userRole !== 'ceo')) {
    throw new HttpsError('permission-denied', 'Admin or CEO access required');
  }

  const packId = 'PILOT_V1';
  const batch = db.batch();
  const created = { locations: [], units: [], partners: [], skus: [], users: [] };

  // === LOCATIONS ===
  const pilotLocations = [
    { id: 'HUB-01', name: 'Central Hub', city: 'Kaimana' },
    { id: 'FAC-01', name: 'Primary Factory', city: 'Kaimana' },
    { id: 'CS-01', name: 'Main Cold Storage', city: 'Kaimana' }
  ];

  for (const loc of pilotLocations) {
    batch.set(db.collection('v3_locations').doc(loc.id), {
       ...loc, company_id: 'CO-1', createdAt: FieldValue.serverTimestamp(), seed: packId 
    }, { merge: true });
    created.locations.push(loc.id);
  }

  // === UNITS ===
  const pilotUnits = [
    { id: 'hub_intake', name: 'Hub Intake', type: 'STORAGE', location_id: 'HUB-01' },
    { id: 'factory_processing', name: 'Processing Line A', type: 'PROCESSING', location_id: 'FAC-01' },
    { id: 'wip_storage', name: 'WIP Zone', type: 'STORAGE', location_id: 'FAC-01' },
    { id: 'finished_goods', name: 'FG Zone', type: 'STORAGE', location_id: 'FAC-01' },
    { id: 'cold_storage', name: 'Main Freezer', type: 'STORAGE', location_id: 'CS-01' },
    { id: 'B-OCEAN-01', name: 'Boat Ocean 01', type: 'BOAT', location_id: 'HUB-01' }
  ];

  for (const unit of pilotUnits) {
    batch.set(db.collection('v3_units').doc(unit.id), {
       ...unit, company_id: 'CO-1', createdAt: FieldValue.serverTimestamp(), seed: packId 
    }, { merge: true });
    created.units.push(unit.id);
  }

  // === SKUs ===
  const pilotSKUs = [
    { id: 'raw-tuna', name: 'Raw Whole Tuna', unit: 'kg' },
    { id: 'tuna-loin', name: 'Processed Tuna Loin', unit: 'kg' },
    { id: 'fuel', name: 'Diesel Fuel', unit: 'L' },
    { id: 'ice', name: 'Block Ice', unit: 'kg' }
  ];

  for (const sku of pilotSKUs) {
    batch.set(db.collection('v3_products').doc(sku.id), {
       ...sku, company_id: 'CO-1', createdAt: FieldValue.serverTimestamp(), seed: packId 
    }, { merge: true });
    created.skus.push(sku.id);
  }

  // === USERS ===
  const testUsers = [
    { email: 'ceo@oceanpearlseafood.com', role: 'ceo', units: [], locs: [] },
    { email: 'operator.boat1@oceanpearlseafood.com', role: 'boat_operator', units: ['B-OCEAN-01'], locs: ['HUB-01'] },
    { email: 'operator.factory@oceanpearlseafood.com', role: 'factory_operator', units: ['factory_processing'], locs: ['FAC-01'] },
    { email: 'finance@oceanpearlseafood.com', role: 'finance_officer', units: [], locs: [] }
  ];

  for (const u of testUsers) {
    try {
      const authUser = await auth.getUserByEmail(u.email);
      batch.set(db.collection('v3_users').doc(authUser.uid), {
        email: u.email,
        role: u.role,
        company_id: 'CO-1',
        allowedLocationIds: u.locs,
        allowedUnitIds: u.units,
        seed: packId
      }, { merge: true });
      created.users.push(u.email);
    } catch (e) { console.error(`User ${u.email} missing. Must be bootstrapped first.`); }
  }

  await batch.commit();

  return { success: true, message: 'Pilot seed successful', packId, created };
});

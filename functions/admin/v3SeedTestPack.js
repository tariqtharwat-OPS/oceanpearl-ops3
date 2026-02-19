/**
 * V3 CONTROLLED TEST SEED PACK
 * 
 * Creates minimal but complete test data for OPS V3 production testing.
 * Idempotent: running multiple times will not duplicate data.
 * Admin-only callable function.
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

/**
 * v3SeedTestPack
 * 
 * Creates:
 * - Locations (LOC-KAI, LOC-SAU)
 * - Units (UNIT-BOAT-1, UNIT-DRY-1, UNIT-COLD-1, UNIT-OFFICE-1)
 * - Partners (SUP-ANCH-1, BUY-ANCH-1, AGT-SELL-1, INV-LOC-KAI-1)
 * - Species & Products (Anchovy with size/grade schemes)
 * - Test users with correct roles and scopes
 * - Initial wallets/views
 */
exports.v3SeedTestPack = onCall({ region: 'asia-southeast1' }, async (request) => {
  const db = admin.firestore();
  const auth = admin.auth();

  // Security: Admin-only
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const userDoc = await db.collection('v3_users').doc(request.auth.uid).get();
  const userRole = userDoc.exists ? userDoc.data().role : null;
  if (!userDoc.exists || (userRole !== 'ADMIN' && userRole !== 'CEO')) {
    throw new HttpsError('permission-denied', 'Admin or CEO access required');
  }

  const packId = request.data.packId || 'V3_TP1';

  // Check if pack already exists (idempotency)
  const packDoc = await db.collection('v3_seed_packs').doc(packId).get();
  if (packDoc.exists) {
    return {
      success: true,
      message: 'Test pack already exists (idempotent)',
      packId,
      created: false
    };
  }

  const batch = db.batch();
  const created = {
    locations: [],
    units: [],
    partners: [],
    species: [],
    products: [],
    users: []
  };

  // === LOCATIONS ===
  const locations = [
    { id: 'LOC-KAI', name_id: 'Kaimana', name_en: 'Kaimana', province: 'Papua Barat', country: 'Indonesia' },
    { id: 'LOC-SAU', name_id: 'Saumlaki', name_en: 'Saumlaki', province: 'Maluku', country: 'Indonesia' }
  ];

  for (const loc of locations) {
    const ref = db.collection('v3_locations').doc(loc.id);
    batch.set(ref, {
      ...loc,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      seedPack: packId
    });
    created.locations.push(loc.id);
  }

  // === UNITS ===
  const units = [
    {
      id: 'UNIT-BOAT-1',
      name: 'Boat Fresh',
      type: 'BOAT',
      locationId: 'LOC-KAI',
      fishingMethod: 'PURSE_SEINE',
      capacity: { unit: 'kg', value: 5000 }
    },
    {
      id: 'UNIT-DRY-1',
      name: 'Drying Warehouse - Anchovy',
      type: 'DRYING',
      locationId: 'LOC-KAI',
      capacity: { unit: 'kg', value: 10000 }
    },
    {
      id: 'UNIT-COLD-1',
      name: 'Cold Storage',
      type: 'COLD_STORAGE',
      locationId: 'LOC-KAI',
      capacity: { unit: 'kg', value: 50000 },
      temperature: -18
    },
    {
      id: 'UNIT-OFFICE-1',
      name: 'Office',
      type: 'OFFICE',
      locationId: 'LOC-KAI'
    }
  ];

  for (const unit of units) {
    const ref = db.collection('v3_units').doc(unit.id);
    batch.set(ref, {
      ...unit,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      seedPack: packId
    });
    created.units.push(unit.id);
  }

  // === PARTNERS ===
  const partners = [
    {
      id: 'SUP-ANCH-1',
      name: 'Fishermen Group Kaimana',
      type: 'SUPPLIER',
      contactPerson: 'Pak Budi',
      phone: '+62812345678'
    },
    {
      id: 'BUY-ANCH-1',
      name: 'Export Buyer Jakarta',
      type: 'BUYER',
      contactPerson: 'Mr. Chen',
      phone: '+6221987654'
    },
    {
      id: 'AGT-SELL-1',
      name: 'Sales Agent Surabaya',
      type: 'AGENT',
      contactPerson: 'Ibu Siti',
      phone: '+62315551234',
      commissionRate: 0.02
    },
    {
      id: 'INV-LOC-KAI-1',
      name: 'Investor Kaimana',
      type: 'INVESTOR',
      scopedToLocation: 'LOC-KAI',
      contactPerson: 'Pak Hasan',
      phone: '+62811223344'
    }
  ];

  for (const partner of partners) {
    const ref = db.collection('v3_partners').doc(partner.id);
    batch.set(ref, {
      ...partner,
      balance: 0,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      seedPack: packId
    });
    created.partners.push(partner.id);
  }

  // === SPECIES ===
  const species = {
    id: 'SPEC-ANCH',
    name_id: 'Ikan Teri',
    name_en: 'Anchovy',
    scientificName: 'Engraulis encrasicolus',
    category: 'PELAGIC',
    receivingSizeScheme: 'MIXED', // Single price at receiving
    stockSizeScheme: ['BIG', 'MED', 'SMALL'], // After processing
    gradeScheme: ['A', 'B', 'C']
  };

  batch.set(db.collection('v3_species').doc(species.id), {
    ...species,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
    seedPack: packId
  });
  created.species.push(species.id);

  // === PRODUCTS ===
  const products = [
    {
      id: 'ANCH-FRESH',
      speciesId: 'SPEC-ANCH',
      name_id: 'Teri Segar',
      name_en: 'Fresh Anchovy',
      type: 'FRESH',
      size: 'MIXED'
    },
    // Dried products (size × grade matrix)
    ...['BIG', 'MED', 'SMALL'].flatMap(size =>
      ['A', 'B', 'C'].map(grade => ({
        id: `ANCH-DRY-${size}-${grade}`,
        speciesId: 'SPEC-ANCH',
        name_id: `Teri Kering ${size} Grade ${grade}`,
        name_en: `Dried Anchovy ${size} Grade ${grade}`,
        type: 'DRIED',
        size,
        grade,
        expectedYield: size === 'BIG' ? 0.35 : size === 'MED' ? 0.30 : 0.25 // Example yields
      }))
    )
  ];

  for (const product of products) {
    const ref = db.collection('v3_products').doc(product.id);
    batch.set(ref, {
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      seedPack: packId
    });
    created.products.push(product.id);
  }

  // === TEST USERS ===
  const testUsers = [
    {
      email: 'ceo@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'CEO',
      displayName: 'CEO Ocean Pearl',
      allowedLocationIds: [], // All locations
      allowedUnitIds: [] // All units
    },
    {
      email: 'admin@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'ADMIN',
      displayName: 'System Administrator',
      allowedLocationIds: [],
      allowedUnitIds: []
    },
    {
      email: 'lm.kai@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'LOCATION_MANAGER',
      displayName: 'Location Manager Kaimana',
      allowedLocationIds: ['LOC-KAI'],
      allowedUnitIds: [] // All units in LOC-KAI
    },
    {
      email: 'op.boat1@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'UNIT_OPERATOR',
      displayName: 'Boat Operator 1',
      allowedLocationIds: ['LOC-KAI'],
      allowedUnitIds: ['UNIT-BOAT-1']
    },
    {
      email: 'op.dry1@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'UNIT_OPERATOR',
      displayName: 'Drying Operator 1',
      allowedLocationIds: ['LOC-KAI'],
      allowedUnitIds: ['UNIT-DRY-1']
    },
    {
      email: 'finance@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'FINANCE_OFFICER',
      displayName: 'Finance Officer',
      allowedLocationIds: [],
      allowedUnitIds: []
    },
    {
      email: 'investor.kai@oceanpearlseafood.com',
      password: 'OceanPearl2026!',
      role: 'INVESTOR',
      displayName: 'Investor Kaimana',
      allowedLocationIds: ['LOC-KAI'],
      allowedUnitIds: []
    }
  ];

  for (const user of testUsers) {
    try {
      // Create Firebase Auth user
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        // User exists, update password
        await auth.updateUser(userRecord.uid, {
          password: user.password,
          displayName: user.displayName
        });
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          userRecord = await auth.createUser({
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            emailVerified: true
          });
        } else {
          throw error;
        }
      }

      // Create/update Firestore user profile
      const userRef = db.collection('v3_users').doc(userRecord.uid);
      batch.set(userRef, {
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        allowedLocationIds: user.allowedLocationIds,
        allowedUnitIds: user.allowedUnitIds,
        createdAt: FieldValue.serverTimestamp(),
        seedPack: packId
      }, { merge: true });

      created.users.push(user.email);
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error);
      throw new HttpsError('internal', `Failed to create user ${user.email}: ${error.message}`);
    }
  }

  // === MARK PACK AS CREATED ===
  batch.set(db.collection('v3_seed_packs').doc(packId), {
    packId,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
    created
  });

  // Commit all changes
  await batch.commit();

  return {
    success: true,
    message: 'Test pack created successfully',
    packId,
    created,
    loginCredentials: {
      note: 'All users have password: OceanPearl2026!',
      users: testUsers.map(u => ({ email: u.email, role: u.role }))
    }
  };
});

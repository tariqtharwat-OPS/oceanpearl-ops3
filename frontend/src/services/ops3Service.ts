/**
 * OPS3 Phase 2/3 Service Layer
 * Wraps all Phase 2 callable functions: Processing Batches, WIP States, Hub Receiving.
 * Also wraps document_request writes for transformation ledger.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebase';
import CryptoJS from 'crypto-js';

const functions = getFunctions(app, 'asia-southeast1');
const db = getFirestore(app);

// ─── HMAC helper (matches backend logic) ─────────────────────────────────────
// In emulator mode we use the dev secret. In production this would be
// server-side only — the UI never exposes the real secret.
const HMAC_SECRET = 'OPS3_PHASE0_DEV_SECRET';

function generateHmac(payload: Record<string, unknown>, nonce: string): string {
  const payloadString = JSON.stringify(payload);
  const payloadHash = CryptoJS.SHA256(payloadString).toString();
  return CryptoJS.HmacSHA256(payloadHash + nonce, HMAC_SECRET).toString();
}

// ─── PROCESSING BATCHES ───────────────────────────────────────────────────────

export interface BatchInputLine {
  sku_id: string;
  qty: number;
  unit_id: string;
  location_id: string;
}

export interface BatchOutputLine {
  sku_id: string;
  qty: number;
  unit_id: string;
  location_id: string;
  is_waste?: boolean;
}

export interface CreateBatchParams {
  batch_id: string;
  company_id: string;
  location_id: string;
  unit_id: string;
  input_lines: BatchInputLine[];
  output_lines: BatchOutputLine[];
  expected_yield?: number;
  notes?: string;
}

export const createProcessingBatch = async (params: CreateBatchParams) => {
  const fn = httpsCallable(functions, 'createProcessingBatch');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const updateProcessingBatch = async (params: {
  doc_id: string;
  status?: string;
  output_lines?: BatchOutputLine[];
  transformation_document_ids?: string[];
  notes?: string;
}) => {
  const fn = httpsCallable(functions, 'updateProcessingBatch');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const getProcessingBatch = async (doc_id: string) => {
  const fn = httpsCallable(functions, 'getProcessingBatch');
  const result = await fn({ doc_id });
  return result.data as Record<string, unknown>;
};

export const listProcessingBatches = async (
  company_id: string,
  location_id: string,
  unit_id: string,
  status?: string
) => {
  let q = query(
    collection(db, 'processing_batches'),
    where('company_id', '==', company_id),
    where('location_id', '==', location_id),
    where('unit_id', '==', unit_id)
  );
  if (status) {
    q = query(q, where('status', '==', status));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── WIP STATES ───────────────────────────────────────────────────────────────

export const createWipState = async (params: {
  batch_id: string;
  sku_id: string;
  quantity: number;
  stage: string;
  company_id: string;
  location_id: string;
  unit_id: string;
  notes?: string;
}) => {
  const fn = httpsCallable(functions, 'createWipState');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; batch_id: string; sku_id: string; status: string };
};

export const advanceWipStage = async (params: {
  doc_id: string;
  new_stage: string;
  quantity_loss?: number;
  notes?: string;
}) => {
  const fn = httpsCallable(functions, 'advanceWipStage');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; new_stage: string; quantity: number };
};

export const completeWipState = async (params: {
  doc_id: string;
  transformation_document_id: string;
  quantity_out?: number;
  notes?: string;
}) => {
  const fn = httpsCallable(functions, 'completeWipState');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const cancelWipState = async (params: { doc_id: string; reason: string }) => {
  const fn = httpsCallable(functions, 'cancelWipState');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const getWipState = async (doc_id: string) => {
  const fn = httpsCallable(functions, 'getWipState');
  const result = await fn({ doc_id });
  return result.data as Record<string, unknown>;
};

export const listWipStates = async (
  company_id: string,
  location_id: string,
  unit_id: string,
  status?: string
) => {
  let q = query(
    collection(db, 'wip_states'),
    where('company_id', '==', company_id),
    where('location_id', '==', location_id),
    where('unit_id', '==', unit_id)
  );
  if (status) {
    q = query(q, where('status', '==', status));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── TRANSFORMATION LEDGER ────────────────────────────────────────────────────

export interface TransformationLine {
  sku_id: string;
  amount: number;
  event_type: 'transformation_out' | 'transformation_in';
  location_id: string;
  unit_id: string;
}

export const postTransformation = async (params: {
  document_id: string;
  company_id: string;
  location_id: string;
  unit_id: string;
  lines: TransformationLine[];
  batch_id?: string;
  notes?: string;
}) => {
  const { document_id, ...rest } = params;
  const payload = { document_id, document_type: 'inventory_transformation', ...rest };
  const nonce = `n-${Date.now()}`;
  const hmac = generateHmac(payload, nonce);
  const docRef = doc(db, 'document_requests', hmac);
  await setDoc(docRef, { ...payload, idempotency_key: hmac, nonce });
  return { idempotency_key: hmac, document_id };
};

// ─── HUB RECEIVING ────────────────────────────────────────────────────────────

export interface HubReceivingLine {
  sku_id: string;
  expected_qty: number;
  received_qty?: number | null;
  qc_status?: string;
  variance_qty?: number;
}

export const createHubReceiving = async (params: {
  company_id: string;
  location_id: string;
  unit_id: string;
  source_unit_id: string;
  trip_id: string;
  received_lines: HubReceivingLine[];
  notes?: string;
}) => {
  const fn = httpsCallable(functions, 'createHubReceiving');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const updateHubReceivingInspection = async (params: {
  doc_id: string;
  received_lines: HubReceivingLine[];
}) => {
  const fn = httpsCallable(functions, 'updateHubReceivingInspection');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const confirmHubReceiving = async (params: { doc_id: string }) => {
  const fn = httpsCallable(functions, 'confirmHubReceiving');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string; ledger_document_id: string };
};

export const cancelHubReceiving = async (params: { doc_id: string; reason: string }) => {
  const fn = httpsCallable(functions, 'cancelHubReceiving');
  const result = await fn(params);
  return result.data as { success: boolean; doc_id: string; status: string };
};

export const getHubReceiving = async (doc_id: string) => {
  const fn = httpsCallable(functions, 'getHubReceiving');
  const result = await fn({ doc_id });
  return result.data as { success: boolean; data: Record<string, unknown> };
};

export const listHubReceivings = async (
  company_id: string,
  location_id: string,
  unit_id: string,
  status?: string
) => {
  let q = query(
    collection(db, 'hub_receiving'),
    where('company_id', '==', company_id),
    where('unit_id', '==', unit_id)
  );
  if (status) {
    q = query(q, where('status', '==', status));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── TRIP STATES ─────────────────────────────────────────────────────────────

export const listClosedTrips = async (location_id: string, unit_id?: string) => {
  let q = query(
    collection(db, 'trip_states'),
    where('status', '==', 'closed')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTripState = async (trip_id: string) => {
  const snap = await getDoc(doc(db, 'trip_states', trip_id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

// ─── INVENTORY STATES ─────────────────────────────────────────────────────────

export const getInventoryBalance = async (location_id: string, unit_id: string, sku_id: string) => {
  const key = `${location_id}__${unit_id}__${sku_id}`;
  const snap = await getDoc(doc(db, 'inventory_states', key));
  if (!snap.exists()) return null;
  return snap.data();
};

export const listInventoryStates = async (location_id: string, unit_id: string) => {
  const q = query(
    collection(db, 'inventory_states'),
    where('location_id', '==', location_id),
    where('unit_id', '==', unit_id)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

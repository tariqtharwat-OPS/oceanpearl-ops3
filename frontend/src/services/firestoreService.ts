import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
    uid: string;
    email: string;
    role: 'admin' | 'user';
    allowedLocationIds: string[];
    createdAt: Timestamp;
    disabled: boolean;
}

export interface Location {
    id: string;
    name: string;
    code: string;
    address?: string;
    manager?: string;
    createdAt: Timestamp;
}

export interface Place {
    id: string;
    name: string;
    order: number;
}

export interface Item {
    id: string;
    name: string;
    code: string;
    description?: string;
    uom: string;
    createdAt: Timestamp;
}

export interface LedgerEntry {
    id: string;
    locationId: string;
    eventType: 'RECEIVE' | 'MOVE' | 'PROCESS_INPUT' | 'PROCESS_OUTPUT' | 'ADJUST' | 'SHIP' | 'CONTAINER_LOAD';
    itemId: string;
    qty: number;
    uom: string;
    fromPlaceId?: string;
    toPlaceId?: string;
    batchId?: string;
    referenceDoc?: string;
    createdByUid: string;
    note?: string;
    cost?: number;
    createdAt: Timestamp;
}

export const firestoreService = {
    // User operations
    getUserProfile: async (uid: string): Promise<UserProfile | null> => {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as any;
            return {
                uid: docSnap.id,
                email: data.email ?? '',
                role: (data.role === 'admin' ? 'admin' : 'user'),
                allowedLocationIds: Array.isArray(data.allowedLocationIds) ? data.allowedLocationIds : [],
                createdAt: data.createdAt ?? Timestamp.now(),
                disabled: !!data.disabled,
            } as UserProfile;
        }
        return null;
    },

    // Location operations
    getLocation: async (locationId: string): Promise<Location | null> => {
        const docRef = doc(db, 'locations', locationId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Location;
        }
        return null;
    },

    getLocations: async (): Promise<Location[]> => {
        const q = query(collection(db, 'locations'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Location[];
    },

    // Places operations
    getPlaces: async (locationId: string): Promise<Place[]> => {
        const q = query(
            collection(db, 'locations', locationId, 'places'),
            orderBy('order', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Place[];
    },

    // Items operations
    getItems: async (): Promise<Item[]> => {
        const q = query(collection(db, 'master', 'items'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Item[];
    },

    getItem: async (itemId: string): Promise<Item | null> => {
        const docRef = doc(db, 'master', 'items', itemId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Item;
        }
        return null;
    },

    // Ledger operations
    getLedgerEntries: async (
        locationId: string,
        constraints: QueryConstraint[] = []
    ): Promise<LedgerEntry[]> => {
        const defaultConstraints = [orderBy('createdAt', 'desc')];
        const q = query(
            collection(db, 'locations', locationId, 'ledger'),
            ...defaultConstraints,
            ...constraints
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            locationId,
            ...doc.data(),
        })) as LedgerEntry[];
    },

    getLedgerEntriesByPlace: async (
        locationId: string,
        placeId: string
    ): Promise<LedgerEntry[]> => {
        const q = query(
            collection(db, 'locations', locationId, 'ledger'),
            where('toPlaceId', '==', placeId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            locationId,
            ...doc.data(),
        })) as LedgerEntry[];
    },

    // Calculate current stock by place
    calculateStockByPlace: async (
        locationId: string,
        placeId: string,
        itemId?: string
    ): Promise<{ [key: string]: number }> => {
        let q;
        if (itemId) {
            q = query(
                collection(db, 'locations', locationId, 'ledger'),
                where('toPlaceId', '==', placeId),
                where('itemId', '==', itemId)
            );
        } else {
            q = query(
                collection(db, 'locations', locationId, 'ledger'),
                where('toPlaceId', '==', placeId)
            );
        }

        const querySnapshot = await getDocs(q);
        const stock: { [key: string]: number } = {};

        querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const key = data.itemId;
            const qty = data.eventType === 'ADJUST' && data.qty < 0 ? data.qty : data.qty;
            stock[key] = (stock[key] || 0) + qty;
        });

        return stock;
    },

    // Get all stock for a location
    calculateAllStock: async (locationId: string): Promise<{ [key: string]: number }> => {
        const q = query(collection(db, 'locations', locationId, 'ledger'));
        const querySnapshot = await getDocs(q);
        const stock: { [key: string]: number } = {};

        querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const key = `${data.itemId}-${data.toPlaceId || 'unknown'}`;
            stock[key] = (stock[key] || 0) + data.qty;
        });

        return stock;
    },
};

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- MINIMAL FIRESTORE MOCK ---
class MockDocumentSnapshot {
    constructor(id, data) {
        this.id = id;
        this._data = data;
        this.exists = !!data;
    }
    data() {
        if (!this._data) return null;
        return JSON.parse(JSON.stringify(this._data));
    }
}

class MockCollection {
    constructor(db, path) {
        this.db = db;
        this.path = path;
    }
    doc(id) {
        if (!id) id = crypto.randomBytes(8).toString('hex');
        return new MockDocument(this.db, `${this.path}/${id}`, id);
    }
    where(field, op, val) {
        return new MockQuery(this.db, this.path).where(field, op, val);
    }
    limit(n) {
        return new MockQuery(this.db, this.path).limit(n);
    }
    orderBy(f, d) {
        return new MockQuery(this.db, this.path).orderBy(f, d);
    }
    async get() { return new MockQuery(this.db, this.path).get(); }
}

class MockDocument {
    constructor(db, fullPath, id) {
        this.db = db;
        this.fullPath = fullPath;
        this.id = id;
    }
    async get() {
        const data = this.db._data[this.fullPath];
        return new MockDocumentSnapshot(this.id, data);
    }
    async set(data, opts) {
        const existing = this.db._data[this.fullPath] || {};
        let finalData = (opts && opts.merge) ? { ...existing } : {};

        for (const k in data) {
            const val = data[k];
            if (val && val.__op === 'increment') {
                finalData[k] = (Number(finalData[k]) || 0) + val.n;
            } else if (val && val.__op === 'arrayUnion') {
                if (!Array.isArray(finalData[k])) finalData[k] = [];
                finalData[k] = [...finalData[k], ...val.elements];
            } else if (val && val.__op === 'serverTimestamp') {
                finalData[k] = new MockTimestamp(new Date());
            } else if (val && val instanceof MockTimestamp) {
                finalData[k] = val;
            } else {
                finalData[k] = val;
            }
        }
        this.db._data[this.fullPath] = finalData;
    }
    async update(data) {
        if (!this.db._data[this.fullPath]) throw new Error('NOT_FOUND: ' + this.fullPath);
        await this.set(data, { merge: true });
    }
    collection(name) { return new MockCollection(this.db, `${this.fullPath}/${name}`); }
}

class MockTimestamp {
    constructor(date) {
        this._date = (date instanceof Date) ? date : (date ? new Date(date) : new Date());
    }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    toISOString() { return this._date.toISOString(); }
    static fromDate(d) { return new MockTimestamp(d); }
    static now() { return new MockTimestamp(); }
    toJSON() { return { __type: 'Timestamp', seconds: Math.floor(this._date.getTime() / 1000) }; }
}

class MockQuery {
    constructor(db, path) {
        this.db = db;
        this.path = path;
        this.filters = [];
        this._limit = null;
        this._orderBy = null;
        this._startAfter = null;
    }
    where(field, op, val) {
        this.filters.push({ field, op, val });
        return this;
    }
    limit(n) {
        this._limit = n;
        return this;
    }
    orderBy(f, d = 'asc') {
        this._orderBy = { f, d };
        return this;
    }
    startAfter(doc) {
        this._startAfter = doc;
        return this;
    }
    async get() {
        let results = Object.keys(this.db._data)
            .filter(p => p.startsWith(this.path + '/') && p.split('/').length === this.path.split('/').length + 1)
            .map(p => ({ id: p.split('/').pop(), data: this.db._data[p], path: p }));

        for (const f of this.filters) {
            results = results.filter(r => {
                let v = r.data[f.field];
                if (v && v.toDate) v = v.toDate();
                else if (v && v.__type === 'Timestamp') v = new Date(v.seconds * 1000);

                let fv = f.val;
                if (fv && fv.toDate) fv = fv.toDate();
                else if (fv && fv.__type === 'Timestamp') fv = new Date(fv.seconds * 1000);

                if (f.op === '==') return v === fv;
                if (f.op === '>=') return v >= fv;
                if (f.op === '<=') return v <= fv;
                if (f.op === '>') return v > fv;
                if (f.op === '<') return v < fv;
                if (f.op === 'array-contains') return Array.isArray(v) && v.includes(f.val);
                return true;
            });
        }

        if (this._orderBy) {
            results.sort((a, b) => {
                let va = a.data[this._orderBy.f];
                let vb = b.data[this._orderBy.f];
                if (va && va.toDate) va = va.toDate();
                if (vb && vb.toDate) vb = vb.toDate();
                if (va < vb) return this._orderBy.d === 'asc' ? -1 : 1;
                if (va > vb) return this._orderBy.d === 'asc' ? 1 : -1;
                return 0;
            });
        }

        if (this._startAfter) {
            const idx = results.findIndex(r => r.id === this._startAfter.id);
            if (idx !== -1) results = results.slice(idx + 1);
        }

        if (this._limit) results = results.slice(0, this._limit);

        const docs = results.map(r => new MockDocumentSnapshot(r.id, r.data));
        return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (cb) => docs.forEach(cb)
        };
    }
}

class MockBatch {
    constructor(db) { this.db = db; this.ops = []; }
    set(doc, data, opts) { this.ops.push({ type: 'set', doc, data, opts }); return this; }
    update(doc, data) { this.ops.push({ type: 'update', doc, data }); return this; }
    async get(refOrQuery) { return refOrQuery.get(); }
    async commit() {
        for (const op of this.ops) {
            if (op.type === 'set') await op.doc.set(op.data, op.opts);
            if (op.type === 'update') await op.doc.update(op.data);
        }
    }
}

class MockDB {
    constructor() { this._data = {}; }
    collection(path) { return new MockCollection(this, path); }
    batch() { return new MockBatch(this); }
    async runTransaction(cb) {
        const tx = {
            get: async (ref) => ref.get ? ref.get() : ref.get(),
            set: (ref, data, opts) => this.ops_push(ref, 'set', data, opts),
            update: (ref, data) => this.ops_push(ref, 'update', data),
            delete: (ref) => this.ops_push(ref, 'delete')
        };
        this._currentTxOps = [];
        this.ops_push = (ref, type, data, opts) => this._currentTxOps.push({ ref, type, data, opts });
        const result = await cb(tx);
        for (const op of this._currentTxOps) {
            if (op.type === 'set') await op.ref.set(op.data, op.opts);
            if (op.type === 'update') await op.ref.update(op.data);
            if (op.type === 'delete') delete this._data[op.ref.fullPath];
        }
        delete this._currentTxOps;
        return result;
    }
}

const mockDb = new MockDB();

// --- MONKEY PATCH REQUIRE ---
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (pathStr) {
    if (pathStr === 'firebase-admin') {
        const admin = {
            initializeApp: () => { },
            firestore: Object.assign(() => mockDb, {
                FieldValue: {
                    serverTimestamp: () => ({ __op: 'serverTimestamp' }),
                    increment: (n) => ({ __op: 'increment', n }),
                    arrayUnion: (...elements) => ({ __op: 'arrayUnion', elements })
                },
                Timestamp: MockTimestamp
            }),
            auth: () => ({
                getUserByEmail: async (e) => ({ uid: 'user-' + e.split('@')[0], email: e }),
                createUser: async (o) => ({ uid: 'user-' + o.email.split('@')[0], ...o }),
                updateUser: async (uid, o) => ({ uid, ...o }),
                verifyIdToken: async (t) => ({ uid: t })
            })
        };
        return admin;
    }
    if (pathStr === 'firebase-functions/v2/https') {
        return {
            onCall: (cfg, handler) => {
                const h = typeof cfg === 'function' ? cfg : handler;
                return async (req) => h(req);
            },
            onRequest: (handler) => handler,
            HttpsError: class extends Error {
                constructor(code, msg) {
                    super(msg);
                    this.code = code;
                    this.status = 500;
                }
            }
        };
    }
    if (pathStr === 'firebase-functions/v2/firestore') {
        return {
            onDocumentCreated: (path, handler) => handler
        };
    }
    if (pathStr === 'firebase-functions/v2') {
        return {
            setGlobalOptions: () => { },
        };
    }
    if (pathStr.startsWith('firebase-functions/v2/')) {
        return {
            onSchedule: (cfg, handler) => handler,
        };
    }
    return originalRequire.apply(this, arguments);
};

module.exports = { mockDb };

/**
 * OPS V3 - Architecture Enforcement & Drift Detection
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const db = admin.firestore();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { requireAuth, getUserProfile, requireRole } = require("../lib/auth");
const logger = require("../lib/logger");

/**
 * adminCheckArchitectureDrift
 * Recomputes hashes and compares against fingerprint.
 */
exports.adminCheckArchitectureDrift = onCall(async (request) => {
    const uid = requireAuth(request);
    const user = await getUserProfile(uid);
    requireRole(user, ["admin", "ceo"]);

    const fingerprintPath = path.join(__dirname, '..', '..', '..', 'OPS3_ARCHITECTURE_FINGERPRINT.md');
    const protectedPath = path.join(__dirname, '..', '..', '..', 'OPS3_PROTECTED_MODULES.json');

    if (!fs.existsSync(fingerprintPath)) {
        throw new HttpsError('not-found', 'Architecture fingerprint file missing.');
    }

    const fingerprint = fs.readFileSync(fingerprintPath, 'utf8');
    const protectedModules = JSON.parse(fs.readFileSync(protectedPath, 'utf8')).protected;

    const folders = ['lib', 'admin'];
    const changedFiles = [];
    const missingFiles = [];
    const unexpectedFiles = [];
    const storedHashes = {};

    // Parse stored hashes from fingerprint
    const hashRegex = /### (.*?)\n.*?\n.*?\n- \*\*Hash \(SHA256\):\*\* `(.*?)`/g;
    let match;
    while ((match = hashRegex.exec(fingerprint)) !== null) {
        storedHashes[match[1]] = match[2];
    }

    folders.forEach(folder => {
        const dir = path.join(__dirname, '..', folder);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
            files.forEach(file => {
                const content = fs.readFileSync(path.join(dir, file));
                const currentHash = crypto.createHash('sha256').update(content).digest('hex');

                if (!storedHashes[file]) {
                    unexpectedFiles.push({ file, folder });
                } else if (storedHashes[file] !== currentHash) {
                    const isProtected = protectedModules.includes(file);
                    changedFiles.push({ file, folder, isProtected });
                }

                delete storedHashes[file];
            });
        }
    });

    Object.keys(storedHashes).forEach(file => {
        missingFiles.push(file);
    });

    const driftDetected = changedFiles.length > 0 || missingFiles.length > 0 || unexpectedFiles.length > 0;

    if (driftDetected) {
        const severity = changedFiles.some(f => f.isProtected) ? "CRITICAL" : "HIGH";
        logger.error("Architecture drift detected", {
            module: "GOVERNANCE",
            action: "DRIFT_CHECK",
            metadata: { changedFiles, missingFiles, unexpectedFiles, severity }
        });
    }

    return {
        driftDetected,
        changedFiles,
        missingFiles,
        unexpectedFiles
    };
});

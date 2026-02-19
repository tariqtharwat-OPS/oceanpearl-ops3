/**
 * OPS V3 - Pre-deployment Governance Guard
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("--- OPS V3 GOVERNANCE GUARD ---");

const fingerprintPath = path.join(__dirname, '..', '..', '..', 'OPS3_ARCHITECTURE_FINGERPRINT.md');
const protectedPath = path.join(__dirname, '..', '..', '..', 'OPS3_PROTECTED_MODULES.json');

if (!fs.existsSync(fingerprintPath)) {
    console.error("FAIL: Architecture fingerprint file missing! Deployment blocked.");
    process.exit(1);
}

const fingerprint = fs.readFileSync(fingerprintPath, 'utf8');
const protectedModules = JSON.parse(fs.readFileSync(protectedPath, 'utf8')).protected;

const folders = ['lib', 'admin'];
const storedHashes = {};
const hashRegex = /### (.*?)\n.*?\n.*?\n- \*\*Hash \(SHA256\):\*\* `(.*?)`/g;
let match;
while ((match = hashRegex.exec(fingerprint)) !== null) {
    storedHashes[match[1]] = match[2];
}

let driftDetected = false;
let protectedChange = false;

folders.forEach(folder => {
    const dir = path.join(__dirname, '..', folder);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dir, file));
            const currentHash = crypto.createHash('sha256').update(content).digest('hex');

            if (!storedHashes[file]) {
                console.warn(`DRIFT: Unexpected file detected: ${file}`);
                driftDetected = true;
            } else if (storedHashes[file] !== currentHash) {
                console.warn(`DRIFT: File content changed: ${file}`);
                driftDetected = true;
                if (protectedModules.includes(file)) {
                    console.error(`CRITICAL: Protected module ${file} altered!`);
                    protectedChange = true;
                }
            }
            delete storedHashes[file];
        });
    }
});

Object.keys(storedHashes).forEach(file => {
    console.warn(`DRIFT: Missing file: ${file}`);
    driftDetected = true;
    if (protectedModules.includes(file)) protectedChange = true;
});

if (protectedChange) {
    console.error("FAIL: Protected modules modified. Deployment BLOCKED.");
    console.info("Please fill OPS3_CHANGE_REQUEST_TEMPLATE.md and update fingerprint.");
    process.exit(1);
}

if (driftDetected) {
    console.warn("WARNING: Architectural drift detected but no protected modules affected.");
} else {
    console.log("PASS: Governance check successful. Architecture is strategy-locked.");
}

const admin = require("firebase-admin");
const { httpsCallable } = require("firebase-functions/v2/https");

// Initialize Admin for local use if needed, but we want to call the emulator
// Actually, it's easier to just call the function directly if we import it, 
// but the user wants the "Run" experience.
// Since I already have test_real_infra logic for calling functions, I'll use that.

async function runDriftCheck() {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

    if (!admin.apps.length) {
        admin.initializeApp({ projectId: "oceanpearl-ops-v2" });
    }

    // We need to be logged in. In test_real_infra, it uses client side SDK.
    // I'll just use the logic from v3AdminEnforcement.js directly in a script to get the EXACT same result 
    // without the overhead of auth tokens for a simple file audit.

    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    const fingerprintPath = path.join(__dirname, '..', '..', 'OPS3_ARCHITECTURE_FINGERPRINT.md');
    const protectedPath = path.join(__dirname, '..', '..', 'OPS3_PROTECTED_MODULES.json');

    console.log("Fingerprint Path:", fingerprintPath);

    if (!fs.existsSync(fingerprintPath)) {
        console.error("Missing fingerprint file.");
        return;
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
        const dir = path.join(__dirname, folder);
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

    const output = {
        driftDetected,
        changedFiles,
        missingFiles,
        unexpectedFiles
    };

    console.log(JSON.stringify(output, null, 2));
}

runDriftCheck();

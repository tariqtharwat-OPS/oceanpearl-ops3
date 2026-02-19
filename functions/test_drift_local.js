const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock a minimal environment to run the drift check logic
const fingerprintPath = path.join(__dirname, '..', '..', 'OPS3_ARCHITECTURE_FINGERPRINT.md');
const protectedPath = path.join(__dirname, '..', '..', 'OPS3_PROTECTED_MODULES.json');

function checkDrift() {
    if (!fs.existsSync(fingerprintPath)) return { error: 'FINGERPRINT_MISSING' };

    const fingerprint = fs.readFileSync(fingerprintPath, 'utf8');
    const protectedModules = JSON.parse(fs.readFileSync(protectedPath, 'utf8')).protected;

    const folders = ['lib', 'admin'];
    const changedFiles = [];
    const missingFiles = [];
    const unexpectedFiles = [];
    const storedHashes = {};

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

    return {
        driftDetected: changedFiles.length > 0 || missingFiles.length > 0 || unexpectedFiles.length > 0,
        changedFiles,
        missingFiles,
        unexpectedFiles
    };
}

console.log("--- CLEAN DRIFT TEST ---");
const clean = checkDrift();
console.log(JSON.stringify(clean, null, 2));

console.log("\n--- SIMULATED DRIFT TEST ---");
const testFile = path.join(__dirname, 'lib', 'reporting.js');
const original = fs.readFileSync(testFile);
fs.appendFileSync(testFile, "\n// Drift Simulation");
const tampered = checkDrift();
console.log(JSON.stringify(tampered, null, 2));

// Restore
fs.writeFileSync(testFile, original);
console.log("\nRestored reporting.js");

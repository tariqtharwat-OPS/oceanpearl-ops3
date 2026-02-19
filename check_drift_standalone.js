const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const fingerprintPath = 'D:/OPS3/OPS3_ARCHITECTURE_FINGERPRINT.md';
const protectedPath = 'D:/OPS3/OPS3_PROTECTED_MODULES.json';

if (!fs.existsSync(fingerprintPath)) {
    console.error('Architecture fingerprint file missing.');
    process.exit(1);
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
    const dir = path.join('D:/OPS3/01_SOURCE_CODE/functions', folder);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dir, file));
            const currentHash = crypto.createHash('sha256').update(content).digest('hex');

            if (!storedHashes[file]) {
                unexpectedFiles.push({ file, folder });
            } else if (storedHashes[file] !== currentHash) {
                const isProtected = protectedModules.includes(file);
                changedFiles.push({ file, folder, isProtected, hash: currentHash });
            }

            delete storedHashes[file];
        });
    }
});

Object.keys(storedHashes).forEach(file => {
    missingFiles.push(file);
});

console.log(JSON.stringify({
    driftDetected: changedFiles.length > 0 || missingFiles.length > 0 || unexpectedFiles.length > 0,
    changedFiles,
    missingFiles,
    unexpectedFiles
}, null, 2));

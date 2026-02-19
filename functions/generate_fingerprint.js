const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const folders = ['lib', 'admin'];
let fingerprint = '# OPS3_ARCHITECTURE_FINGERPRINT.md\n\n';
fingerprint += 'Generated: ' + new Date().toISOString() + '\n\n';
fingerprint += '## 1. CORE MODULES LIST\n\n';

const responsibilities = {
    'auth.js': 'Authentication and RBAC enforcement.',
    'idempotency.js': 'Transaction deduplication and atomicity.',
    'ledger.js': 'Immutable double-entry ledger and hash chain.',
    'inventory.js': 'Inventory valuation and tracking.',
    'workflows.js': 'Business operations orchestration.',
    'shark.js': 'Anomaly detection and risk scoring.',
    'sharkDetectors.js': 'Pure-function threat detection logic.',
    'sharkConfig.js': 'Shark AI thresholds and weights.',
    'reporting.js': 'Scalable reporting via balance shards.',
    'auditExports.js': 'Evidence-grade CSV/JSON exports.',
    'health.js': 'Liveness, Readiness, and Integrity probes.',
    'monitors.js': 'Scheduled integrity and cost monitors.',
    'queryGuards.js': 'Query cost and limit enforcement.',
    'logger.js': 'Standardized structured JSON logging.',
    'traceability.js': 'Cross-dimensional audit trails.',
    'v3AdminBalances.js': 'Administrative balance reconstruction.',
    'v3AdminIncidents.js': 'Incident lifecycle management.',
    'v3AdminPeriods.js': 'Financial period control and snapshots.',
    'v3Bootstrap.js': 'System initialization.',
    'v3SeedTestPack.js': 'Test data environment creation.'
};

folders.forEach(folder => {
    const dir = path.join(__dirname, folder);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dir, file));
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            const resp = responsibilities[file] || 'No description provided.';

            fingerprint += `### ${file}\n`;
            fingerprint += `- **Folder:** ${folder}\n`;
            fingerprint += `- **Responsibility:** ${resp}\n`;
            fingerprint += `- **Hash (SHA256):** \`${hash}\`\n`;
            fingerprint += `- **Boundary:** Mutation only via workflows, strict RBAC.\n\n`;
        });
    }
});

fingerprint += '## 2. CORE INVARIANTS\n\n';
fingerprint += '- Ledger is immutable.\n';
fingerprint += '- All mutations require idempotencyKey.\n';
fingerprint += '- All ledger writes occur inside transaction.\n';
fingerprint += '- Balance shards update atomically.\n';
fingerprint += '- Hash chain must never break.\n';
fingerprint += '- Closed periods block mutations.\n';
fingerprint += '- All queries must pass queryGuards.\n';
fingerprint += '- No random document IDs for financial records.\n';
fingerprint += '- No unbounded scans.\n';

fs.writeFileSync(path.join(__dirname, '..', '..', 'OPS3_ARCHITECTURE_FINGERPRINT.md'), fingerprint);
console.log('OPS3_ARCHITECTURE_FINGERPRINT.md generated.');

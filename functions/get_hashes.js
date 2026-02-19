const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const folders = ['lib', 'admin'];
const results = {};

folders.forEach(folder => {
    const dir = path.join(__dirname, folder);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dir, file));
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            results[file] = hash;
        });
    }
});

console.log(JSON.stringify(results, null, 2));

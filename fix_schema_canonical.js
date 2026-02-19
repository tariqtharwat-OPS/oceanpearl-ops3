const fs = require('fs');
const path = require('path');

const files = [
    'D:/OPS3/01_SOURCE_CODE/functions/lib/auth.js',
    'D:/OPS3/01_SOURCE_CODE/functions/admin/v3SeedTestPack.js',
    'D:/OPS3/01_SOURCE_CODE/functions/admin/v3Bootstrap.js',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/App.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/AdminPanelFull.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Operations.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Finance.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/SharkAI.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const oldContent = content;
        content = content.replace(/allowedLocations/g, 'allowedLocationIds');
        content = content.replace(/allowedUnits/g, 'allowedUnitIds');

        if (content !== oldContent) {
            fs.writeFileSync(file, content);
            console.log(`Updated schema in: ${file}`);
        } else {
            console.log(`No schema changes needed in: ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

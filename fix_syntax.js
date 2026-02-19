const fs = require('fs');
const path = require('path');

const files = [
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Traceability.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/SharkAI.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Operations.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Finance.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/AdminPanelFull.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const newContent = content.replace(/\\u003e/g, '>');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log(`Fixed ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

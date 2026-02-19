const fs = require('fs');
const files = [
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Traceability.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/SharkAI.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Operations.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/Finance.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/pages/AdminPanelFull.tsx',
    'D:/OPS3/01_SOURCE_CODE/frontend/src/App.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Fix arrow functions
        content = content.replace(/\\u003e/g, '>');
        // Fix logical AND
        content = content.replace(/\\u0026/g, '&');
        // Fix logical OR (if it exists)
        content = content.replace(/\\u007c/g, '|');
        // Fix less than (if it exists)
        content = content.replace(/\\u003c/g, '<');

        fs.writeFileSync(file, content);
        console.log(`Fixed ${file}`);
    }
});

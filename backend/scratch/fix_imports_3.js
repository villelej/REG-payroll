const fs = require('fs');
const path = require('path');

const targetDir = 'd:/payroll/payroll-ui-refactor/app';

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Use regex to catch any whitespace (including \r\n) between CreditCard, and useEffect
            if (/CreditCard,\s*useEffect/.test(content)) {
                content = content.replace(/CreditCard,\s*useEffect/, 'useEffect');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed react import in', fullPath);
            }
        }
    }
}

processDir(targetDir);

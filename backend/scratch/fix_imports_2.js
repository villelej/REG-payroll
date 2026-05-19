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

            // Fix the broken react import
            if (content.includes('CreditCard, useEffect')) {
                content = content.replace('CreditCard, useEffect', 'useEffect');
                modified = true;
            } else if (content.includes('CreditCard, \n  useEffect')) {
                content = content.replace('CreditCard, \n  useEffect', 'useEffect');
                modified = true;
            } else if (content.includes('CreditCard,\n  useEffect')) {
                content = content.replace('CreditCard,\n  useEffect', 'useEffect');
                modified = true;
            }

            // Ensure CreditCard is properly in lucide-react
            const lucideMatch = content.match(/import\s+\{[\s\S]*?\}\s+from\s+"lucide-react";/);
            if (lucideMatch && !lucideMatch[0].includes('CreditCard')) {
                content = content.replace(/(import\s+\{)([\s\S]*?\})\s+from\s+"lucide-react";/, '$1\n  CreditCard,$2 from "lucide-react";');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed imports in', fullPath);
            }
        }
    }
}

processDir(targetDir);

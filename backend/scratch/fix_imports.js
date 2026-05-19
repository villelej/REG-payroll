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
            if (content.includes('superAdminMenuItems: SidebarMenuItem[]')) {
                // Check if CreditCard is in the lucide-react import
                const importMatch = content.match(/import \{([\s\S]*?)\} from "lucide-react";/m);
                if (importMatch && !importMatch[1].includes('CreditCard')) {
                    content = content.replace(/import \{([\s\S]*?)\} from "lucide-react";/m, (match, imports) => {
                        return `import {\n  CreditCard,${imports}} from "lucide-react";`;
                    });
                    fs.writeFileSync(fullPath, content);
                    console.log('Fixed imports in', fullPath);
                }
            }
        }
    }
}

processDir(targetDir);

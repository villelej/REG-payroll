const fs = require('fs');
const path = require('path');

const targetDir = 'd:/payroll/payroll-ui-refactor/app';

const correctMenu = `const superAdminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/super-admin-dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/user-management", icon: Users },
  { label: "Role Management", href: "/role-management", icon: ShieldCheck },
  { label: "Payment History", href: "/payment-history", icon: History },
  { label: "Salary Deductions", href: "/salary-deductions", icon: Scissors },
  { label: "Branch Management", href: "/branch-management", icon: MapPin },
  { label: "Category Management", href: "/category-management", icon: List },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
];`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('superAdminMenuItems: SidebarMenuItem[]')) {
                // Replace the menu
                content = content.replace(/const superAdminMenuItems: SidebarMenuItem\[\] = \[[\s\S]*?\];/m, correctMenu);
                
                // Ensure CreditCard is imported if missing
                if (!content.includes('CreditCard')) {
                    content = content.replace(/import \{([\s\S]*?)\} from "lucide-react";/m, (match, imports) => {
                        return `import {\n  CreditCard,${imports}} from "lucide-react";`;
                    });
                }

                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir(targetDir);

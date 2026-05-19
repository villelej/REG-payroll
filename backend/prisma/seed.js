const mariadb = require('mariadb');
const bcrypt = require('bcrypt');

async function seed() {
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'payroll_db'
    });
    console.log('🌱 Starting database seeding (Plain SQL)...');

    // 1. Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await conn.query("INSERT IGNORE INTO hr_users (email, username, full_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      ['admin@payroll.com', 'superadmin', 'System Super Admin', hashedPassword, 'SUPER_ADMIN', 1]);
    console.log('✅ Super Admin created');

    // 2. Company
    await conn.query("INSERT IGNORE INTO companies (company_code, company_name, address_line1, city, company_email, company_phone) VALUES (?, ?, ?, ?, ?, ?)",
      ['TECH-01', 'Antigravity Tech Solutions', '123 AI Boulevard', 'Kigali', 'info@antigravity.com', '+250123456789']);
    const company = (await conn.query("SELECT company_id FROM companies WHERE company_code = 'TECH-01'"))[0];
    console.log('✅ Company created');

    // 3. Branch
    await conn.query("INSERT IGNORE INTO branches (company_id, branch_code, branch_name, address_line1, city) VALUES (?, ?, ?, ?, ?)",
      [company.company_id, 'KGL-HQ', 'Kigali Headquarters', 'Remera, Kigali', 'Kigali']);
    const branch = (await conn.query("SELECT branch_id FROM branches WHERE branch_code = 'KGL-HQ'"))[0];
    console.log('✅ Branch created');

    // 4. Department
    await conn.query("INSERT IGNORE INTO departments (company_id, branch_id, department_code, department_name) VALUES (?, ?, ?, ?)",
      [company.company_id, branch.branch_id, 'ENG', 'Engineering']);
    const dept = (await conn.query("SELECT department_id FROM departments WHERE department_code = 'ENG' AND branch_id = ?", [branch.branch_id]))[0];
    console.log('✅ Department created');

    // 5. Post
    await conn.query("INSERT IGNORE INTO posts (company_id, branch_id, department_id, post_code, post_title, base_salary) VALUES (?, ?, ?, ?, ?, ?)",
      [company.company_id, branch.branch_id, dept.department_id, 'SNR-DEV', 'Senior Developer', 80000]);
    const post = (await conn.query("SELECT post_id FROM posts WHERE post_code = 'SNR-DEV'"))[0];
    console.log('✅ Post created');

    // 6. HR User
    await conn.query("INSERT IGNORE INTO hr_users (email, username, full_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      ['hr@antigravity.com', 'hr_manager', 'Jane Doe', hashedPassword, 'HR', 1]);
    console.log('✅ HR User created');

    // 7. Employee
    await conn.query("INSERT IGNORE INTO employees (company_id, branch_id, department_id, post_id, employee_code, first_name, last_name, personal_email, date_of_birth, gender, phone_number, date_of_joining, current_base_salary, bank_account_holder, bank_name, bank_account_number, bank_ifsc_code, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [company.company_id, branch.branch_id, dept.department_id, post.post_id, 'EMP001', 'John', 'Smith', 'john.smith@gmail.com', '1990-01-01', 'Male', '555-0101', new Date(), 75000, 'John Smith', 'Standard Bank', '987654321', 'STD001', 1]);
    const employee = (await conn.query("SELECT employee_id FROM employees WHERE employee_code = 'EMP001'"))[0];
    console.log('✅ Employee created');

    // 8. Salary Components
    await conn.query("INSERT IGNORE INTO salary_components (company_id, component_code, component_name, component_type, calculation_type, formula) VALUES (?, ?, ?, ?, ?, ?)",
      [company.company_id, 'HRA', 'House Rent Allowance', 'Earning', 'Formula', 'basicSalary * 0.4']);
    const allowance = (await conn.query("SELECT component_id FROM salary_components WHERE component_code = 'HRA' AND company_id = ?", [company.company_id]))[0];

    await conn.query("INSERT IGNORE INTO salary_components (company_id, component_code, component_name, component_type, calculation_type, default_value) VALUES (?, ?, ?, ?, ?, ?)",
      [company.company_id, 'PT', 'Professional Tax', 'Deduction', 'Fixed', 200]);
    const tax = (await conn.query("SELECT component_id FROM salary_components WHERE component_code = 'PT' AND company_id = ?", [company.company_id]))[0];
    console.log('✅ Salary Components created');

    // 9. Link Components
    await conn.query("INSERT IGNORE INTO employee_salary_components (employee_id, component_id, company_id, effective_from, is_applicable) VALUES (?, ?, ?, ?, ?)",
      [employee.employee_id, allowance.component_id, company.company_id, new Date(), 1]);
    await conn.query("INSERT IGNORE INTO employee_salary_components (employee_id, component_id, company_id, effective_from, is_applicable) VALUES (?, ?, ?, ?, ?)",
      [employee.employee_id, tax.component_id, company.company_id, new Date(), 1]);
    console.log('✅ Employee Salary Components linked');

    console.log('🚀 Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    if (conn) await conn.end();
  }
}
seed();

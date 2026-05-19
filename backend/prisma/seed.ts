require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');

console.log('Connecting with user: root to 127.0.0.1');
const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'payroll_db',
  connectionLimit: 10,
});
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Ensure database is selected
  try {
    await prisma.$executeRawUnsafe('USE payroll_db');
  } catch (e) {
    console.log('Note: USE payroll_db failed, might already be selected or not supported via raw');
  }

  // 1. Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.hr_users.upsert({
    where: { email: 'admin@payroll.com' },
    update: {},
    create: {
      email: 'admin@payroll.com',
      username: 'superadmin',
      full_name: 'System Super Admin',
      password_hash: hashedPassword,
      role: 'SUPER_ADMIN',
      is_active: true,
    },
  });
  console.log('✅ Super Admin created');

  // 2. Create Company
  const company = await prisma.companies.upsert({
    where: { company_code: 'TECH-01' },
    update: {},
    create: {
      company_code: 'TECH-01',
      company_name: 'Antigravity Tech Solutions',
      registration_number: 'REG123456',
      contact_email: 'info@antigravity.com',
      contact_phone: '+1234567890',
      address: '123 AI Boulevard',
    },
  });
  console.log('✅ Company created');

  // 3. Create Branch
  const branch = await prisma.branches.upsert({
    where: { branch_code: 'NYC-HQ' },
    update: {},
    create: {
      company_id: company.company_id,
      branch_code: 'NYC-HQ',
      branch_name: 'New York Headquarters',
      branch_address: 'Wall Street, NYC',
    },
  });
  console.log('✅ Branch created');

  // 4. Create Department
  const dept = await prisma.departments.upsert({
    where: { company_id_branch_id_department_code: { company_id: company.company_id, branch_id: branch.branch_id, department_code: 'ENG' } },
    update: {},
    create: {
      company_id: company.company_id,
      branch_id: branch.branch_id,
      department_code: 'ENG',
      department_name: 'Engineering',
    },
  });
  console.log('✅ Department created');

  // 5. Create Post
  const post = await prisma.posts.create({
    data: {
      company_id: company.company_id,
      branch_id: branch.branch_id,
      department_id: dept.department_id,
      post_code: 'SNR-DEV',
      post_title: 'Senior Developer',
      base_salary: 80000,
    }
  });
  console.log('✅ Post created');

  // 6. Create HR User
  const hrUser = await prisma.hr_users.upsert({
    where: { email: 'hr@antigravity.com' },
    update: {},
    create: {
      email: 'hr@antigravity.com',
      username: 'hr_manager',
      full_name: 'Jane Doe',
      password_hash: hashedPassword,
      role: 'HR',
      is_active: true,
    },
  });
  console.log('✅ HR User created');

  // 7. Create Employee
  const employee = await prisma.employees.upsert({
    where: { employee_code: 'EMP001' },
    update: {},
    create: {
      company_id: company.company_id,
      branch_id: branch.branch_id,
      department_id: dept.department_id,
      post_id: post.post_id,
      employee_code: 'EMP001',
      first_name: 'John',
      last_name: 'Smith',
      personal_email: 'john.smith@gmail.com',
      date_of_birth: new Date('1990-01-01'),
      gender: 'Male',
      phone_number: '555-0101',
      date_of_joining: new Date(),
      current_base_salary: 75000,
      bank_account_holder: 'John Smith',
      bank_name: 'Standard Bank',
      bank_account_number: '987654321',
      bank_ifsc_code: 'STD001',
      is_active: true,
    },
  });
  console.log('✅ Employee created');

  // 8. Create Salary Components
  const allowance = await prisma.salary_components.upsert({
    where: { company_id_component_code: { company_id: company.company_id, component_code: 'HRA' } },
    update: {},
    create: {
      company_id: company.company_id,
      component_code: 'HRA',
      component_name: 'House Rent Allowance',
      component_type: 'Earning',
      calculation_type: 'Formula',
      formula: 'basicSalary * 0.4',
    },
  });

  const tax = await prisma.salary_components.upsert({
    where: { company_id_component_code: { company_id: company.company_id, component_code: 'PT' } },
    update: {},
    create: {
      company_id: company.company_id,
      component_code: 'PT',
      component_name: 'Professional Tax',
      component_type: 'Deduction',
      calculation_type: 'Fixed',
      default_value: 200,
    },
  });
  console.log('✅ Salary Components created');

  // 9. Link Components to Employee
  await prisma.employee_salary_components.createMany({
    data: [
      {
        employee_id: employee.employee_id,
        component_id: allowance.component_id,
        company_id: company.company_id,
        effective_from: new Date(),
        is_applicable: true,
      },
      {
        employee_id: employee.employee_id,
        component_id: tax.component_id,
        company_id: company.company_id,
        effective_from: new Date(),
        is_applicable: true,
      },
    ],
  });
  console.log('✅ Employee Salary Components linked');

  console.log('🚀 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

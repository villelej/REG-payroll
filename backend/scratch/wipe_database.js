require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'payroll',
  connectionLimit: 5,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function wipeDatabase() {
  console.log('Starting database wipe...');
  
  try {
    // 1. Unlink hr_users from employees and branches to prevent constraint errors
    console.log('Unlinking hr_users...');
    await prisma.hr_users.updateMany({
      data: {
        employee_id: null,
        branch_id: null
      }
    });

    // 2. Delete child records that depend on multiple parents
    console.log('Deleting audit logs and notifications...');
    await prisma.audit_log.deleteMany();
    await prisma.notifications.deleteMany();
    
    console.log('Deleting payroll details and records...');
    await prisma.payroll_details.deleteMany();
    await prisma.payroll_records.deleteMany();
    await prisma.payroll_batches.deleteMany();

    console.log('Deleting leave records and attendance...');
    await prisma.employee_leaves.deleteMany();
    await prisma.leave_balances.deleteMany();
    await prisma.attendance.deleteMany();

    console.log('Deleting employee profiles and transfers...');
    await prisma.employee_payment_profiles.deleteMany();
    await prisma.employee_transfers.deleteMany();

    // 3. Delete core employee records
    console.log('Deleting employees...');
    await prisma.employees.deleteMany();

    // 4. Delete salary and deduction settings
    console.log('Deleting salary configurations and deductions...');
    await prisma.branch_deductions.deleteMany();
    await prisma.salary_configurations.deleteMany();
    await prisma.salary_components.deleteMany();
    await prisma.salary_grades.deleteMany();

    // 5. Delete organizational structures
    console.log('Deleting organizational structures...');
    await prisma.system_categories.deleteMany();
    await prisma.leave_types.deleteMany();
    await prisma.posts.deleteMany();
    await prisma.departments.deleteMany();
    await prisma.branches.deleteMany();

    console.log('Database wipe completed successfully!');
    
  } catch (error) {
    console.error('Error wiping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();

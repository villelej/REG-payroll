require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'payroll',
  connectionLimit: 5,
};
const adapter = new PrismaMariaDb(config);
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const categories = await prisma.system_categories.findMany();
    console.log('--- SYSTEM CATEGORIES ---');
    console.log(JSON.stringify(categories, null, 2));

    const configurations = await prisma.salary_configurations.findMany();
    console.log('--- SALARY CONFIGURATIONS ---');
    console.log(JSON.stringify(configurations, null, 2));

    const branches = await prisma.branches.findMany();
    console.log('--- BRANCHES ---');
    console.log(JSON.stringify(branches, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function main() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'payroll_db',
    connectionLimit: 5,
  });
  const adapter = new PrismaMariaDb(pool);
  const prisma = new PrismaClient({ adapter });
  // ensure DB selected
  try {
    await prisma.$executeRawUnsafe('USE payroll_db');
  } catch (e) {
    // ignore
  }

  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.hr_users.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password_hash: hash,
      is_active: true,
      full_name: 'Admin Example',
      username: 'admin',
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      full_name: 'Admin Example',
      password_hash: hash,
      role: 'SUPER_ADMIN',
      is_active: true,
    },
  });

  console.log('Upserted user:', user.email);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

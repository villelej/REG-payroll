const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.hr_users.findMany();
    console.log('Users in database:', users.length);
    if (users.length > 0) {
      console.log('First user:', {
        id: users[0].user_id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role,
      });
    } else {
      console.log('No users found in hr_users table.');
    }
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

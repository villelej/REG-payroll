const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.hr_users.findMany({
    where: {
      role: 'Employee',
      AND: [
        {
          OR: [
            { permissions: { contains: 'Gikondo' } },
            { permissions: { contains: 'REG HQ' } }
          ]
        }
      ]
    }
  });
  console.log("Filtered users length:", users.length);
  const allUsers = await prisma.hr_users.findMany({ where: { role: 'Employee' } });
  console.log("All employee users length:", allUsers.length);
  
  await prisma.$disconnect();
}
run().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
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
  console.log("Found users length:", users.length);
  console.log(users.map(u => u.full_name));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

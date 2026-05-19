const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLinks() {
  const count = await prisma.notifications.updateMany({
    where: { action_url: '/my-payslips' },
    data: { action_url: '/payment-history' }
  });
  console.log(`Updated ${count.count} old notification links.`);
}

fixLinks().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const batches = await prisma.payroll_batches.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log('Recent Batches:', JSON.stringify(batches, null, 2));

  const payslips = await prisma.payslips.findMany({
    where: { batch_id: batches[0]?.batch_id },
    take: 5
  });
  console.log('Sample Payslips for latest batch:', JSON.stringify(payslips, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());

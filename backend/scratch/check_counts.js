const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  console.log('Branches:', await prisma.branches.count()); 
  console.log('Deductions:', await prisma.branch_deductions.count()); 
  console.log('Users:', await prisma.hr_users.count()); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());

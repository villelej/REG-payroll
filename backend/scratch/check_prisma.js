const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('Category Deductions fields:');
  // We can't easily see the unique input name without looking at the generated code, 
  // but we can try a dummy query to see if it errors.
  try {
    await prisma.category_deductions.findUnique({
      where: {
        category_id_deduction_name: {
          category_id: 1,
          deduction_name: 'test'
        }
      }
    });
    console.log('category_id_deduction_name is CORRECT');
  } catch (e) {
    console.log('category_id_deduction_name is INCORRECT');
    console.log(e.message);
  }
  process.exit(0);
}

check();

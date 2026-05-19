require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error'] });

async function test() {
  // Check what Jean's record looks like
  const jean = await p.hr_users.findFirst({ where: { username: 'jean' }, include: { employees: true } });
  console.log('Jean hr_user:', JSON.stringify({
    user_id: jean?.user_id,
    employee_id: jean?.employee_id,
    company_id: jean?.company_id,
    branch_id: jean?.branch_id,
    full_name: jean?.full_name,
    category: jean?.category,
    role: jean?.role,
  }, null, 2));
  
  // Check if employee record exists
  if (jean?.employee_id) {
    const emp = await p.employees.findUnique({ where: { employee_id: jean.employee_id } });
    console.log('Employee record exists:', !!emp);
  } else {
    console.log('NO employee record linked!');
  }
  
  // Check available branches, depts, posts
  const branches = await p.branches.findMany({ select: { branch_id: true, branch_name: true, company_id: true } });
  const depts = await p.departments.findMany({ select: { department_id: true, department_name: true, company_id: true } });
  const posts = await p.posts.findMany({ select: { post_id: true, post_title: true, company_id: true } });
  const cats = await p.system_categories.findMany({ select: { category_id: true, category_name: true } });
  console.log('Branches:', JSON.stringify(branches));
  console.log('Departments:', JSON.stringify(depts));
  console.log('Posts:', JSON.stringify(posts));
  console.log('Categories:', JSON.stringify(cats));
}
test().catch(e => console.error('ERROR:', e.message, e.stack)).finally(() => p.$disconnect());

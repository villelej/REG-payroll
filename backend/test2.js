const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({ host: '127.0.0.1', user: 'root', password: 'Da1wi2d$', database: 'payroll' });
  const rows = await pool.query("SELECT user_id, role, permissions FROM hr_users WHERE role = 'User' AND (permissions LIKE '%Gikondo%' OR permissions LIKE '%REG HQ%')");
  console.log(rows);
  process.exit(0);
}
run();

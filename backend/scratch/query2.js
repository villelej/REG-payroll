const mariadb = require('mariadb');
async function main() {
  let pool;
  try {
    pool = mariadb.createPool({ host: '127.0.0.1', user: 'root', password: 'Da1wi2d$', database: 'payroll' });
    const rows = await pool.query('SELECT user_id, username, role FROM hr_users');
    console.log("USERS:", rows);
    const cols = await pool.query('DESCRIBE hr_users');
    console.log("ROLE COL:", cols.find(c => c.Field === 'role'));
  } catch(e) {
    console.error(e);
  } finally {
    if (pool) pool.end();
  }
}
main();

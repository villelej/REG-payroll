const mariadb = require('mariadb');
const fs = require('fs');

async function main() {
  let pool;
  try {
    pool = mariadb.createPool({ host: '127.0.0.1', user: 'root', password: 'Da1wi2d$', database: 'payroll' });
    const rows = await pool.query('SELECT user_id, username, role FROM hr_users');
    fs.writeFileSync('scratch/users_output.json', JSON.stringify(rows, null, 2), 'utf-8');
    
    const cols = await pool.query('DESCRIBE hr_users');
    const roleCol = cols.find(c => c.Field === 'role');
    fs.writeFileSync('scratch/roles_output.json', JSON.stringify(roleCol, null, 2), 'utf-8');
    console.log("Successfully wrote schemas to JSON");
  } catch(e) {
    console.error(e);
  } finally {
    if (pool) pool.end();
  }
}
main();

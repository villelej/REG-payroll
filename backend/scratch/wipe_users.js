require('dotenv').config();
const mariadb = require('mariadb');

async function wipeUsers() {
  console.log('Deleting all non-SuperAdmin users...');
  
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'payroll'
    });

    const result = await conn.query("DELETE FROM hr_users WHERE role != 'SuperAdmin'");
    console.log(`Successfully deleted ${result.affectedRows} users.`);

  } catch (error) {
    console.error('Error wiping users:', error);
  } finally {
    if (conn) conn.end();
  }
}

wipeUsers();

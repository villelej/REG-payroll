const mariadb = require('mariadb');
async function runSql() {
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
    });
    console.log('Connected to MariaDB as root');
    await conn.query("CREATE USER IF NOT EXISTS 'Vig'@'localhost' IDENTIFIED BY ''");
    await conn.query("GRANT ALL PRIVILEGES ON payroll_db.* TO 'Vig'@'localhost'");
    await conn.query("FLUSH PRIVILEGES");
    console.log('Successfully created user Vig and granted privileges');
  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    if (conn) await conn.end();
  }
}
runSql();

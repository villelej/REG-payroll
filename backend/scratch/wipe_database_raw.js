require('dotenv').config();
const mariadb = require('mariadb');

async function wipeDatabase() {
  console.log('Starting dynamic database wipe via raw SQL...');
  
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'payroll'
    });

    // 1. Unlink hr_users from employees and branches
    console.log('Unlinking hr_users...');
    await conn.query(`UPDATE hr_users SET employee_id = NULL, branch_id = NULL`);

    // 2. Disable foreign key checks
    console.log('Disabling foreign key checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // 3. Fetch all tables
    const tablesRaw = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'payroll'");
    
    // Convert to array of strings
    const tables = tablesRaw.map(t => Object.values(t)[0]);
    
    const tablesToKeep = ['hr_users', 'companies', '_prisma_migrations'];
    
    const tablesToWipe = tables.filter(t => !tablesToKeep.includes(t));

    for (const table of tablesToWipe) {
      console.log(`Clearing table: ${table}...`);
      await conn.query(`TRUNCATE TABLE \`${table}\``);
    }

    console.log('Re-enabling foreign key checks...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Database wipe completed successfully!');
    
  } catch (error) {
    console.error('Error wiping database:', error);
  } finally {
    if (conn) conn.end();
  }
}

wipeDatabase();

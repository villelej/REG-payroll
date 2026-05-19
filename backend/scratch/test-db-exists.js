const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
    });
    console.log('Connected to MySQL!');
    const [rows] = await connection.query('SHOW DATABASES LIKE "payroll"');
    if (rows.length > 0) {
      console.log('Database "payroll" exists.');
    } else {
      console.log('Database "payroll" DOES NOT exist.');
    }
    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

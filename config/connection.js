// const mysql = require('mysql');

// const pool = mysql.createPool({
//   connectionLimit: 10,
//   host: 'sg2plzcpnl506716.prod.sin2.secureserver.net',
//   user: 'gulfdigit',
//   password: 'Telepathy321#',
//   database: 'gulfdigit',

//   connectTimeout: 20000,
//   acquireTimeout: 20000,
//   waitForConnections: true,
//   queueLimit: 0
// });

// console.log('Database connected!');
// // Prevent crash on dropped connections
// pool.on("error", (err) => {
//   console.error("MySQL Pool Error:", err.code);
// });

// module.exports = pool;

const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
 host: 'localhost',    // Local machine
  user: 'root',         // Default local MySQL username
  password: '',         // Leave empty for XAMPP/WAMP unless you set one
  database: 'saloon',

  connectTimeout: 20000,
  acquireTimeout: 20000,
  waitForConnections: true,
  queueLimit: 0
});

console.log('Database connected!');
// Prevent crash on dropped connections
pool.on("error", (err) => {
  console.error("MySQL Pool Error:", err.code);
});

module.exports = pool;

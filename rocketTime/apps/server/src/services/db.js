//connect express to mysql
import mysql from 'mysql2/promise';

// create a connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'KHacks',
  password: 'hacking',
  database: 'time',
  waitForConnections:true,
  connectionLimit:10,
  queueLimit:0
});

// connect to mySQL
export async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export default { query };

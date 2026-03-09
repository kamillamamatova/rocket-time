import mysql from 'mysql2/promise';
import 'dotenv/config';

const truthy = (v) => ['1', 'true', 'yes', 'on'].includes(String(v || '').toLowerCase());

const useSsl = truthy(process.env.MYSQL_SSL);
const rejectUnauthorized = truthy(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED ?? 'true');

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  ssl: useSsl ? { rejectUnauthorized } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
});

// Convenience query helper (prepared statements)
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export default {query};

import { Pool } from "pg";

// Create the pool
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === "true" ? {
    rejectUnauthorized: false
  } : false
});

// Test koneksi
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to database');
    release();
  }
});

// Export both pool and db (for backward compatibility)
export const db = pool;
export default pool;
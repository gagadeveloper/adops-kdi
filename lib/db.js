import { Pool } from "pg";

// Parse DATABASE_URL jika tersedia, atau gunakan variabel terpisah
let poolConfig;

if (process.env.DATABASE_URL) {
  // Gunakan DATABASE_URL jika tersedia (terutama di production/Vercel)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? {
      rejectUnauthorized: false
    } : false
  };
} else {
  // Fallback ke variabel terpisah (untuk development lokal)
  poolConfig = {
    user: process.env.DB_USER || process.env.PG_USER,
    host: process.env.DB_HOST || process.env.PG_HOST,
    database: process.env.DB_NAME || process.env.PG_DATABASE,
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD,
    port: parseInt(process.env.DB_PORT || process.env.PG_PORT || '5432'),
    ssl: process.env.DB_SSL === "true" ? {
      rejectUnauthorized: false
    } : false
  };
}

// Create the pool dengan konfigurasi yang tepat
export const pool = new Pool(poolConfig);

// Test koneksi (dengan handling error yang lebih baik)
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to database');
    if (client) release(); // Pastikan client ada sebelum memanggil release
  }
});

// Export both pool and db (for backward compatibility)
export const db = pool;
export default pool;
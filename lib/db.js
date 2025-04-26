import { Pool } from "pg";

// Cek apakah sedang dalam proses build
const isBuildProcess = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Buat fungsi untuk mendapatkan konfigurasi pool
function getPoolConfig() {
  // Jika sedang dalam proses build, kembalikan konfigurasi palsu
  if (isBuildProcess) {
    console.log('⚠️ Build process detected, using dummy database config');
    return {
      user: 'dummy',
      host: 'localhost',
      database: 'dummy',
      password: 'dummy',
      port: 5432,
    };
  }

  // Konfigurasi normal untuk runtime
  if (process.env.DATABASE_URL) {
    console.log('Using connection string from DATABASE_URL');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: false
      } : false,
      // Tambahkan statement timeout untuk mencegah query menggantung
      statement_timeout: 10000, // 10 detik
      // Tambahkan connect timeout
      connect_timeout: 10,
      // Tambahkan parameter untuk pooler
      ...(process.env.DATABASE_URL.includes('pgbouncer=true') ? {
        // Tambahan konfigurasi untuk pgbouncer
        max: 10, // jumlah koneksi maksimum
        idleTimeoutMillis: 30000, // 30 detik
      } : {})
    };
  } else {
    console.log('Using individual connection parameters');
    return {
      user: process.env.DB_USER || process.env.PG_USER,
      host: process.env.DB_HOST || process.env.PG_HOST,
      database: process.env.DB_NAME || process.env.PG_DATABASE,
      password: process.env.DB_PASSWORD || process.env.PG_PASSWORD,
      port: parseInt(process.env.DB_PORT || process.env.PG_PORT || '5432'),
      ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: false
      } : false,
      // Tambahkan statement timeout
      statement_timeout: 10000, // 10 detik
      // Tambahkan connect timeout
      connect_timeout: 10
    };
  }
}

// JANGAN buat pool di tingkat modul, gunakan lazy initialization
let _pool = null;

// Fungsi untuk mendapatkan pool ketika diperlukan
export function getPool() {
  if (isBuildProcess) {
    // Jika build process, kembalikan mock pool
    console.log('⚠️ Build process detected, returning mock pool');
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: () => Promise.resolve({
        release: () => {},
        query: async () => ({ rows: [], rowCount: 0 })
      })
    };
  }

  // Jika belum ada pool, buat baru
  if (!_pool) {
    try {
      const config = getPoolConfig();
      console.log('Creating new connection pool with host:', config.host || 'from connectionString');
      _pool = new Pool(config);
      
      // Tes koneksi
      _pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
      
      // Log koneksi berhasil
      _pool.query('SELECT NOW()')
        .then(() => console.log('✅ Database connection successful'))
        .catch(err => console.error('❌ Initial database connection test failed:', err));
    } catch (err) {
      console.error('❌ Failed to create pool:', err);
      throw err;
    }
  }

  return _pool;
}

// Fungsi query yang lebih aman
export async function query(text, params = []) {
  // Jika build process, kembalikan data dummy
  if (isBuildProcess) {
    console.log('⚠️ Build process detected, returning mock data for query:', text);
    return { rows: [], rowCount: 0 };
  }

  const pool = getPool();
  const startTime = Date.now();
  try {
    console.log(`Executing query: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
    const result = await pool.query(text, params);
    const duration = Date.now() - startTime;
    console.log(`Query completed in ${duration}ms, returned ${result.rowCount} rows`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query failed after ${duration}ms:`, error);
    console.error('Query text:', text);
    console.error('Query params:', params);
    throw error;
  }
}

// Untuk backward compatibility
export const pool = {
  query: async (text, params) => query(text, params),
  connect: async () => {
    if (isBuildProcess) {
      return {
        release: () => {},
        query: async () => ({ rows: [], rowCount: 0 })
      };
    }
    return getPool().connect();
  }
};

export const db = pool;
export default pool;
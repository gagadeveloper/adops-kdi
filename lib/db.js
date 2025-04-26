import { Pool } from "pg";

// Cek apakah sedang dalam proses build
const isBuildProcess = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Buat fungsi untuk mendapatkan konfigurasi pool
function getPoolConfig() {
  // Jika sedang dalam proses build, kembalikan konfigurasi palsu
  if (isBuildProcess) {
    console.log('⚠️ Build process detected, using dummy database config');
    return {
      // Konfigurasi palsu yang tidak akan benar-benar digunakan
      user: 'dummy',
      host: 'localhost',
      database: 'dummy',
      password: 'dummy',
      port: 5432,
    };
  }

  // Konfigurasi normal untuk runtime
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? {
        rejectUnauthorized: false
      } : false
    };
  } else {
    return {
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
    const config = getPoolConfig();
    _pool = new Pool(config);
    
    // Tes koneksi hanya jika bukan build process
    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
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
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
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
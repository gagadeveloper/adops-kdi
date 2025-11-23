import { Pool } from 'pg';

// Membuat lazy-loaded pool
let _pool = null;

function getPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL tidak ditemukan di environment variables');
    throw new Error('Konfigurasi database tidak lengkap.');
  }

  const sslConfig = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
    ? { 
        rejectUnauthorized: false
      }
    : false;

  return {
    connectionString,
    ssl: sslConfig,
    max: 5, // Lebih rendah untuk lingkungan serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

// Fungsi untuk mendapatkan pool
function getPool() {
  if (!_pool) {
    // Ini akan membuat pool hanya saat dibutuhkan, bukan saat import
    _pool = new Pool(getPoolConfig());
    
    _pool.on('error', (err) => {
      console.error('❌ Pool error:', err.message);
      _pool = null; // Reset pool pada error
    });
  }
  return _pool;
}

// Fungsi untuk menjalankan query
export async function query(text, params = []) {
  const pool = getPool();
  let client;
  
  try {
    client = await pool.connect();
    return await client.query(text, params);
  } catch (error) {
    console.error('❌ Query gagal:', error.message);
    throw error;
  } finally {
    if (client) client.release();
    // Tidak perlu end pool di sini
  }
}

// Fungsi untuk transaksi database
export async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaksi dibatalkan:', error.message);
    throw error;
  } finally {
    client.release();
    // Tidak perlu end pool di sini
  }
}

// Compatibility export for direct pool access
// PENTING: Ini hanya akan diinisialisasi saat dipanggil
export const pool = {
  query: async (...args) => getPool().query(...args),
  connect: async () => getPool().connect(),
  end: async () => {
    if (_pool) {
      await _pool.end();
      _pool = null;
    }
  }
};

const db = {
  query,
  transaction,
  pool
};

export default db;
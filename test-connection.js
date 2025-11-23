require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log("----------------------------------------");
console.log("🔍 Testing Connection...");
console.log("URL (Hidden):", connectionString ? connectionString.replace(/:[^:]*@/, ':****@') : "KOSONG");
console.log("----------------------------------------");

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(client => {
    console.log("✅ BERHASIL! Koneksi ke Neon sukses.");
    console.log("Password dan Username benar.");
    return client.query('SELECT NOW()')
      .then(res => {
        console.log("🕒 Waktu Server Database:", res.rows[0].now);
        client.release();
        process.exit(0);
      });
  })
  .catch(err => {
    console.error("❌ GAGAL KONEKSI:");
    console.error(err.message);
    console.error("Code:", err.code);
    process.exit(1);
  });
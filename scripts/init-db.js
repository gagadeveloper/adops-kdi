// Script untuk menginisialisasi database
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Variabel untuk menyimpan instance pool
let pool;

// Inisialisasi koneksi database
function initializePool() {
  try {
    // Ambil connection string dari environment variable
    const connectionString = process.env.DATABASE_URL;
    
    // Cek ketersediaan connection string
    if (!connectionString) {
      console.error('❌ DATABASE_URL tidak ditemukan di environment variables');
      process.exit(1);
    }

    // Konfigurasi SSL berdasarkan environment
    const sslConfig = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
      ? { 
          rejectUnauthorized: false
        }
      : false;

    // Buat pool baru
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
    });

    // Log event koneksi
    pool.on('connect', () => {
      console.log('🔌 Koneksi database berhasil dibuat');
    });

    return pool;
  } catch (error) {
    console.error('❌ Gagal membuat koneksi database:', error.message);
    process.exit(1);
  }
}

// Fungsi untuk menjalankan query
async function query(text, params = []) {
  const dbPool = initializePool();
  
  let client;
  try {
    client = await dbPool.connect();
    console.log('🔐 Menjalankan query:', text.substring(0, 50) + '...');
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Query gagal:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Fungsi utama untuk inisialisasi database
async function initDb() {
  try {
    console.log('🚀 Memulai inisialisasi database...');
    
    // 1. Buat tabel Role jika belum ada
    console.log('📊 Membuat tabel Role...');
    await query(`
      CREATE TABLE IF NOT EXISTS "Role" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Buat tabel User jika belum ada - MENGGUNAKAN password_hash bukan password
    console.log('📊 Membuat tabel User...');
    await query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        roleId INTEGER REFERENCES "Role"(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 3. Buat tabel Menu jika belum ada
    console.log('📊 Membuat tabel Menus...');
    await query(`
      CREATE TABLE IF NOT EXISTS "Menus" (
        id SERIAL PRIMARY KEY,
        menu_name VARCHAR(100) NOT NULL,
        icon VARCHAR(100),
        path VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 4. Buat tabel Role_Menus jika belum ada
    console.log('📊 Membuat tabel Role_Menus...');
    await query(`
      CREATE TABLE IF NOT EXISTS "Role_Menus" (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES "Role"(id) ON DELETE CASCADE,
        menu_id INTEGER REFERENCES "Menus"(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, menu_id)
      )
    `);
    
    // 5. Cek apakah Role Admin sudah ada
    const adminRoleResult = await query(`
      SELECT id FROM "Role" WHERE name = 'Super Admin' LIMIT 1
    `);
    
    let adminRoleId;
    
    if (adminRoleResult.rows.length === 0) {
      console.log('🔧 Membuat Role Admin...');
      const adminRole = await query(`
        INSERT INTO "Role" (name)
        VALUES ('Super Admin')
        RETURNING id
      `);
      adminRoleId = adminRole.rows[0].id;
    } else {
      adminRoleId = adminRoleResult.rows[0].id;
      console.log('✅ Role Admin sudah ada dengan ID:', adminRoleId);
    }
    
    // 6. Buat user admin default jika belum ada - MENGGUNAKAN password_hash bukan password
    const adminUserResult = await query(`
      SELECT id FROM "User" WHERE email = 'sadmin@coba.com' LIMIT 1
    `);
    
    if (adminUserResult.rows.length === 0) {
      console.log('🔧 Membuat user admin default...');
      // Hash password admin default
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await query(`
        INSERT INTO "User" (name, email, password_hash, roleId)
        VALUES ('Super Admin', 'sadmin@coba.com', $1, $2)
      `, [hashedPassword, adminRoleId]);
      
      console.log('✅ User admin berhasil dibuat dengan email: sadmin@coba.com dan password: admin123');
    } else {
      console.log('✅ User admin sudah ada');
    }
    
    // 7. Tambahkan menu default
    const defaultMenus = [
      { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
      { name: 'Users', icon: 'users', path: '/users' },
      { name: 'Settings', icon: 'settings', path: '/settings' }
    ];
    
    console.log('🔧 Menambahkan menu default...');
    
    for (const menu of defaultMenus) {
      // Cek apakah menu sudah ada
      const existingMenu = await query(`
        SELECT id FROM "menus" WHERE menu_name = $1 LIMIT 1
      `, [menu.name]);
      
      let menuId;
      
      if (existingMenu.rows.length === 0) {
        // Tambahkan menu baru
        const result = await query(`
          INSERT INTO "menus" (menu_name, icon, path)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [menu.name, menu.icon, menu.path]);
        
        menuId = result.rows[0].id;
        console.log(`✅ Menu ${menu.name} berhasil ditambahkan`);
      } else {
        menuId = existingMenu.rows[0].id;
        console.log(`✅ Menu ${menu.name} sudah ada`);
      }
      
      // Tambahkan relasi menu ke role admin
      const roleMenuExists = await query(`
        SELECT id FROM "role_menus" 
        WHERE role_id = $1 AND menu_id = $2 LIMIT 1
      `, [adminRoleId, menuId]);
      
      if (roleMenuExists.rows.length === 0) {
        await query(`
          INSERT INTO "role_menus" (role_id, menu_id)
          VALUES ($1, $2)
        `, [adminRoleId, menuId]);
        
        console.log(`✅ Menu ${menu.name} ditambahkan ke role Admin`);
      }
    }
    
    console.log('✅ Inisialisasi database selesai.');
    
  } catch (error) {
    console.error('❌ Gagal menginisialisasi database:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('👋 Koneksi database ditutup');
    }
    process.exit(0);
  }
}

// Jalankan fungsi inisialisasi
initDb();
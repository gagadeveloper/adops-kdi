// api/users/[id]/route.js - FIXED VERSION
import db from '@/lib/db';

// ✅ DELETE: Hapus User berdasarkan ID - No changes needed
export async function DELETE(req, { params }) {
  const { id } = params; // Ambil ID dari URL

  if (!id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  try {
    const query = `DELETE FROM "User" WHERE id = $1 RETURNING *;`;
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("❌ Delete User Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

// ✅ GET: Ambil Data User berdasarkan ID + Menu yang diakses - FIXED
export async function GET(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  try {
    // Ambil data user
    const userQuery = `
      SELECT 
        u.id, u.email, u.name, u.department, u."employeeId", 
        u.position, u."roleId", u.status, u.bank_account, 
        u.bank_name, u.address, u.location
      FROM "User" u
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [id]);

    if (userResult.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    // Transform user data with proper camelCase
    const user = {
      ...userResult.rows[0],
      bankAccount: userResult.rows[0].bank_account,
      bankName: userResult.rows[0].bank_name
    };
    
    // Then remove the original snake_case properties
    delete user.bank_account;
    delete user.bank_name;

    // Ambil menu yang dimiliki user dari tabel relasi user_menus dengan nama menu
    const menuQuery = `
      SELECT m.id, m.menu_name 
      FROM user_menus um
      JOIN menus m ON um.menu_id = m.id
      WHERE um.user_id = $1;
    `;
    const menuResult = await db.query(menuQuery, [id]);
    
    // Format menu items with value and label for the select component
    const menuIds = menuResult.rows.map(row => ({
      value: row.id,
      label: row.menu_name
    }));

    return new Response(
      JSON.stringify({ ...user, menuIds }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Fetch User Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

// ✅ PUT: Update Data User + Update Menu yang Dipilih - FIXED
export async function PUT(req, { params }) {
  const { id } = params; 
  const body = await req.json(); // Data dari frontend

  if (!id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  try {
    // Process password update if necessary
    if (body.password) {
      // Import bcrypt dynamically to avoid errors
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(body.password, 10);
      
      const updatePasswordQuery = `
        UPDATE "User"
        SET password_hash = $1
        WHERE id = $2;
      `;
      
      await db.query(updatePasswordQuery, [passwordHash, id]);
    }

    // Update the user data
    const updateUserQuery = `
    UPDATE "User"
    SET name = $1, department = $2, position = $3, "roleId" = $4, status = $5,
        bank_account = $6, bank_name = $7, address = $8, location = $9
    WHERE id = $10
    RETURNING *;
    `;

    const values = [
      body.name, 
      body.department, 
      body.position, 
      body.roleId, 
      body.status,
      body.bankAccount, // Map from camelCase to snake_case
      body.bankName,    // Map from camelCase to snake_case
      body.address,
      body.location,
      id
    ];

    const result = await db.query(updateUserQuery, values);
    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    // Delete existing user_menus entries for this user
    const deleteUserMenusQuery = `DELETE FROM user_menus WHERE user_id = $1;`;
    await db.query(deleteUserMenusQuery, [id]);

    // Add new user_menus entries
    if (body.menuIds && body.menuIds.length > 0) {
      // Get the next available ID from user_menus
      const getMaxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM user_menus`;
      const maxIdResult = await db.query(getMaxIdQuery);
      let nextId = maxIdResult.rows[0].next_id || 1;
      
      // Prepare batch insert with proper IDs
      const values = [];
      const valuePlaceholders = [];
      let placeholderIndex = 1;
      
      for (const menuId of body.menuIds) {
        // Handle both object format and plain value format
        const menuIdValue = typeof menuId === 'object' ? menuId.value : Number(menuId);
        values.push(nextId, id, menuIdValue);
        valuePlaceholders.push(`($${placeholderIndex}, $${placeholderIndex + 1}, $${placeholderIndex + 2})`);
        placeholderIndex += 3;
        nextId++;
      }
      
      const insertUserMenusQuery = `
        INSERT INTO user_menus (id, user_id, menu_id)
        VALUES ${valuePlaceholders.join(', ')}
      `;
      
      await db.query(insertUserMenusQuery, values);
    }

    return new Response(
      JSON.stringify({ message: "User updated successfully" }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Update User Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
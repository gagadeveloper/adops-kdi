import pool from '../../../../lib/db'; // Pastikan path ke db benar

// ✅ DELETE: Hapus User berdasarkan ID
export async function DELETE(req, { params }) {
  const { id } = params; // Ambil ID dari URL

  if (!id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  try {
    const query = `DELETE FROM "User" WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("❌ Delete User Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

// ✅ GET: Ambil Data User berdasarkan ID + Menu yang diakses
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
        u.position, u."roleId", u.status, u.bank_account as "bankAccount", 
        u.bank_name as "bankName", u.address, u.location
      FROM "User" u
      WHERE u.id = $1
    `;
    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    const user = {
      ...userResult.rows[0],
      bankAccount: userResult.rows[0].bank_account,
      bankName: userResult.rows[0].bank_name
      // Other transformations if needed
    };
    
    // Then remove the original snake_case properties
    delete user.bank_account;
    delete user.bank_name;

    // Ambil menu yang dimiliki user dari tabel relasi role_menus
    const menuQuery = `
      SELECT m.id, m.menu_name 
      FROM "role_menus" rm
      JOIN "menus" m ON rm.menu_id = m.id
      WHERE rm.role_id = $1;
    `;
    const menuResult = await pool.query(menuQuery, [user.roleId]);
    const menuIds = menuResult.rows.map(row => row.id); // Ambil hanya ID menu

    return new Response(
      JSON.stringify({ ...user, menuIds }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Fetch User Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

// ✅ PUT: Update Data User + Update Menu yang Dipilih
export async function PUT(req, { params }) {
  const { id } = params; 
  const body = await req.json(); // Data dari frontend

  if (!id) {
    return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
  }

  // Add this before the user update query
  if (body.password) {
    // Assume you have a password hashing function
    const passwordHash = await hashPassword(body.password);
    
    const updatePasswordQuery = `
      UPDATE "User"
      SET password_hash = $1
      WHERE id = $2;
    `;
    
    await pool.query(updatePasswordQuery, [passwordHash, id]);
  }

  try {
    // Update the PUT endpoint query
    const updateUserQuery = `
    UPDATE "User"
    SET name = $1, email = $2, department = $3, position = $4, "roleId" = $5, status = $6,
        bank_account = $7, bank_name = $8, address = $9, location = $10
    WHERE id = $11
    RETURNING *;
    `;

    const values = [
    body.name, 
    body.email, 
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

    const result = await pool.query(updateUserQuery, values);
    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    // 2️⃣ Hapus menu lama dari role_menus
    const deleteMenuQuery = `DELETE FROM "role_menus" WHERE role_id = $1;`;
    await pool.query(deleteMenuQuery, [body.roleId]);

    // 3️⃣ Masukkan menu baru ke role_menus jika ada
    if (body.menuIds && body.menuIds.length > 0) {
      const insertMenuQuery = `
        INSERT INTO "role_menus" (role_id, menu_id) 
        VALUES ${body.menuIds.map((_, i) => `($1, $${i + 2})`).join(", ")}
      `;

      await pool.query(insertMenuQuery, [body.roleId, ...body.menuIds]);
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

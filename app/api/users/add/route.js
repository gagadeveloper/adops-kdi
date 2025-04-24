// app/api/users/add/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      email, 
      password, 
      name, 
      department, 
      employeeId, 
      position, 
      roleId, 
      menuIds, 
      status,
      // Data tambahan
      bankAccount,
      bankName,
      address,
      location
    } = await req.json();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user dengan kolom tambahan
    const insertUserQuery = `
      INSERT INTO "User" (
        email, 
        password_hash, 
        name, 
        department, 
        "employeeId", 
        position, 
        "roleId", 
        status,
        bank_account,
        bank_name,
        address,
        location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const userResult = await client.query(insertUserQuery, [
      email,
      hashedPassword,
      name,
      department,
      employeeId,
      position,
      roleId,
      status,
      bankAccount || null,
      bankName || null,
      address || null,
      location || 'Makassar'
    ]);

    const userId = userResult.rows[0].id;

    // PENTING: Jangan insert ke role_menus disini
    // Itu akan merusak semua menu role yang ada

    // Insert user_menus
    if (menuIds && menuIds.length > 0) {
      const insertUserMenusQuery = `
        INSERT INTO user_menus (user_id, menu_id)
        VALUES ($1, unnest($2::integer[]))
      `;
      await client.query(insertUserMenusQuery, [userId, menuIds]);
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      message: "User added successfully", 
      userId 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error adding user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(req, { params }) {
  const { id } = params;
  const client = await pool.connect();
  
  try {
    // Query user-specific menus from user_menus table
    const query = `
      SELECT m.* 
      FROM menus m
      JOIN user_menus um ON m.id = um.menu_id
      WHERE um.user_id = $1
      ORDER BY m.menu_order
    `;
    
    const result = await client.query(query, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching user menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch user menus" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
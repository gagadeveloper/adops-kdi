import db from '@/lib/db';
import { NextResponse } from "next/server";

// Fungsi POST yang sudah ada
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("📥 Received Data:", body);

    const { menu_name, icon, path, menu_order, parent_id } = body;

    if (!menu_name) {
      return NextResponse.json({ error: "menu_name is required" }, { status: 400 });
    }

    const query = `
      INSERT INTO menus (menu_name, icon, path, menu_order, parent_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;

    const values = [menu_name, icon || null, path || null, menu_order || null, parent_id || null];

    const result = await db.query(query, values);

    console.log("✅ Menu Created:", result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error in POST /api/menus:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Fixed GET function to properly return menu hierarchies
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    console.log(`🔐 Fetching menus for user email: ${email}`);

    // First get all menus this user has access to (flat list)
    const query = `
      SELECT DISTINCT m.*
      FROM menus m
      LEFT JOIN user_menus um ON m.id = um.menu_id
      LEFT JOIN "User" u ON CAST(um.user_id AS VARCHAR) = CAST(u.id AS VARCHAR)
      LEFT JOIN role_menus rm ON m.id = rm.menu_id
      WHERE u.email = $1
      OR rm.role_id = (
        SELECT "roleId"
        FROM "User"
        WHERE email = $1
      )
      ORDER BY m.menu_order;
    `;

    const result = await db.query(query, [email]);
    const menus = result.rows;
    
    console.log(`✅ Retrieved ${menus.length} menu items for user ${email}`);
    
    // Return the flat list directly - we'll let the frontend component handle hierarchical display
    return NextResponse.json(menus);
  } catch (error) {
    console.error('❌ Error fetching user menus:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
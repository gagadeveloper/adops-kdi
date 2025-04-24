import pool from "@/lib/db";
import { NextResponse } from "next/server";

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

    const result = await pool.query(query, values);

    console.log("✅ Menu Created:", result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error in POST /api/menus:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

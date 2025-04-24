import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

// Get specific menu
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const result = await pool.query(
      "SELECT * FROM menus WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Menu not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error fetching menu:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Update menu
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { menu_name, icon, path, menu_order, parent_id } = body;

    // Ambil menu yang sudah ada untuk mempertahankan kolom yang tidak diubah
    const existingMenu = await pool.query(
      "SELECT * FROM menus WHERE id = $1",
      [id]
    );

    if (existingMenu.rows.length === 0) {
      return NextResponse.json(
        { message: "Menu not found" },
        { status: 404 }
      );
    }

    const oldMenu = existingMenu.rows[0];
    
    // Tentukan nilai yang akan di-update, hanya yang dikirimkan saja
    const updatedMenuName = menu_name || oldMenu.menu_name;
    const updatedIcon = icon || oldMenu.icon;
    const updatedPath = path || oldMenu.path;
    const updatedMenuOrder = menu_order || oldMenu.menu_order;
    const updatedParentId = parent_id !== undefined ? parent_id : oldMenu.parent_id;

    // Update menu dengan nilai baru atau nilai lama jika tidak diubah
    const result = await pool.query(
      `UPDATE menus
       SET menu_name = $1, icon = $2, path = $3, menu_order = $4, parent_id = $5
       WHERE id = $6
       RETURNING *`,
      [updatedMenuName, updatedIcon, updatedPath, updatedMenuOrder, updatedParentId, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Menu not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error updating menu:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Delete menu
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // First check if menu has children
    const childrenCheck = await pool.query(
      "SELECT id FROM menus WHERE parent_id = $1",
      [id]
    );

    if (childrenCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete menu with sub-menus" },
        { status: 400 }
      );
    }

    // Then check if menu is used in role_menus
    const roleCheck = await pool.query(
      "SELECT menu_id FROM role_menus WHERE menu_id = $1",
      [id]
    );

    if (roleCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete menu assigned to roles" },
        { status: 400 }
      );
    }

    // If all checks pass, delete the menu
    const result = await pool.query(
      "DELETE FROM menus WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Menu not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Menu deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting menu:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

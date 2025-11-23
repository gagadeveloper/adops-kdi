import { NextResponse } from "next/server";
import db from '@/lib/db';

// Force delete menu API route
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    
    // First delete any role_menu associations
    await db.query(
      "DELETE FROM role_menus WHERE menu_id = $1",
      [id]
    );
    
    // Then delete any child menus recursively
    // First get all children
    const childrenResult = await db.query(
      "SELECT id FROM menus WHERE parent_id = $1",
      [id]
    );
    
    // Recursive delete for each child
    for (const child of childrenResult.rows) {
      // This is a simplified approach - for production, consider using a recursive SQL query instead
      const childResponse = await fetch(`${req.nextUrl.origin}/api/menus/${child.id}/force`, {
        method: 'DELETE',
      });
      
      if (!childResponse.ok) {
        throw new Error(`Failed to delete child menu ${child.id}`);
      }
    }
    
    // Finally delete the menu itself
    const result = await db.query(
      "DELETE FROM menus WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Menu not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Menu and all dependencies deleted successfully" });
  } catch (error) {
    console.error("❌ Error force deleting menu:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import db from '@/lib/db';

// Path to check if menu is used in roles
export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    const roleCheck = await db.query(
      "SELECT COUNT(*) FROM role_menus WHERE menu_id = $1",
      [id]
    );
    
    const hasRoles = parseInt(roleCheck.rows[0].count) > 0;
    
    return NextResponse.json({ hasRoles });
  } catch (error) {
    console.error("❌ Error checking menu roles:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
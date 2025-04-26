import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export async function POST(req) {
    try {
      const { roleId, menuIds } = await req.json();
  
      if (!roleId || !Array.isArray(menuIds) || menuIds.length === 0) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
      }
  
      // Hapus menu lama untuk role yang dipilih
      await pool.query(`DELETE FROM "role_menus" WHERE "role_id" = $1`, [role_id]);
  
      // Insert menu baru
      const values = menuIds.map((menu_id) => `(${role_id}, ${menu_id})`).join(",");
      await pool.query(`INSERT INTO "role_menus" ("role_id", "menu_id") VALUES ${values}`);
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error assigning menus:", error);
      return NextResponse.json({ error: "Failed to assign menus" }, { status: 500 });
    }
  }
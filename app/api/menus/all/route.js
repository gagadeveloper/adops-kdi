import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  try {
    console.log("🔍 Fetching all menus...");
    const result = await pool.query(
      `SELECT id, menu_name FROM menus ORDER BY menu_order ASC`
    );

    console.log("✅ Query Result:", result.rows);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching all menus:', error);
    return NextResponse.json({ message: 'Error fetching all menus' }, { status: 500 });
  }
}

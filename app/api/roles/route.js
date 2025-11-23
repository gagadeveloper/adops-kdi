import { NextResponse } from "next/server";
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const result = await db.query(`SELECT id, name FROM "Role"`); // Sesuaikan dengan struktur tabel
    return NextResponse.json(result.rows); // Mengembalikan array role
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

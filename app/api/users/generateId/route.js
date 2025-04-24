// app/api/users/generateId/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  const client = await pool.connect();
  
  try {
    // Dapatkan jumlah total user
    const countResult = await client.query('SELECT COUNT(*) FROM "User"');
    const userCount = parseInt(countResult.rows[0].count, 10);
    
    // Buat ID baru dengan format EMP-tahun-bulan-no_urut
    const now = new Date();
    const year = now.getFullYear().toString().slice(2); // 2-digit year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (1-12)
    
    // Generate next sequence number
    const nextNum = (userCount + 1).toString().padStart(4, '0');
    
    // Format: EMP-YY-MM-XXXX
    const employeeId = `EMP-${year}-${month}-${nextNum}`;
    
    return NextResponse.json({ employeeId });
  } catch (error) {
    console.error("Error generating employee ID:", error);
    return NextResponse.json(
      { error: "Failed to generate employee ID" }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
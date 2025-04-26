import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  // Deteksi proses build
  const isBuildProcess = process.env.NODE_ENV === 'production' && 
                         (process.env.NEXT_PHASE === 'phase-production-build' || 
                          process.env.__NEXT_PROCESSED_ENV);
  
  if (isBuildProcess) {
    console.log('Build process detected, returning mock employee ID');
    return NextResponse.json({ employeeId: 'EMP-25-04-0001' });
  }
  
  let client;
  
  try {
    client = await pool.connect();
    
    // Query total user dengan error handling
    const countResult = await client.query('SELECT COUNT(*) FROM "User"');
    
    // Defensive programming untuk hasil query
    if (!countResult || !countResult.rows || countResult.rows.length === 0) {
      console.log('No count result available, using default');
      return NextResponse.json({ employeeId: 'EMP-25-04-0001' });
    }
    
    // Parse count dengan error handling
    const userCount = countResult.rows[0] && countResult.rows[0].count !== undefined 
      ? parseInt(countResult.rows[0].count, 10) 
      : 0;
    
    // Buat ID dengan format yang benar
    const now = new Date();
    const year = now.getFullYear().toString().slice(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const nextNum = (userCount + 1).toString().padStart(4, '0');
    
    const employeeId = `EMP-${year}-${month}-${nextNum}`;
    
    return NextResponse.json({ employeeId });
  } catch (error) {
    console.error("Error generating employee ID:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to generate employee ID", details: error.message }, 
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
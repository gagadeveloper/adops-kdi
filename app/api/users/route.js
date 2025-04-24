import { pool } from '../../../lib/db'; 
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Query untuk mendapatkan semua users
    const result = await pool.query('SELECT id, email, name, department, position, "roleId", status FROM "User"');
    
    console.log('Retrieved users:', result.rows); // Debugging di terminal
    
    // Mengembalikan array dari semua users
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}

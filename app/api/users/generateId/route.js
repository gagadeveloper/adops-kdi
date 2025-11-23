import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Get current month and year
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const year = String(today.getFullYear()).slice(-2); // Last two digits

    // Query to get the latest employee ID with this pattern
    const query = `
      SELECT "employeeId" 
      FROM "User" 
      WHERE "employeeId" LIKE $1 
      ORDER BY "employeeId" DESC 
      LIMIT 1
    `;
    
    const pattern = `EMP-${year}-${month}-%`;
    const result = await db.query(query, [pattern]);
    
    let newId;
    
    if (result.rows.length > 0) {
      // If existing IDs found, increment the sequence number
      const lastId = result.rows[0].employeeId;
      const lastSequence = parseInt(lastId.split('-')[3]);
      const newSequence = lastSequence + 1;
      newId = `EMP-${year}-${month}-${String(newSequence).padStart(4, '0')}`;
    } else {
      // No existing IDs for this month/year, start with 0001
      newId = `EMP-${year}-${month}-0001`;
    }
    
    return NextResponse.json({ employeeId: newId });
  } catch (error) {
    console.error('Error generating Employee ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate Employee ID' },
      { status: 500 }
    );
  }
}
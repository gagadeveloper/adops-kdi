import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';
// GET all samples
export async function GET(request) {
  try {
    console.log('Tracking Samples API called');
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'today', 'weekly', 'monthly', or 'all'
    const status = searchParams.get('status'); // Optional status filter
    
    // Base query
    let queryParams = [];
    let whereClause = '';
    
    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'monthly') {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      if (startDate) {
        whereClause = 'WHERE created_at >= $1';
        queryParams.push(startDate.toISOString());
      }
    }
    
    // Apply status filter if provided
    if (status) {
      const statusConditions = {
        'preparation': 'preparation_completed_date IS NOT NULL AND analysis_completed_date IS NULL',
        'analysis': 'analysis_completed_date IS NOT NULL AND roa_issued_date IS NULL',
        'roa': 'roa_issued_date IS NOT NULL AND coa_issued_date IS NULL',
        'coa': 'coa_issued_date IS NOT NULL'
      };
      
      if (statusConditions[status]) {
        whereClause = whereClause ? 
          `${whereClause} AND ${statusConditions[status]}` : 
          `WHERE ${statusConditions[status]}`;
      }
    }
    
    // Build the full query
    const queryText = `
      SELECT *
      FROM tracking_samples
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    console.log('Executing query:', queryText);
    console.log('With params:', queryParams);
    
    // Execute query
    const result = await db.query(queryText, queryParams);
    console.log(`Retrieved ${result.rows.length} tracking samples`);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching tracking samples:', error);
    
    // Check for common errors
    if (error.code === 'ECONNREFUSED') {
      console.error('Database connection refused');
    } else if (error.code === '42P01') {
      console.error('Table does not exist');
      // Return empty array if table doesn't exist
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}

// POST method for creating new tracking samples
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.sample_code || !data.sender_name || !data.quantity) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }
    
    // Set creation timestamp if not provided
    if (!data.created_at) {
      data.created_at = new Date().toISOString();
    }
    
    // Prepare field names and placeholders
    const fields = Object.keys(data).filter(key => data[key] !== undefined && data[key] !== null);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const values = fields.map(field => data[field]);
    
    const query = `
      INSERT INTO tracking_samples (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tracking sample:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}
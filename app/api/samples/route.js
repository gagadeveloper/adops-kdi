import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    let query;
    let params = [];
    
    // For dashboard, we need all samples without filtering by orderId
    if (!orderId) {
      query = `
        SELECT * FROM samples 
        ORDER BY created_at DESC
      `;
    } else {
      // For specific order detail pages
      query = `
        SELECT * FROM samples 
        WHERE order_id = $1
        ORDER BY created_at DESC
      `;
      params = [orderId];
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: `Gagal mengambil data samples: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.order_id) {
      return NextResponse.json(
        { error: "Order ID diperlukan" },
        { status: 400 }
      );
    }
    
    // Insert query implementation here
    // ...
    
    return NextResponse.json({ message: "Sample ditambahkan" });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: `Gagal menambahkan sample: ${error.message}` },
      { status: 500 }
    );
  }
}
// /app/api/pi_hantaran/update-payment/[id]/route.js
import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const id = params.id;
  const data = await request.json();
  
  try {
    // Extract data from request
    const { status, invoice_no, payment_date } = data;
    
    // Update pi_hantaran with status, invoice_no, and payment_date
    const result = await db.query(
      'UPDATE pi_hantaran SET status = $1, invoice_no = $2 WHERE id = $3 RETURNING *',
      [status, invoice_no || new Date(), id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'PI Hantaran tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { message: 'Error mengupdate pembayaran', error: error.message }, 
      { status: 500 }
    );
  }
}
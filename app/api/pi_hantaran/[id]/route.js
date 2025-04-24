// /app/api/pi_hantaran/[id]/route.js
import { pool } from '@/lib/db'; // Adjust this path
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const id = params.id;
  
  try {
    // Your database query code here
    const result = await pool.query('SELECT * FROM pi_hantaran WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'PI Hantaran not found' }, { status: 404 });
    }
    
    // Return the data
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { message: 'Error retrieving data', error: error.message }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const orderId = parseInt(params.id, 10);

  if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
      // Hapus data dari tabel 'pi_hantaran'
      const deleteQuery = `DELETE FROM pi_hantaran WHERE id = $1 RETURNING *;`;
      const { rows } = await pool.query(deleteQuery, [orderId]);

      if (rows.length === 0) {
          return NextResponse.json({ error: "pi_hantaran tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ message: "PI berhasil dihapus" }, { status: 200 });
  } catch (error) {
      console.error("Error deleting order:", error);
      return NextResponse.json({ error: "Gagal menghapus PI" }, { status: 500 });
  }
}
import db from '@/lib/db';
import { NextResponse } from "next/server";

// Handler untuk GET: Ambil detail order berdasarkan ID
export async function GET(request, { params }) {
  const orderId = params.id;

  try {
    // Query untuk mendapatkan data order berdasarkan ID
    const orderQuery = `
      SELECT * FROM orders 
      WHERE id = $1
    `;

    const orderResult = await db.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    }

    // Query untuk mendapatkan samples terkait order
    const samplesQuery = `
      SELECT * FROM samples
      WHERE order_id = $1
    `;

    const samplesResult = await db.query(samplesQuery, [orderId]);

    // Gabungkan data order dengan samples
    const orderData = {
      ...orderResult.rows[0],
      samples: samplesResult.rows
    };

    return NextResponse.json(orderData);
  } catch (error) {
    console.error('Error fetching order data:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Handler untuk DELETE: Hapus order berdasarkan ID
export async function DELETE(request, { params }) {
  const orderId = params.id;

  try {
    // Mulai transaksi
    await db.query('BEGIN');

    // Hapus samples terkait terlebih dahulu
    await db.query('DELETE FROM samples WHERE order_id = $1', [orderId]);

    // Hapus order
    const deleteQuery = `DELETE FROM orders WHERE id = $1 RETURNING *`;
    const result = await db.query(deleteQuery, [orderId]);
    
    if (result.rows.length === 0) {
      // Rollback jika order tidak ditemukan
      await db.query('ROLLBACK');
      return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    }

    // Commit transaksi
    await db.query('COMMIT');
    
    return NextResponse.json({ 
      message: 'Order dan samples terkait berhasil dihapus',
      deletedOrder: result.rows[0]
    });
  } catch (error) {
    // Rollback jika terjadi error
    await db.query('ROLLBACK');
    console.error('Error deleting order:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}

// Handler untuk PUT: Update order berdasarkan ID
export async function PUT(request, { params }) {
  const orderId = params.id;

  try {
    const bodyData = await request.json();
    
    // Update order
    const updateQuery = `
      UPDATE orders
      SET 
        client_name = $1,
        sample_order_no = $2,
        phone = $3,
        email = $4,
        address = $5,
        date = $6,
        total_qty = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    
    const updateValues = [
      bodyData.client_name,
      bodyData.sample_order_no,
      bodyData.phone,
      bodyData.email,
      bodyData.address,
      bodyData.date,
      bodyData.total_qty,
      orderId
    ];
    
    const { rows } = await db.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Order berhasil diupdate',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
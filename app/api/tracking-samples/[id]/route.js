import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const sampleId = params.id;
    
    // Query untuk mendapatkan detail sample berdasarkan ID
    const query = `
      SELECT * FROM tracking_samples
      WHERE id = $1
    `;
    
    const { rows } = await pool.query(query, [sampleId]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Sample tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sample detail:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    );
  }
}

// Jika dibutuhkan untuk update data sample
export async function PUT(request, { params }) {
  try {
    const sampleId = params.id;
    const data = await request.json();
    
    // Query untuk update data sample
    const query = `
      UPDATE tracking_samples
      SET 
        sender_name = $1,
        sample_code = $2,
        quantity = $3,
        barcode_seal = $4,
        driver_name = $5,
        plate_number = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    
    const values = [
      data.sender_name,
      data.sample_code,
      data.quantity,
      data.barcode_seal,
      data.driver_name,
      data.plate_number,
      sampleId
    ];
    
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Sample tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Sample berhasil diupdate',
      data: rows[0]
    });
     
  } catch (error) {
    console.error('Error updating sample:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    );
  }
}

// Untuk menghapus data sample
export async function DELETE(request, { params }) {
  try {
    const sampleId = params.id;
    
    // Query untuk menghapus sample berdasarkan ID
    const query = `
      DELETE FROM tracking_samples
      WHERE id = $1
      RETURNING id;
    `;
    
    const { rows } = await pool.query(query, [sampleId]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Sample tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Sample berhasil dihapus',
      deletedId: rows[0].id
    });
    
  } catch (error) {
    console.error('Error deleting sample:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' }, 
      { status: 500 }
    );
  }
}
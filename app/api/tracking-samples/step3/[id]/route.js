import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ message: 'ID sample tidak valid' }, { status: 400 });
  }
  
  try {
    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.preparation_status || !data.prepared_by) {
      return NextResponse.json({ 
        message: 'Status preparasi dan penanggung jawab harus diisi' 
      }, { status: 400 });
    }
    
    // Update database
    const updateQuery = `
      UPDATE tracking_samples
      SET 
        preparation_status = $1,
        preparation_notes = $2,
        prepared_by = $3,
        preparation_started_date = $4,
        preparation_completed_date = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    
    const updateValues = [
      data.preparation_status,
      data.preparation_notes,
      data.prepared_by,
      data.preparation_started_date,
      data.preparation_completed_date,
      id
    ];
    
    const { rows } = await pool.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Status preparasi sample berhasil diperbarui',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating sample preparation:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
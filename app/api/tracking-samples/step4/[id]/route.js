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
    if (!data.analysis_status || !data.analyzed_by) {
      return NextResponse.json({ 
        message: 'Status analisis dan penanggung jawab harus diisi' 
      }, { status: 400 });
    }
    
    // Validate sample preparation is completed before updating analysis
    const checkQuery = `
      SELECT preparation_status FROM tracking_samples WHERE id = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    const sample = checkResult.rows[0];
    
    if (sample.preparation_status !== 'completed') {
      return NextResponse.json({ 
        message: 'Preparasi sample harus selesai sebelum memulai analisis' 
      }, { status: 400 });
    }
    
    // Update database
    const updateQuery = `
      UPDATE tracking_samples
      SET 
        analysis_status = $1,
        analysis_notes = $2,
        analyzed_by = $3,
        analysis_started_date = $4,
        analysis_completed_date = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    
    const updateValues = [
      data.analysis_status,
      data.analysis_notes,
      data.analyzed_by,
      data.analysis_started_date,
      data.analysis_completed_date,
      id
    ];
    
    const { rows } = await pool.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Status analisis sample berhasil diperbarui',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating sample analysis:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
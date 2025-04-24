import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const query = `SELECT * FROM tracking_samples WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sample:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    // Parse JSON body
    const data = await request.json();

    // Validate that analysis is completed before ROA can be created
    const checkQuery = `SELECT analysis_status, analysis_completed_date FROM tracking_samples WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    const sample = checkResult.rows[0];

    // Ensure analysis is completed before allowing ROA updates
    if (sample.analysis_status !== 'completed' || !sample.analysis_completed_date) {
      return NextResponse.json({ message: 'Analisis harus selesai sebelum ROA dapat dikelola' }, { status: 400 });
    }

    // Update the ROA related fields
    const updateQuery = `
      UPDATE tracking_samples 
      SET 
        roa_status = $1, 
        roa_document_url = $2, 
        roa_created_date = $3, 
        roa_issued_date = $4, 
        roa_created_by = $5, 
        updated_at = NOW() 
      WHERE id = $6 
      RETURNING *`;

    const updateValues = [
      data.roa_status,
      data.roa_document_url,
      data.roa_created_date,
      data.roa_issued_date,
      data.roa_created_by,
      id
    ];

    const { rows } = await pool.query(updateQuery, updateValues);
    return NextResponse.json({ message: 'ROA berhasil diperbarui', data: rows[0] });
  } catch (error) {
    console.error('Error updating ROA:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
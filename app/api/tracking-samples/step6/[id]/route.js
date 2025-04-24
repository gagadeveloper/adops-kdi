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

    // Validate that ROA is issued before COA can be created
    const checkQuery = `SELECT roa_status, roa_issued_date FROM tracking_samples WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    const sample = checkResult.rows[0];

    // Ensure ROA is issued before allowing COA updates
    if (sample.roa_status !== 'issued' || !sample.roa_issued_date) {
      return NextResponse.json({ message: 'ROA harus diterbitkan sebelum COA dapat dikelola' }, { status: 400 });
    }

    // Update the COA related fields
    const updateQuery = `
      UPDATE tracking_samples 
      SET 
        coa_draft_url = $1, 
        coa_draft_date = $2, 
        coa_review_status = $3, 
        coa_reviewer = $4, 
        coa_review_date = $5, 
        coa_document_url = $6, 
        coa_created_date = $7, 
        coa_issued_date = $8, 
        coa_created_by = $9, 
        updated_at = NOW() 
      WHERE id = $10 
      RETURNING *`;

    const updateValues = [
      data.coa_draft_url,
      data.coa_draft_date,
      data.coa_review_status,
      data.coa_reviewer,
      data.coa_review_date,
      data.coa_document_url,
      data.coa_created_date,
      data.coa_issued_date,
      data.coa_created_by,
      id
    ];

    const { rows } = await pool.query(updateQuery, updateValues);
    return NextResponse.json({ message: 'COA berhasil diperbarui', data: rows[0] });
  } catch (error) {
    console.error('Error updating COA:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
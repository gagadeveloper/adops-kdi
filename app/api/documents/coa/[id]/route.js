// app/api/documents/coa/[id]/route.js
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    // Pastikan id valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }
    
    // Check if sample exists and has a COA
    const sampleQuery = 'SELECT * FROM samples WHERE id = $1';
    const sampleResult = await db.query(sampleQuery, [parseInt(id)]);
    
    if (sampleResult.rows.length === 0) {
      return NextResponse.json({ message: "Sample tidak ditemukan" }, { status: 404 });
    }
    
    const sample = sampleResult.rows[0];
    
    if (!sample.coa_issued_date) {
      return NextResponse.json({ message: "COA belum diterbitkan" }, { status: 404 });
    }
    
    // For now, return basic details about the COA
    return NextResponse.json({
      message: "COA ditemukan",
      sample_id: id,
      sample_code: sample.sample_code,
      coa_date: sample.coa_issued_date
    });
    
  } catch (error) {
    console.error('Error handling COA request:', error);
    return NextResponse.json({ 
      message: "Terjadi kesalahan saat mengambil dokumen COA",
      error: error.message 
    }, { status: 500 });
  }
}
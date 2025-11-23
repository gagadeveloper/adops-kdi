// app/api/documents/roa/[id]/route.js
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    // Pastikan id valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }
    
    // Check if sample exists and has an ROA
    const sampleQuery = 'SELECT * FROM samples WHERE id = $1';
    const sampleResult = await db.query(sampleQuery, [parseInt(id)]);
    
    if (sampleResult.rows.length === 0) {
      return NextResponse.json({ message: "Sample tidak ditemukan" }, { status: 404 });
    }
    
    const sample = sampleResult.rows[0];
    
    if (!sample.roa_issued_date) {
      return NextResponse.json({ message: "ROA belum diterbitkan" }, { status: 404 });
    }
    
    // For now, return basic details about the ROA
    return NextResponse.json({
      message: "ROA ditemukan",
      sample_id: id,
      sample_code: sample.sample_code,
      roa_date: sample.roa_issued_date
    });
    
  } catch (error) {
    console.error('Error handling ROA request:', error);
    return NextResponse.json({ 
      message: "Terjadi kesalahan saat mengambil dokumen ROA",
      error: error.message 
    }, { status: 500 });
  }
}
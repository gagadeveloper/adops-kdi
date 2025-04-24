// app/api/documents/roa/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust this to your database setup

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    // Check if sample exists and has an ROA
    const sample = await db.sample.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!sample) {
      return NextResponse.json({ message: "Sample tidak ditemukan" }, { status: 404 });
    }
    
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
    return NextResponse.json({ message: "Terjadi kesalahan saat mengambil dokumen ROA" }, { status: 500 });
  }
}
// app/api/documents/coa/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust this to your database setup

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    // Check if sample exists and has a COA
    const sample = await db.sample.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!sample) {
      return NextResponse.json({ message: "Sample tidak ditemukan" }, { status: 404 });
    }
    
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
    return NextResponse.json({ message: "Terjadi kesalahan saat mengambil dokumen COA" }, { status: 500 });
  }
}
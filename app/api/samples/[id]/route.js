import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Sesuaikan dengan setup database Anda

export async function GET(request, { params }) {
  const id = params.id;

  try {
    // Query untuk mengambil sample berdasarkan id
    const sample = await db.query(
      'SELECT * FROM samples WHERE id = $1',
      [id]
    );

    // Jika sample tidak ditemukan
    if (!sample || sample.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sample tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(sample.rows[0]);
  } catch (error) {
    console.error('Error fetching sample:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data sample' },
      { status: 500 }
    );
  }
}
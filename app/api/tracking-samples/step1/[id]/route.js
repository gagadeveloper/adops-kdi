// File: app/api/tracking-samples/step1/[id]/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

// Fungsi untuk mengunggah gambar (sama seperti di route POST)
async function uploadImage(file) {
  // Implementasi upload file ke cloud storage
  const fileId = uuidv4();
  return `/uploads/${fileId}-${file.name}`;
}

export async function PUT(request, { params }) {
  try {
    // Verifikasi autentikasi
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract data from form
    const sender_name = formData.get('sender_name');
    const sample_code = formData.get('sample_code');
    const lokasi_site = formData.get('lokasi_site');
    const quantity = formData.get('quantity');
    const barcode_seal = formData.get('barcode_seal');
    const driver_name = formData.get('driver_name');
    const plate_number = formData.get('plate_number');
    const photo_file = formData.get('photo_url');
    const document_url = formData.get('document_url');
    
    // Validate required fields
    if (!sender_name || !sample_code || !quantity || !lokasi_site) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Build query parts
    let query = `
      UPDATE tracking_samples SET 
        sample_code = $1,
        sender_name = $2,
        lokasi_site = $3,
        quantity = $4,
        barcode_seal = $5,
        driver_name = $6,
        plate_number = $7,
        sent_by = $8,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    let values = [
      sample_code,
      sender_name,
      lokasi_site,
      quantity,
      barcode_seal,
      driver_name,
      plate_number,
      session.user.email
    ];
    
    // Upload image if provided
    if (photo_file && photo_file.size > 0) {
      const photo_url = await uploadImage(photo_file);
      query += `, photo_url = $${values.length + 1}`;
      values.push(photo_url);
    }
    
    // Complete the query
    query += ` WHERE id = $${values.length + 1}`;
    values.push(id);
    
    // Execute the update
    await sql.query(query, values);
    
    return NextResponse.json({
      message: 'Data berhasil diperbarui'
    });
    
  } catch (error) {
    console.error('Error updating sample data:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
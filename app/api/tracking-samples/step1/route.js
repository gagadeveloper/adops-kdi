import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Handler untuk POST: Tambah sample baru
export async function POST(request) {
  try {
    // Parse form data dengan file upload
    const formData = await request.formData();
    const photoFile = formData.get("photo_url");
    
    // Extract sample data dari form fields
    const sampleData = {
      sender_name: formData.get("sender_name") || "",
      sample_code: formData.get("sample_code") || "",
      quantity: formData.get("quantity") || "",
      barcode_seal: formData.get("barcode_seal") || "",
      driver_name: formData.get("driver_name") || "",
      plate_number: formData.get("plate_number") || "",
      sent_date: formData.get("sent_date") || new Date().toISOString()
    };
    
    // Handle file upload if provided
    if (photoFile && photoFile.size > 0) {
      try {
        // Generate unique filename
        const filename = `${Date.now()}-${photoFile.name}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/samples');
        
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Save file to disk
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        // Store reference in database
        const dbPath = `/uploads/samples/${filename}`;
        sampleData.photo_url = dbPath;
        
        console.log('File saved:', {
          originalName: photoFile.name,
          savedPath: filepath,
          dbPath: dbPath
        });
      } catch (saveError) {
        console.error("Error saving file:", saveError);
        return NextResponse.json(
          { error: `Error saving file: ${saveError.message}` },
          { status: 500 }
        );
      }
    }
    
    // Insert into database
    const insertQuery = `
      INSERT INTO tracking_samples (
        sender_name,
        sample_code,
        lokasi_site,
        quantity,
        barcode_seal,
        driver_name,
        plate_number,
        sent_date,
        document_url,
        photo_url,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `;
    
    const insertValues = [
      sampleData.sender_name,
      sampleData.sample_code,
      sampleData.lokasi_site,
      sampleData.quantity,
      sampleData.barcode_seal,
      sampleData.driver_name,
      sampleData.plate_number,
      sampleData.sent_date,
      sampleData.document_url,
      sampleData.photo_url || null
    ];
    
    const { rows } = await pool.query(insertQuery, insertValues);
    
    return NextResponse.json({
      message: 'Sample berhasil ditambahkan',
      data: rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating sample:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Handler untuk PUT: Update data sample pada step1 (dengan ID)
export async function PUT(request, { params }) {
  const sampleId = params.sampleId;
  
  if (!sampleId) {
    return NextResponse.json({ message: 'Sample ID tidak ditemukan' }, { status: 400 });
  }

  try {
    // Parse form data dengan file upload
    const formData = await request.formData();
    const photoFile = formData.get("photo_url");
    
    // Extract sample data dari form fields
    const sampleData = {
      sender_name: formData.get("sender_name") || "",
      sample_code: formData.get("sample_code") || "",
      lokasi_site: formData.get("lokasi_site") || "",
      quantity: formData.get("quantity") || "",
      barcode_seal: formData.get("barcode_seal") || "",
      driver_name: formData.get("driver_name") || "",
      plate_number: formData.get("plate_number") || "",
      sent_date: formData.get("sent_date") || new Date().toISOString()
    };
    
    // Handle file upload if provided
    if (photoFile && photoFile.size > 0) {
      try {
        // Generate unique filename
        const filename = `${Date.now()}-${photoFile.name}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/samples');
        
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Save file to disk
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        // Store reference in database
        const dbPath = `/uploads/samples/${filename}`;
        sampleData.photo_url = dbPath;
        
        console.log('File saved:', {
          originalName: photoFile.name,
          savedPath: filepath,
          dbPath: dbPath
        });
      } catch (saveError) {
        console.error("Error saving file:", saveError);
        return NextResponse.json(
          { error: `Error saving file: ${saveError.message}` },
          { status: 500 }
        );
      }
    }
    
    // Update database
    const updateQuery = `
      UPDATE tracking_samples
      SET 
        sender_name = $1,
        sample_code = $2,
        lokasi_site = $3,
        quantity = $4,
        barcode_seal = $5,
        driver_name = $6,
        plate_number = $7,
        sent_date = $8,
        photo_url = COALESCE($9, photo_url),
        document_url = COALESCE($10, document_url),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *;
    `;
    
    const updateValues = [
      sampleData.sender_name,
      sampleData.sample_code,
      sampleData.lokasi_site,
      sampleData.quantity,
      sampleData.barcode_seal,
      sampleData.driver_name,
      sampleData.plate_number,
      sampleData.sent_date,
      sampleData.document_url,
      sampleData.photo_url || null,
      sampleId
    ];
    
    const { rows } = await pool.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Sample berhasil diupdate',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating sample:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
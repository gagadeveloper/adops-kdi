import db from '@/lib/db';
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Handler untuk PUT: Update data sample dengan ID
export async function PUT(request, { params }) {
  const sampleId = params.id;
  
  if (!sampleId) {
    return NextResponse.json({ message: 'Sample ID tidak ditemukan' }, { status: 400 });
  }

  try {
    // Parse form data dengan file upload
    const formData = await request.formData();
    const photoFile = formData.get("photo_url");
    const documentFile = formData.get("document_url");
    
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
    
    // Handle photo file upload if provided
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
        
        console.log('Photo saved:', {
          originalName: photoFile.name,
          savedPath: filepath,
          dbPath: dbPath
        });
      } catch (saveError) {
        console.error("Error saving photo file:", saveError);
        return NextResponse.json(
          { error: `Error saving photo file: ${saveError.message}` },
          { status: 500 }
        );
      }
    }
    
    // Handle document file upload if provided
    if (documentFile && documentFile.size > 0) {
      try {
        // Generate unique filename
        const filename = `${Date.now()}-${documentFile.name}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/documents');
        
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Save file to disk
        const buffer = Buffer.from(await documentFile.arrayBuffer());
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        // Store reference in database
        const dbPath = `/uploads/documents/${filename}`;
        sampleData.document_url = dbPath;
        
        console.log('Document saved:', {
          originalName: documentFile.name,
          savedPath: filepath,
          dbPath: dbPath
        });
      } catch (saveError) {
        console.error("Error saving document file:", saveError);
        return NextResponse.json(
          { error: `Error saving document file: ${saveError.message}` },
          { status: 500 }
        );
      }
    }
    
    // Build the update query
    let updateQuery = `
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
        updated_at = NOW()
    `;
    
    let updateValues = [
      sampleData.sender_name,
      sampleData.sample_code,
      sampleData.lokasi_site,
      sampleData.quantity,
      sampleData.barcode_seal,
      sampleData.driver_name,
      sampleData.plate_number,
      sampleData.sent_date
    ];
    
    let paramIndex = updateValues.length + 1;
    
    // Only update photo_url if a new photo was provided
    if (sampleData.photo_url) {
      updateQuery += `, photo_url = $${paramIndex}`;
      updateValues.push(sampleData.photo_url);
      paramIndex++;
    }
    
    // Only update document_url if a new document was provided
    if (sampleData.document_url) {
      updateQuery += `, document_url = $${paramIndex}`;
      updateValues.push(sampleData.document_url);
      paramIndex++;
    }
    
    // Complete the query with WHERE clause
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *;`;
    updateValues.push(sampleId);
    
    // Execute the update query
    const { rows } = await db.query(updateQuery, updateValues);
    
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
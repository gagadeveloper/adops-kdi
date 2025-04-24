import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Handler untuk GET: Ambil detail sample berdasarkan ID
export async function GET(request, { params }) {
  const sampleId = params.id;

  try {
    // Query untuk mendapatkan data sample berdasarkan ID
    const query = `
      SELECT * FROM tracking_samples 
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [sampleId]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sample data:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// Handler untuk PUT: Update data sample
export async function PUT(request, { params }) {
  const sampleId = params.id;

  try {
    // Determine request type and parse body
    const contentType = request.headers.get("content-type") || "";
    
    // Handle multipart/form-data (dengan file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const photoFile = formData.get("photo_url");
      
      // Extract sample data from form fields
      const sampleData = {
        sender_name: formData.get("sender_name") || "",
        sample_code: formData.get("sample_code") || "",
        quantity: formData.get("quantity") || "",
        barcode_seal: formData.get("barcode_seal") || "",
        driver_name: formData.get("driver_name") || "",
        plate_number: formData.get("plate_number") || "",
        sent_date: formData.get("sent_date") || null
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
          quantity = $3,
          barcode_seal = $4,
          driver_name = $5,
          plate_number = $6,
          sent_date = $7,
          photo_url = COALESCE($8, photo_url)
        WHERE id = $9
        RETURNING *;
      `;
      
      const updateValues = [
        sampleData.sender_name,
        sampleData.sample_code,
        sampleData.quantity,
        sampleData.barcode_seal,
        sampleData.driver_name,
        sampleData.plate_number,
        sampleData.sent_date,
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
      
    } else {
      // Handle JSON request
      const bodyData = await request.json();
      
      const updateQuery = `
        UPDATE tracking_samples
        SET 
          sender_name = $1,
          sample_code = $2,
          quantity = $3,
          barcode_seal = $4,
          driver_name = $5,
          plate_number = $6,
          sent_date = $7
        WHERE id = $8
        RETURNING *;
      `;
      
      const updateValues = [
        bodyData.sender_name,
        bodyData.sample_code,
        bodyData.quantity,
        bodyData.barcode_seal,
        bodyData.driver_name,
        bodyData.plate_number,
        bodyData.sent_date,
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
    }
  } catch (error) {
    console.error('Error updating sample:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Handler untuk DELETE: Hapus sample berdasarkan ID
export async function DELETE(request, { params }) {
  const sampleId = params.id;

  try {
    // Check if sample exists and get photo_url if any
    const checkQuery = `SELECT photo_url FROM tracking_samples WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [sampleId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    // Get photo_url if exists
    const photoUrl = checkResult.rows[0].photo_url;
    
    // Delete from database
    const deleteQuery = `DELETE FROM tracking_samples WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(deleteQuery, [sampleId]);
    
    // Delete photo file if exists
    if (photoUrl) {
      try {
        const photoPath = path.join(process.cwd(), 'public', photoUrl);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log(`Deleted photo file: ${photoPath}`);
        }
      } catch (fileError) {
        console.error('Error deleting photo file:', fileError);
        // Continue execution even if file deletion fails
      }
    }
    
    return NextResponse.json({ message: 'Sample berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting sample:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
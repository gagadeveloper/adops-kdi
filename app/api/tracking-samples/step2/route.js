import db from '@/lib/db';
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary yang diperbaiki
if (process.env.CLOUDINARY_URL) {
  console.log('Using CLOUDINARY_URL for configuration');
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "di91m0u7o",
    api_key: process.env.CLOUDINARY_API_KEY || "667212683317254",
    api_secret: process.env.CLOUDINARY_API_SECRET || "HnuNliTII9q_442SbpczbRYCfas",
    secure: true
  });
  console.log('Using individual credentials for Cloudinary configuration');
}

// Helper function to upload to Cloudinary using the unsigned preset
async function uploadToCloudinary(file, folder) {
  try {
    // Convert file buffer to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;
    
    // Important: Use the exact preset name from your Cloudinary dashboard
    const UPLOAD_PRESET = "tracking_samples"; // Make sure this matches EXACTLY
    
    console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET);
    
    // Upload to Cloudinary using unsigned upload with the preset
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.unsigned_upload(
        dataURI, 
        UPLOAD_PRESET, // Use the preset name here
        {
          folder: folder,
          resource_type: 'auto', // Automatically detect whether it's an image or raw file
        }, 
        (error, result) => {
          if (error) {
            console.error('Cloudinary error details:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error details:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Handler untuk POST: Update data penerimaan sample
export async function POST(request) {
  try {
    console.log("Step 1: API request received");
    
    // Parse form data dengan file upload
    const formData = await request.formData();
    const photoFile = formData.get("received_photo_url");
    
    // Mendapatkan ID sample dari form data
    const sampleId = formData.get("sample_id");
    
    if (!sampleId) {
      return NextResponse.json({ message: 'ID sample tidak ditemukan dalam form data' }, { status: 400 });
    }
    
    console.log("Processing sample ID:", sampleId);
    
    // Extract sample data dari form fields
    const sampleData = {
      receiver_name: formData.get("receiver_name") || "",
      received_quantity: formData.get("received_quantity") || "",
      received_date: formData.get("received_date") || new Date().toISOString(),
      received_by: formData.get("received_by") || ""
    };
    
    console.log("Step 2: Form data extracted", { 
      ...sampleData,
      hasPhotoFile: photoFile && photoFile.size > 0 ? 'Yes' : 'No'
    });
    
    // Verifikasi apakah sample dengan ID tersebut ada
    const checkQuery = "SELECT id FROM tracking_samples WHERE id = $1";
    const checkResult = await db.query(checkQuery, [sampleId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample dengan ID tersebut tidak ditemukan' }, { status: 404 });
    }
    
    // Handle photo file upload if provided
    if (photoFile && photoFile.size > 0) {
      try {
        console.log("Step 3A: Processing photo file", { 
          name: photoFile.name, 
          size: photoFile.size, 
          type: photoFile.type 
        });
        
        // Validate file size (max 5MB)
        if (photoFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { message: "Ukuran foto terlalu besar (maks. 5MB)" },
            { status: 400 }
          );
        }
        
        // Upload to Cloudinary
        const photoUrl = await uploadToCloudinary(photoFile, 'samples');
        
        // Store reference in database
        sampleData.received_photo_url = photoUrl;
        
        console.log('Step 3B: Photo uploaded successfully to Cloudinary', {
          originalName: photoFile.name,
          cloudinaryUrl: photoUrl
        });
      } catch (uploadError) {
        console.error("Error uploading photo file:", uploadError);
        return NextResponse.json(
          { message: `Gagal upload foto: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }
    
    console.log("Step 4: Preparing database update", sampleData);
    
    // UPDATE existing record instead of INSERT
    try {
      const updateQuery = `
        UPDATE tracking_samples
        SET 
          receiver_name = $1,
          received_quantity = $2,
          received_photo_url = $3,
          received_date = $4,
          received_by = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING *;
      `;
      
      const updateValues = [
        sampleData.receiver_name,
        sampleData.received_quantity,
        sampleData.received_photo_url || null,
        sampleData.received_date,
        sampleData.received_by,
        sampleId
      ];
      
      const { rows } = await db.query(updateQuery, updateValues);
      
      console.log("Step 5: Database update successful", { sampleId: rows[0].id });
      
      return NextResponse.json({
        message: 'Konfirmasi penerimaan sample berhasil disimpan',
        data: rows[0]
      }, { status: 200 });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        message: `Error database: ${dbError.message}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error updating sample receipt:', error);
    return NextResponse.json({ 
      message: `Terjadi kesalahan: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
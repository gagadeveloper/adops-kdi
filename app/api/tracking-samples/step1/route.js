import db from '@/lib/db';
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary yang diperbaiki
// Prioritaskan menggunakan CLOUDINARY_URL jika ada, jika tidak gunakan kredensial individual
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL akan digunakan secara otomatis oleh Cloudinary SDK
  console.log('Using CLOUDINARY_URL for configuration');
} else {
  // Gunakan kredensial individual jika tidak ada CLOUDINARY_URL
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
    
    console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET, 'file type:', file.type);
    
    // Only include allowed parameters for unsigned uploads
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',  // Automatically detect whether it's an image or raw file
      // Do NOT include type: 'upload' here - it's causing the error
    };
    
    // Upload to Cloudinary using unsigned upload with the preset
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.unsigned_upload(
        dataURI, 
        UPLOAD_PRESET,
        uploadOptions, 
        (error, result) => {
          if (error) {
            console.error('Cloudinary error details:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', {
              public_id: result.public_id,
              format: result.format,
              resource_type: result.resource_type,
              secure_url: result.secure_url
            });
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

// Handler untuk POST: Tambah sample baru
export async function POST(request) {
  try {
    console.log("Step 1: API request received");
    
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
    
    console.log("Step 2: Form data extracted", { 
      ...sampleData,
      hasPhotoFile: photoFile && photoFile.size > 0 ? 'Yes' : 'No', 
      hasDocumentFile: documentFile && documentFile.size > 0 ? 'Yes' : 'No'
    });
    
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
        sampleData.photo_url = photoUrl;
        
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
    
    // Handle document file upload if provided
    if (documentFile && documentFile.size > 0) {
      try {
        console.log("Step 4A: Processing document file", { 
          name: documentFile.name, 
          size: documentFile.size, 
          type: documentFile.type 
        });
        
        // Validate file size (max 5MB)
        if (documentFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { message: "Ukuran dokumen terlalu besar (maks. 5MB)" },
            { status: 400 }
          );
        }
        
        // Upload to Cloudinary
        const documentUrl = await uploadToCloudinary(documentFile, 'documents');
        
        // Store reference in database
        sampleData.document_url = documentUrl;
        
        console.log('Step 4B: Document uploaded successfully to Cloudinary', {
          originalName: documentFile.name,
          cloudinaryUrl: documentUrl
        });
      } catch (uploadError) {
        console.error("Error uploading document file:", uploadError);
        return NextResponse.json(
          { message: `Gagal upload dokumen: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }
    
    console.log("Step 5: Preparing database insert", sampleData);
    
    // Insert into database
    try {
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
          photo_url,
          document_url,
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
        sampleData.photo_url || null,
        sampleData.document_url || null
      ];
      
      const { rows } = await db.query(insertQuery, insertValues);
      
      console.log("Step 6: Database insert successful", { sampleId: rows[0].id });
      
      return NextResponse.json({
        message: 'Sample berhasil ditambahkan',
        data: rows[0]
      }, { status: 201 });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        message: `Error database: ${dbError.message}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error creating sample:', error);
    return NextResponse.json({ 
      message: `Terjadi kesalahan: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
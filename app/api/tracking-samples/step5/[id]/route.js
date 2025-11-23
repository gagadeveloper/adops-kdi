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

export async function GET(request, { params }) {
  try {
    const { id } = params;
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const query = `SELECT * FROM tracking_samples WHERE id = $1`;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching sample:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    // Validate that analysis is completed before ROA can be created
    const checkQuery = `SELECT analysis_status, analysis_completed_date FROM tracking_samples WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    const sample = checkResult.rows[0];

    // Ensure analysis is completed before allowing ROA updates
    if (sample.analysis_status !== 'completed' || !sample.analysis_completed_date) {
      return NextResponse.json({ message: 'Analisis harus selesai sebelum ROA dapat dikelola' }, { status: 400 });
    }

    // Handle form data with potential file upload
    const formData = await request.formData();
    const roaDocumentFile = formData.get("roa_document_file");
    
    const data = {
      roa_status: formData.get("roa_status") || "",
      roa_created_date: formData.get("roa_created_date") || null,
      roa_issued_date: formData.get("roa_issued_date") || null,
      roa_created_by: formData.get("roa_created_by") || ""
    };
    
    console.log("Processing ROA update for sample ID:", id, data);
    
    // Handle ROA document file upload if provided
    if (roaDocumentFile && roaDocumentFile.size > 0) {
      try {
        console.log("Processing ROA document file:", { 
          name: roaDocumentFile.name, 
          size: roaDocumentFile.size, 
          type: roaDocumentFile.type 
        });
        
        // Validate file size (max 10MB for documents)
        if (roaDocumentFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { message: "Ukuran dokumen ROA terlalu besar (maks. 10MB)" },
            { status: 400 }
          );
        }
        
        // Upload to Cloudinary
        const documentUrl = await uploadToCloudinary(roaDocumentFile, 'documents/roa');
        
        // Store URL in data object
        data.roa_document_url = documentUrl;
        
        console.log('ROA document uploaded successfully to Cloudinary', {
          originalName: roaDocumentFile.name,
          cloudinaryUrl: documentUrl
        });
      } catch (uploadError) {
        console.error("Error uploading ROA document:", uploadError);
        return NextResponse.json(
          { message: `Gagal upload dokumen ROA: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    // Update the ROA related fields
    const updateQuery = `
      UPDATE tracking_samples 
      SET 
        roa_status = $1, 
        roa_document_url = COALESCE($2, roa_document_url), 
        roa_created_date = $3, 
        roa_issued_date = $4, 
        roa_created_by = $5, 
        updated_at = NOW() 
      WHERE id = $6 
      RETURNING *`;

    const updateValues = [
      data.roa_status,
      data.roa_document_url || null,
      data.roa_created_date,
      data.roa_issued_date,
      data.roa_created_by,
      id
    ];

    const { rows } = await db.query(updateQuery, updateValues);
    return NextResponse.json({ message: 'ROA berhasil diperbarui', data: rows[0] });
  } catch (error) {
    console.error('Error updating ROA:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}

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

// Export the PUT method directly
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    // Validate that ROA is issued before COA can be created
    const checkQuery = `SELECT roa_status, roa_issued_date FROM tracking_samples WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }

    const sample = checkResult.rows[0];

    // Ensure ROA is issued before allowing COA updates
    if (sample.roa_status !== 'issued' || !sample.roa_issued_date) {
      return NextResponse.json({ message: 'ROA harus diterbitkan sebelum COA dapat dikelola' }, { status: 400 });
    }

    // Check content type to handle both JSON and form data
    const contentType = request.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle form data with potential file uploads
      const formData = await request.formData();
      const coaDraftFile = formData.get("coa_draft_file");
      const coaDocumentFile = formData.get("coa_document_file");
      
      data = {
        coa_draft_date: formData.get("coa_draft_date") || null,
        coa_review_status: formData.get("coa_review_status") || "",
        coa_reviewer: formData.get("coa_reviewer") || "",
        coa_review_date: formData.get("coa_review_date") || null,
        coa_created_date: formData.get("coa_created_date") || null,
        coa_issued_date: formData.get("coa_issued_date") || null,
        coa_created_by: formData.get("coa_created_by") || ""
      };
      
      console.log("Processing COA update for sample ID:", id, data);
      
      // Handle COA draft file upload if provided
      if (coaDraftFile && coaDraftFile.size > 0) {
        try {
          console.log("Processing COA draft file:", { 
            name: coaDraftFile.name, 
            size: coaDraftFile.size, 
            type: coaDraftFile.type 
          });
          
          // Validate file size (max 10MB for documents)
          if (coaDraftFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
              { message: "Ukuran draft COA terlalu besar (maks. 10MB)" },
              { status: 400 }
            );
          }
          
          // Upload to Cloudinary
          const draftUrl = await uploadToCloudinary(coaDraftFile, 'documents/coa/drafts');
          
          // Store URL in data object
          data.coa_draft_url = draftUrl;
          
          console.log('COA draft uploaded successfully to Cloudinary', {
            originalName: coaDraftFile.name,
            cloudinaryUrl: draftUrl
          });
        } catch (uploadError) {
          console.error("Error uploading COA draft:", uploadError);
          return NextResponse.json(
            { message: `Gagal upload draft COA: ${uploadError.message}` },
            { status: 500 }
          );
        }
      }
      
      // Handle COA final document file upload if provided
      if (coaDocumentFile && coaDocumentFile.size > 0) {
        try {
          console.log("Processing COA document file:", { 
            name: coaDocumentFile.name, 
            size: coaDocumentFile.size, 
            type: coaDocumentFile.type 
          });
          
          // Validate file size (max 10MB for documents)
          if (coaDocumentFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
              { message: "Ukuran dokumen COA terlalu besar (maks. 10MB)" },
              { status: 400 }
            );
          }
          
          // Upload to Cloudinary
          const documentUrl = await uploadToCloudinary(coaDocumentFile, 'documents/coa/final');
          
          // Store URL in data object
          data.coa_document_url = documentUrl;
          
          console.log('COA document uploaded successfully to Cloudinary', {
            originalName: coaDocumentFile.name,
            cloudinaryUrl: documentUrl
          });
        } catch (uploadError) {
          console.error("Error uploading COA document:", uploadError);
          return NextResponse.json(
            { message: `Gagal upload dokumen COA: ${uploadError.message}` },
            { status: 500 }
          );
        }
      }
    } else {
      // Handle JSON data (as sent from your React component)
      data = await request.json();
      console.log("Processing COA update with JSON data for sample ID:", id, data);
    }

    // Update the COA related fields
    const updateQuery = `
      UPDATE tracking_samples 
      SET 
        coa_draft_url = COALESCE($1, coa_draft_url), 
        coa_draft_date = COALESCE($2, coa_draft_date), 
        coa_review_status = COALESCE($3, coa_review_status), 
        coa_reviewer = COALESCE($4, coa_reviewer), 
        coa_review_date = COALESCE($5, coa_review_date), 
        coa_document_url = COALESCE($6, coa_document_url), 
        coa_created_date = COALESCE($7, coa_created_date), 
        coa_issued_date = COALESCE($8, coa_issued_date), 
        coa_created_by = COALESCE($9, coa_created_by), 
        updated_at = NOW() 
      WHERE id = $10 
      RETURNING *`;

    const updateValues = [
      data.coa_draft_url || null,
      data.coa_draft_date || null,
      data.coa_review_status || null,
      data.coa_reviewer || null,
      data.coa_review_date || null,
      data.coa_document_url || null,
      data.coa_created_date || null,
      data.coa_issued_date || null,
      data.coa_created_by || null,
      id
    ];

    const { rows } = await db.query(updateQuery, updateValues);
    return NextResponse.json({ message: 'COA berhasil diperbarui', data: rows[0] });
  } catch (error) {
    console.error('Error updating COA:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
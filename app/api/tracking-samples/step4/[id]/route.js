import db from '@/lib/db';
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ message: 'ID sample tidak valid' }, { status: 400 });
  }
  
  try {
    // Get request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.analysis_status || !data.analyzed_by) {
      return NextResponse.json({ 
        message: 'Status analisis dan penanggung jawab harus diisi' 
      }, { status: 400 });
    }
    
    // Validate sample preparation is completed before updating analysis
    const checkQuery = `
      SELECT preparation_status FROM tracking_samples WHERE id = $1
    `;
    
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    const sample = checkResult.rows[0];
    
    if (sample.preparation_status !== 'completed') {
      return NextResponse.json({ 
        message: 'Preparasi sample harus selesai sebelum memulai analisis' 
      }, { status: 400 });
    }
    
    // Update database
    const updateQuery = `
      UPDATE tracking_samples
      SET 
        analysis_status = $1,
        analysis_notes = $2,
        analyzed_by = $3,
        analysis_started_date = $4,
        analysis_completed_date = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    
    const updateValues = [
      data.analysis_status,
      data.analysis_notes,
      data.analyzed_by,
      data.analysis_started_date,
      data.analysis_completed_date,
      id
    ];
    
    const { rows } = await db.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Status analisis sample berhasil diperbarui',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating sample analysis:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// // STEP 4: SAMPLE ANALYSIS API
// import db from '@/lib/db';
// import { NextResponse } from "next/server";
// import { v2 as cloudinary } from 'cloudinary';

// // Configure Cloudinary - maintain the same configuration across all API endpoints
// cloudinary.config({
//   cloud_name: "di91m0u7o",
//   api_key: "667212683317254",
//   api_secret: "HnuNliTII9q_442SbpczbRYCfas",
//   secure: true
// });

// // Helper function to upload to Cloudinary using the unsigned preset
// async function uploadToCloudinary(file, folder) {
//   try {
//     // Convert file buffer to base64
//     const fileBuffer = await file.arrayBuffer();
//     const base64File = Buffer.from(fileBuffer).toString('base64');
//     const dataURI = `data:${file.type};base64,${base64File}`;
    
//     // Important: Use the exact preset name from your Cloudinary dashboard
//     const UPLOAD_PRESET = "tracking_samples"; // Make sure this matches EXACTLY
    
//     console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET);
    
//     // Upload to Cloudinary using unsigned upload with the preset
//     const result = await new Promise((resolve, reject) => {
//       cloudinary.uploader.unsigned_upload(
//         dataURI, 
//         UPLOAD_PRESET, // Use the preset name here
//         {
//           folder: folder,
//           resource_type: 'auto', // Automatically detect whether it's an image or raw file
//         }, 
//         (error, result) => {
//           if (error) {
//             console.error('Cloudinary error details:', error);
//             reject(error);
//           } else {
//             resolve(result);
//           }
//         }
//       );
//     });
    
//     return result.secure_url;
//   } catch (error) {
//     console.error('Cloudinary upload error details:', error);
//     throw new Error(`Upload failed: ${error.message}`);
//   }
// }

// export async function PUT(request, { params }) {
//   const { id } = params;
  
//   if (!id) {
//     return NextResponse.json({ message: 'ID sample tidak valid' }, { status: 400 });
//   }
  
//   try {
//     console.log("Step 1: API request received for analysis update, ID:", id);
    
//     // Check if the data is JSON or FormData
//     const contentType = request.headers.get('content-type') || '';
//     let data;
//     let analysisResultFile = null;
    
//     if (contentType.includes('multipart/form-data')) {
//       // Handle as form data with potential file upload
//       const formData = await request.formData();
//       analysisResultFile = formData.get("analysis_result_file");
      
//       data = {
//         analysis_status: formData.get("analysis_status"),
//         analysis_notes: formData.get("analysis_notes"),
//         analyzed_by: formData.get("analyzed_by"),
//         analysis_started_date: formData.get("analysis_started_date"),
//         analysis_completed_date: formData.get("analysis_completed_date")
//       };
//     } else {
//       // Handle as regular JSON data
//       data = await request.json();
//     }
    
//     // Validate required fields
//     if (!data.analysis_status || !data.analyzed_by) {
//       return NextResponse.json({ 
//         message: 'Status analisis dan penanggung jawab harus diisi' 
//       }, { status: 400 });
//     }
    
//     console.log("Step 2: Analysis data extracted", data);
    
//     // Validate sample preparation is completed before updating analysis
//     const checkQuery = `
//       SELECT preparation_status FROM tracking_samples WHERE id = $1
//     `;
    
//     const checkResult = await db.query(checkQuery, [id]);
    
//     if (checkResult.rows.length === 0) {
//       return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
//     }
    
//     const sample = checkResult.rows[0];
    
//     if (sample.preparation_status !== 'completed') {
//       return NextResponse.json({ 
//         message: 'Preparasi sample harus selesai sebelum memulai analisis' 
//       }, { status: 400 });
//     }
    
//     // Handle analysis result file upload if provided
//     if (analysisResultFile && analysisResultFile.size > 0) {
//       try {
//         console.log("Step 3A: Processing analysis result file", { 
//           name: analysisResultFile.name, 
//           size: analysisResultFile.size, 
//           type: analysisResultFile.type 
//         });
        
//         // Validate file size (max 10MB)
//         if (analysisResultFile.size > 10 * 1024 * 1024) {
//           return NextResponse.json(
//             { message: "Ukuran file hasil analisis terlalu besar (maks. 10MB)" },
//             { status: 400 }
//           );
//         }
        
//         // Upload to Cloudinary
//         const resultFileUrl = await uploadToCloudinary(analysisResultFile, 'samples/analysis_results');
        
//         // Store reference in database
//         data.analysis_result_url = resultFileUrl;
        
//         console.log('Step 3B: Analysis result file uploaded successfully to Cloudinary', {
//           originalName: analysisResultFile.name,
//           cloudinaryUrl: resultFileUrl
//         });
//       } catch (uploadError) {
//         console.error("Error uploading analysis result file:", uploadError);
//         return NextResponse.json(
//           { message: `Gagal upload file hasil analisis: ${uploadError.message}` },
//           { status: 500 }
//         );
//       }
//     }
    
//     // Update database
//     const updateQuery = `
//       UPDATE tracking_samples
//       SET 
//         analysis_status = $1,
//         analysis_notes = $2,
//         analyzed_by = $3,
//         analysis_started_date = $4,
//         analysis_completed_date = $5,
//         analysis_result_url = COALESCE($6, analysis_result_url),
//         updated_at = NOW()
//       WHERE id = $7
//       RETURNING *;
//     `;
    
//     const updateValues = [
//       data.analysis_status,
//       data.analysis_notes,
//       data.analyzed_by,
//       data.analysis_started_date,
//       data.analysis_completed_date,
//       data.analysis_result_url || null,
//       id
//     ];
    
//     const { rows } = await db.query(updateQuery, updateValues);
    
//     if (rows.length === 0) {
//       return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
//     }
    
//     console.log("Step 4: Database update successful", {
//       id: rows[0].id,
//       analysis_status: rows[0].analysis_status
//     });
    
//     return NextResponse.json({
//       message: 'Status analisis sample berhasil diperbarui',
//       data: rows[0]
//     });
    
//   } catch (error) {
//     console.error('Error updating sample analysis:', error);
//     return NextResponse.json({ 
//       message: 'Terjadi kesalahan server',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     }, { status: 500 });
//   }
// }
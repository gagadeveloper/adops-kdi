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
    if (!data.preparation_status || !data.prepared_by) {
      return NextResponse.json({ 
        message: 'Status preparasi dan penanggung jawab harus diisi' 
      }, { status: 400 });
    }
    
    // Update database
    const updateQuery = `
      UPDATE tracking_samples
      SET 
        preparation_status = $1,
        preparation_notes = $2,
        prepared_by = $3,
        preparation_started_date = $4,
        preparation_completed_date = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    
    const updateValues = [
      data.preparation_status,
      data.preparation_notes,
      data.prepared_by,
      data.preparation_started_date,
      data.preparation_completed_date,
      id
    ];
    
    const { rows } = await db.query(updateQuery, updateValues);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Status preparasi sample berhasil diperbarui',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating sample preparation:', error);
    return NextResponse.json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// // STEP 3: SAMPLE PREPARATION API
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
//     console.log("Step 1: API request received for preparation update, ID:", id);
    
//     // Check if the data is JSON or FormData
//     const contentType = request.headers.get('content-type') || '';
//     let data;
//     let preparationPhotoFile = null;
    
//     if (contentType.includes('multipart/form-data')) {
//       // Handle as form data with potential file upload
//       const formData = await request.formData();
//       preparationPhotoFile = formData.get("preparation_photo_file");
      
//       data = {
//         preparation_status: formData.get("preparation_status"),
//         preparation_notes: formData.get("preparation_notes"),
//         prepared_by: formData.get("prepared_by"),
//         preparation_started_date: formData.get("preparation_started_date"),
//         preparation_completed_date: formData.get("preparation_completed_date")
//       };
//     } else {
//       // Handle as regular JSON data
//       data = await request.json();
//     }
    
//     // Validate required fields
//     if (!data.preparation_status || !data.prepared_by) {
//       return NextResponse.json({ 
//         message: 'Status preparasi dan penanggung jawab harus diisi' 
//       }, { status: 400 });
//     }
    
//     console.log("Step 2: Preparation data extracted", data);
    
//     // Handle preparation photo file upload if provided
//     if (preparationPhotoFile && preparationPhotoFile.size > 0) {
//       try {
//         console.log("Step 3A: Processing preparation photo file", { 
//           name: preparationPhotoFile.name, 
//           size: preparationPhotoFile.size, 
//           type: preparationPhotoFile.type 
//         });
        
//         // Validate file size (max 5MB)
//         if (preparationPhotoFile.size > 5 * 1024 * 1024) {
//           return NextResponse.json(
//             { message: "Ukuran foto preparasi terlalu besar (maks. 5MB)" },
//             { status: 400 }
//           );
//         }
        
//         // Upload to Cloudinary
//         const photoUrl = await uploadToCloudinary(preparationPhotoFile, 'samples/preparation');
        
//         // Store reference in database
//         data.preparation_photo_url = photoUrl;
        
//         console.log('Step 3B: Preparation photo uploaded successfully to Cloudinary', {
//           originalName: preparationPhotoFile.name,
//           cloudinaryUrl: photoUrl
//         });
//       } catch (uploadError) {
//         console.error("Error uploading preparation photo file:", uploadError);
//         return NextResponse.json(
//           { message: `Gagal upload foto preparasi: ${uploadError.message}` },
//           { status: 500 }
//         );
//       }
//     }
    
//     // Update database
//     const updateQuery = `
//       UPDATE tracking_samples
//       SET 
//         preparation_status = $1,
//         preparation_notes = $2,
//         prepared_by = $3,
//         preparation_started_date = $4,
//         preparation_completed_date = $5,
//         preparation_photo_url = COALESCE($6, preparation_photo_url),
//         updated_at = NOW()
//       WHERE id = $7
//       RETURNING *;
//     `;
    
//     const updateValues = [
//       data.preparation_status,
//       data.preparation_notes,
//       data.prepared_by,
//       data.preparation_started_date,
//       data.preparation_completed_date,
//       data.preparation_photo_url || null,
//       id
//     ];
    
//     const { rows } = await db.query(updateQuery, updateValues);
    
//     if (rows.length === 0) {
//       return NextResponse.json({ message: 'Sample tidak ditemukan' }, { status: 404 });
//     }
    
//     console.log("Step 4: Database update successful", {
//       id: rows[0].id,
//       preparation_status: rows[0].preparation_status
//     });
    
//     return NextResponse.json({
//       message: 'Status preparasi sample berhasil diperbarui',
//       data: rows[0]
//     });
    
//   } catch (error) {
//     console.error('Error updating sample preparation:', error);
//     return NextResponse.json({ 
//       message: 'Terjadi kesalahan server',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     }, { status: 500 });
//   }
// }
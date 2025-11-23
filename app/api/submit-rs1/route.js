import { NextResponse } from "next/server";
import db from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Konfigurasi Cloudinary
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

// Helper function untuk upload ke Cloudinary
async function uploadToCloudinary(fileData, folder = 'rs1_forms') {
  try {
    let dataURI;
    
    // Handle jika fileData adalah File object dari formData
    if (fileData instanceof Blob) {
      const fileBuffer = await fileData.arrayBuffer();
      const base64File = Buffer.from(fileBuffer).toString('base64');
      dataURI = `data:${fileData.type};base64,${base64File}`;
    } 
    // Handle jika fileData adalah base64 string
    else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      dataURI = fileData;
    } else {
      throw new Error('File format tidak didukung');
    }
    
    // Gunakan preset yang sama dengan tracking_samples
    const UPLOAD_PRESET = "tracking_samples";
    
    console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET);
    
    // Upload ke Cloudinary menggunakan unsigned upload dengan preset
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.unsigned_upload(
        dataURI, 
        UPLOAD_PRESET,
        {
          folder: folder,
          resource_type: 'auto',
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
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      filename: result.original_filename || 'uploaded-file'  
    };
  } catch (error) {
    console.error('Cloudinary upload error details:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    console.log("🔹 Menerima request...");

    const contentType = req.headers.get("content-type") || "";
    console.log("🔹 Content-Type:", contentType);

    let orderData;
    let attachmentUpload = null;
    let signedPhotoUpload = null;

    if (contentType.includes("multipart/form-data")) {
      console.log("🔹 Processing multipart/form-data request...");
      const formData = await req.formData();

      // Proses attachment file
      const attachmentFile = formData.get("attachment");
      if (attachmentFile && attachmentFile.size > 0) {
        console.log("🔹 Uploading attachment to Cloudinary...");
        attachmentUpload = await uploadToCloudinary(attachmentFile, 'rs1_attachments');
      }

      // Proses signed photo
      const signedPhotoFile = formData.get("signedPhoto");
      if (signedPhotoFile && signedPhotoFile.size > 0) {
        console.log("🔹 Uploading signed photo to Cloudinary...");
        signedPhotoUpload = await uploadToCloudinary(signedPhotoFile, 'rs1_signatures');
      }

      const orderDataStr = formData.get("orderData");
      if (!orderDataStr) {
        return NextResponse.json({ error: "Missing order data" }, { status: 400 });
      }

      orderData = JSON.parse(orderDataStr);
    } else if (contentType.includes("application/json")) {
      // Handling for JSON requests
      orderData = await req.json();

      // Handle signed photo from base64 if exists
      if (orderData.signed) {
        console.log("🔹 Uploading signed photo from base64 to Cloudinary...");
        signedPhotoUpload = await uploadToCloudinary(orderData.signed, 'rs1_signatures');
      }

      // Handle attachment if sent as base64
      if (orderData.attachment) {
        console.log("🔹 Uploading attachment to Cloudinary...");
        if (typeof orderData.attachment === 'string' && orderData.attachment.startsWith('data:')) {
          attachmentUpload = await uploadToCloudinary(orderData.attachment, 'rs1_attachments');
        }
        // Jika attachment adalah file object (seharusnya tidak terjadi dalam JSON request)
        // tapi antisipasi jika ada perubahan di frontend
        else if (orderData.attachment instanceof Blob) {
          attachmentUpload = await uploadToCloudinary(orderData.attachment, 'rs1_attachments');
        }
      }
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    // Validasi input 
    const { sampleOrderNo, sender, samples } = orderData;

    if (!sampleOrderNo || !sender || !samples || samples.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Simpan order ke database dengan URL dari Cloudinary
    const orderResult = await db.query(
      `INSERT INTO orders (
        id, sample_order_no, sender, phone, email, address, total_qty, 
        attachment_path, attachment_name, 
        signed_photo_path, signed_photo_name,
        notes, pic, pic_phone, signed, date, created_at, updated_at
      ) 
      VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) 
      RETURNING id`,
      [
        sampleOrderNo,
        sender,
        orderData.phone || '',
        orderData.email || '',
        orderData.address || '',
        orderData.totalQty || 0,
        attachmentUpload ? attachmentUpload.url : null,  
        attachmentUpload ? attachmentUpload.filename : null,
        signedPhotoUpload ? signedPhotoUpload.url : null,
        signedPhotoUpload ? signedPhotoUpload.filename : null,
        orderData.notes || '',
        orderData.pic || '',
        orderData.picPhone || '',
        orderData.signed ? true : null,
        orderData.date ? new Date(orderData.date) : new Date(),
      ]
    );

    if (!orderResult.rows.length || !orderResult.rows[0].id) {
      console.error("❌ Gagal menyimpan order ke database");
      return NextResponse.json({ error: "Failed to insert order" }, { status: 500 });
    }

    const orderId = orderResult.rows[0].id;
    console.log("✅ orderId berhasil dibuat:", orderId);

    console.log("🔹 Menyimpan data samples ke database...");
    for (const sample of samples) {
      await db.query(
        `INSERT INTO samples (
          order_id, sample_code, quantity, commodity, type_size, 
          parameter, regulation, method_of_analysis, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          orderId,
          sample.sampleCode || '',
          sample.quantity || 0,
          sample.commodity || "",
          sample.typeSize || "",
          sample.parameter || "",
          sample.regulation || "",
          sample.methodOfAnalysis || "",
        ]
      );
    }

    console.log("✅ RS1 submitted successfully!");

    return NextResponse.json(
      {
        message: "RS1 submitted successfully",
        orderId: orderResult.rows[0].id,
        attachmentPath: attachmentUpload?.url || null,
        signedPhotoPath: signedPhotoUpload?.url || null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return NextResponse.json({ error: `Terjadi kesalahan: ${error.message}` }, { status: 500 });
  }
}
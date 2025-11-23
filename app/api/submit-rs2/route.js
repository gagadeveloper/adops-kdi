import { NextResponse } from "next/server";
import db from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Cloudinary Configuration
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL will be automatically used by Cloudinary SDK
  console.log('Using CLOUDINARY_URL for configuration');
} else {
  // Use individual credentials if CLOUDINARY_URL is not available
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "di91m0u7o",
    api_key: process.env.CLOUDINARY_API_KEY || "667212683317254",
    api_secret: process.env.CLOUDINARY_API_SECRET || "HnuNliTII9q_442SbpczbRYCfas",
    secure: true
  });
  console.log('Using individual credentials for Cloudinary configuration');
}

// Helper function for Cloudinary upload
async function uploadToCloudinary(fileData, folder = 'rs2_forms') {
  try {
    let dataURI;
    
    // Handle if fileData is File object from formData
    if (fileData instanceof Blob) {
      const fileBuffer = await fileData.arrayBuffer();
      const base64File = Buffer.from(fileBuffer).toString('base64');
      dataURI = `data:${fileData.type};base64,${base64File}`;
    } 
    // Handle if fileData is base64 string
    else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      dataURI = fileData;
    } else {
      throw new Error('Unsupported file format');
    }
    
    // Use the same preset as tracking_samples
    const UPLOAD_PRESET = "tracking_samples";
    
    console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET);
    
    // Upload to Cloudinary using unsigned upload with preset
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

// Helper function to generate client order number
async function generateClientOrderNumber() {
  try {
    // Company code: 23
    const companyCode = '23';
    
    // Current date format: MMYY (month and year)
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateCode = `${month}${year}`;
    
    // Get the current sequence number from the database
    const sequenceResult = await db.query(
      `SELECT MAX(client_order_no) as max_order_no 
       FROM orders2 
       WHERE client_order_no LIKE $1`,
      [`${companyCode}${dateCode}%`]
    );
    
    let sequence = 1;
    if (sequenceResult.rows[0].max_order_no) {
      // Extract the sequence number (4 digits) from the existing max
      const currentNumber = sequenceResult.rows[0].max_order_no;
      const sequencePart = currentNumber.substring(6, 10);
      sequence = parseInt(sequencePart, 10) + 1;
    }
    
    // Format the sequence as 4 digits
    const sequenceFormatted = String(sequence).padStart(4, '0');
    
    // Unique code (A by default)
    const uniqueCode = 'A';
    
    // Combine all parts
    return `${companyCode}${dateCode}${sequenceFormatted}${uniqueCode}`;
  } catch (error) {
    console.error('Error generating client order number:', error);
    throw new Error(`Failed to generate client order number: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    console.log("🔹 Receiving request...");

    const contentType = req.headers.get("content-type") || "";
    console.log("🔹 Content-Type:", contentType);

    let orderData;
    let samplesData;
    let attachmentUpload = null;
    let signedPhotoUpload = null;

    if (contentType.includes("multipart/form-data")) {
      console.log("🔹 Processing multipart/form-data request...");
      const formData = await req.formData();
      
      console.log("🔹 FormData keys:", [...formData.keys()]);

      // Process attachment file
      const attachmentFile = formData.get("attachment");
      if (attachmentFile && attachmentFile.size > 0) {
        console.log("🔹 Uploading attachment to Cloudinary...", attachmentFile.name);
        attachmentUpload = await uploadToCloudinary(attachmentFile, 'rs2_attachments');
      }

      // Process signed photo
      const signedPhotoFile = formData.get("signedPhoto");
      if (signedPhotoFile && signedPhotoFile.size > 0) {
        console.log("🔹 Uploading signed photo to Cloudinary...");
        signedPhotoUpload = await uploadToCloudinary(signedPhotoFile, 'rs2_signatures');
      }

      // Get the order data from formData - FIX: Check for both 'orderData' and 'data' fields
      let orderDataStr = formData.get("orderData");
      if (!orderDataStr) {
        // If orderData doesn't exist, try using 'data' instead
        orderDataStr = formData.get("data");
        console.log("🔹 Using 'data' field instead of 'orderData'");
      }
      
      if (!orderDataStr) {
        console.error("❌ Missing order data - no 'orderData' or 'data' field found");
        return NextResponse.json({ error: "Missing order data" }, { status: 400 });
      }

      try {
        const parsedData = JSON.parse(orderDataStr);
        orderData = parsedData.order || parsedData;
        samplesData = parsedData.samples || [];
        
        console.log("🔹 Parsed order data:", JSON.stringify(orderData).substring(0, 200) + "...");
        console.log("🔹 Samples count:", samplesData.length);
      } catch (error) {
        console.error("❌ Error parsing order data:", error);
        return NextResponse.json({ 
          error: "Invalid order data format", 
          details: error.message,
          dataReceived: orderDataStr.substring(0, 200) + "..." 
        }, { status: 400 });
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON requests
      const jsonData = await req.json();
      orderData = jsonData.order || jsonData;
      samplesData = jsonData.samples || [];

      // Handle signed photo from base64 if exists
      if (orderData.signed) {
        console.log("🔹 Uploading signed photo from base64 to Cloudinary...");
        signedPhotoUpload = await uploadToCloudinary(orderData.signed, 'rs2_signatures');
      }

      // Handle attachment if sent as base64
      if (orderData.attachment) {
        console.log("🔹 Uploading attachment to Cloudinary...");
        if (typeof orderData.attachment === 'string' && orderData.attachment.startsWith('data:')) {
          attachmentUpload = await uploadToCloudinary(orderData.attachment, 'rs2_attachments');
        }
        // If attachment is a file object (shouldn't happen in JSON request)
        // but anticipate if there's a change in frontend
        else if (orderData.attachment instanceof Blob) {
          attachmentUpload = await uploadToCloudinary(orderData.attachment, 'rs2_attachments');
        }
      }
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    // Debug the parsed data
    console.log("🔹 Order Data Structure:", Object.keys(orderData));

    // Validate input 
    const { sample_order_no, sender } = orderData;

    if (!sample_order_no || !sender || !samplesData || samplesData.length === 0) {
      return NextResponse.json({ 
        error: "Incomplete data", 
        details: {
          sample_order_no: !sample_order_no ? "Missing sample order number" : null,
          sender: !sender ? "Missing sender" : null,
          samples: !samplesData || samplesData.length === 0 ? "No samples provided" : null
        }
      }, { status: 400 });
    }

    // Generate client_order_no if not provided
    const client_order_no = orderData.client_order_no || await generateClientOrderNumber();
    console.log("🔹 Client Order No:", client_order_no);

    // Calculate total quantity from samples
    const totalQty = samplesData.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);

    // Save order to database with URL from Cloudinary
    const orderResult = await db.query(
      `INSERT INTO orders2 (
        id, sample_order_no, sender, phone, email, address, total_qty, 
        attachment_path, attachment_name, 
        signed_photo_path, signed_photo_name,
        notes, pic, pic_phone, signed, date, 
        client_order_no, hold_7_days_storage, hold_1_month_storage, hold_custom_months_storage,
        created_at, updated_at
      ) 
      VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()) 
      RETURNING id`,
      [
        sample_order_no,
        sender,
        orderData.phone || '',
        orderData.email || '',
        orderData.address || '',
        totalQty,
        attachmentUpload ? attachmentUpload.url : null,  
        attachmentUpload ? attachmentUpload.filename : null,
        signedPhotoUpload ? signedPhotoUpload.url : null,
        signedPhotoUpload ? signedPhotoUpload.filename : null,
        orderData.notes || '',
        orderData.pic || '',
        orderData.pic_phone || '',
        orderData.signed ? true : false,
        orderData.date ? new Date(orderData.date) : new Date(),
        client_order_no,
        orderData.hold_7_days_storage || false,
        orderData.hold_1_month_storage || false,
        orderData.hold_custom_months_storage || 0
      ]
    );

    if (!orderResult.rows.length || !orderResult.rows[0].id) {
      console.error("❌ Failed to save order to database");
      return NextResponse.json({ error: "Failed to insert order" }, { status: 500 });
    }

    const orderId = orderResult.rows[0].id;
    console.log("✅ Order ID successfully created:", orderId);

    console.log("🔹 Saving samples data to database...");
    for (const sample of samplesData) {
      await db.query(
        `INSERT INTO samples2 (
          order_id, sample_code, quantity, commodity, type_size, 
          parameter, regulation, method_of_analysis, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          orderId,
          sample.sample_code || '',
          sample.quantity || 0,
          sample.commodity || "",
          sample.type_size || "",
          sample.parameter || "",
          sample.regulation || "",
          sample.method_of_analysis || "",
        ]
      );
    }

    console.log("✅ RS2 submitted successfully!");

    return NextResponse.json(
      {
        message: "RS2 submitted successfully",
        orderId: orderResult.rows[0].id,
        clientOrderNo: client_order_no,
        attachmentPath: attachmentUpload?.url || null,
        signedPhotoPath: signedPhotoUpload?.url || null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return NextResponse.json({ 
      error: `An error occurred: ${error.message}`, 
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
    }, { status: 500 });
  }
}
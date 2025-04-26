import { NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export async function POST(req) {
  try {
    console.log("🔹 Menerima request...");

    const contentType = req.headers.get("content-type") || "";
    console.log("🔹 Content-Type:", contentType);

    let orderData;
    let attachmentPath = null;
    let attachmentFileName = "";
    let signedPhotoPath = null;
    let signedPhotoFileName = "";

    if (contentType.includes("multipart/form-data")) {
      console.log("🔹 Processing multipart/form-data request...");
      const formData = await req.formData();

      // Folder untuk upload
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Proses attachment file
      const attachmentFile = formData.get("attachment");
      if (attachmentFile && attachmentFile.size > 0) {
        attachmentFileName = `${Date.now()}_${attachmentFile.name}`;
        attachmentPath = `/uploads/${attachmentFileName}`;

        const fileBuffer = await attachmentFile.arrayBuffer();
        fs.writeFileSync(path.join(uploadDir, attachmentFileName), Buffer.from(fileBuffer));
      }

      // Proses signed photo
      const signedPhotoFile = formData.get("signedPhoto");
      if (signedPhotoFile && signedPhotoFile.size > 0) {
        signedPhotoFileName = `signed_${Date.now()}_${signedPhotoFile.name}`;
        signedPhotoPath = `/uploads/${signedPhotoFileName}`;

        const photoBuffer = await signedPhotoFile.arrayBuffer();
        fs.writeFileSync(path.join(uploadDir, signedPhotoFileName), Buffer.from(photoBuffer));
      }

      const orderDataStr = formData.get("orderData");
      if (!orderDataStr) {
        return NextResponse.json({ error: "Missing order data" }, { status: 400 });
      }

      orderData = JSON.parse(orderDataStr);
    } else if (contentType.includes("application/json")) {
      // Handling for JSON requests
      orderData = await req.json();

      // Folder untuk upload
      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Handle signed photo from base64 if exists
      if (orderData.signed) {
        const base64Data = orderData.signed.replace(/^data:image\/\w+;base64,/, '');
        signedPhotoFileName = `signed_${Date.now()}.jpg`;
        signedPhotoPath = `/uploads/${signedPhotoFileName}`;

        fs.writeFileSync(
          path.join(uploadDir, signedPhotoFileName), 
          Buffer.from(base64Data, 'base64')
        );
      }

      // Handle attachment if sent as base64 or file object
      if (orderData.attachment) {
        attachmentFileName = `${Date.now()}_${orderData.attachment.name || 'attachment'}`;
        attachmentPath = `/uploads/${attachmentFileName}`;

        // If attachment is base64
        if (typeof orderData.attachment === 'string' && orderData.attachment.startsWith('data:')) {
          const base64Data = orderData.attachment.split(',')[1];
          fs.writeFileSync(
            path.join(uploadDir, attachmentFileName), 
            Buffer.from(base64Data, 'base64')
          );
        }
        // If attachment is a file object
        else if (orderData.attachment instanceof File) {
          const fileBuffer = await orderData.attachment.arrayBuffer();
          fs.writeFileSync(path.join(uploadDir, attachmentFileName), Buffer.from(fileBuffer));
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

    // Simpan order ke database dengan path foto yang di-signed
    const orderResult = await db.query(
      `INSERT INTO orders (
        sample_order_no, sender, phone, email, address, total_qty, 
        attachment_path, attachment_name, 
        signed_photo_path, signed_photo_name,
        notes, pic, pic_phone, signed, date, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) 
      RETURNING id`,
      [
        sampleOrderNo,
        sender,
        orderData.phone || '',
        orderData.email || '',
        orderData.address || '',
        orderData.totalQty || 0,
        attachmentPath,  
        attachmentFileName,
        signedPhotoPath,
        signedPhotoFileName,
        orderData.notes || '',
        orderData.pic || '',
        orderData.picPhone || '',
        orderData.signed ? true : null, // Convert to boolean or null
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
        attachmentPath,
        signedPhotoPath
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return NextResponse.json({ error: `Terjadi kesalahan: ${error.message}` }, { status: 500 });
  }
}
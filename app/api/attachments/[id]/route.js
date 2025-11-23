// // File: /app/api/attachments/[id]/route.js

// import { NextResponse } from "next/server";
// import { pool } from "@/lib/db";
// import fs from 'fs';
// import path from 'path';

// export async function GET(req, { params }) {
//   try {
//     const { id } = params;

//     if (!id) {
//       return NextResponse.json({ error: "ID is required" }, { status: 400 });
//     }

//     // Get attachment data from database based on order_id
//     const result = await pool.query(
//       `SELECT 
//         attachment_path, 
//         attachment_name 
//       FROM 
//         orders 
//       WHERE 
//         id = $1`,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return NextResponse.json({ error: "Order not found" }, { status: 404 });
//     }

//     const orderData = result.rows[0];

//     // Check if there's an attachment
//     if (!orderData.attachment_path) {
//       return NextResponse.json({ error: "No attachment found" }, { status: 404 });
//     }

//     // Get the file path
//     const filePath = orderData.attachment_path;
//     const fullPath = path.join(process.cwd(), 'public', filePath);

//     // Check if file exists
//     if (!fs.existsSync(fullPath)) {
//       console.error(`File not found at path: ${fullPath}`);
//       return NextResponse.json({ error: "File not found on server" }, { status: 404 });
//     }

//     // Read the file
//     const fileBuffer = fs.readFileSync(fullPath);
    
//     // Determine content type
//     const fileExtension = path.extname(filePath).toLowerCase().substring(1);
//     const contentTypeMap = {
//       'pdf': 'application/pdf',
//       'jpg': 'image/jpeg',
//       'jpeg': 'image/jpeg',
//       'png': 'image/png',
//       'csv': 'text/csv',
//       'xls': 'application/vnd.ms-excel',
//       'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     };
    
//     const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
    
//     // Return the file with appropriate headers
//     return new NextResponse(fileBuffer, {
//       status: 200,
//       headers: {
//         'Content-Type': contentType,
//         'Content-Disposition': `inline; filename="${orderData.attachment_name}"`,
//       },
//     });
//   } catch (error) {
//     console.error("Error serving attachment:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const orderId = parseInt(params.id, 10);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    // Query to get attachment details from an order
    const query = `
      SELECT attachment_name, attachment_path
      FROM orders
      WHERE id = $1 AND attachment_path IS NOT NULL;
    `;

    const { rows } = await pool.query(query, [orderId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No attachment found for this order" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 });
  }
}
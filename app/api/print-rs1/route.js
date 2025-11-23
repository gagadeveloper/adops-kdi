import { NextResponse } from "next/server";
import db from '@/lib/db'; // Adjust to match your actual database connection

export const dynamic = 'force-dynamic';
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sampleOrderNo = searchParams.get("sampleOrderNo");

    if (!sampleOrderNo) {
      return NextResponse.json({ error: "sampleOrderNo is required" }, { status: 400 });
    }

    // Query to get order details with client information
    const orderQuery = `
      SELECT 
        o.*,
        c.name AS client_name,
        c.address AS client_address,
        c.phone AS client_phone,
        c.email AS client_email
      FROM orders o
      LEFT JOIN clients c ON o.sender = c.id::text
      WHERE o.sample_order_no = $1
    `;

    const orderResult = await db.query(orderQuery, [sampleOrderNo]);

    if (!orderResult.rows.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Use client details if available, otherwise use order details
    const orderData = {
      ...order,
      sender: order.client_name || order.sender,
      address: order.client_address || order.address,
      phone: order.client_phone || order.phone,
      email: order.client_email || order.email,
    };

    // Get samples for this order
    const samplesQuery = "SELECT * FROM samples WHERE order_id = $1";
    const samplesResult = await db.query(samplesQuery, [order.id]);

    // Prepare attachment information
    let attachmentInfo = {
      attachment_name: order.attachment_name || "Lihat Lampiran",
      attachment_path: order.attachment_path || null
    };

    // Return complete data
    return NextResponse.json({
      ...orderData,
      samples: samplesResult.rows,
      ...attachmentInfo,
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    });
  } catch (error) {
    console.error("Error fetching RS1 data:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
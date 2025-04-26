import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = 'force-dynamic';
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sampleOrderNo = searchParams.get("sampleOrderNo");

    if (!sampleOrderNo) {
      return NextResponse.json({ error: "sampleOrderNo is required" }, { status: 400 });
    }

    // Query to get pi_hantaran details
    const piHantaranQuery = `
      SELECT *
      FROM pi_hantaran
      WHERE sample_order_no = $1
    `;

    const piHantaranResult = await pool.query(piHantaranQuery, [sampleOrderNo]);

    if (!piHantaranResult.rows.length) {
      return NextResponse.json({ error: "Pi Hantaran not found" }, { status: 404 });
    }

    const piHantaran = piHantaranResult.rows[0];

    // Get order details if needed
    const orderQuery = `
      SELECT * 
      FROM orders
      WHERE sample_order_no = $1
    `;

    const orderResult = await pool.query(orderQuery, [sampleOrderNo]);
    const orderData = orderResult.rows.length ? orderResult.rows[0] : null;

    // Get samples for this order if order exists
    let samples = [];
    if (orderData) {
      const samplesQuery = "SELECT * FROM samples WHERE order_id = $1";
      const samplesResult = await pool.query(samplesQuery, [orderData.id]);
      samples = samplesResult.rows;
    }

    // Combine data
    const responseData = {
      ...piHantaran,
      order: orderData,
      samples: samples,
      date: piHantaran.date || new Date().toISOString().split('T')[0]
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
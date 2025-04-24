import { NextResponse } from "next/server";
import { Pool } from 'pg';

// Konfigurasi koneksi database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Untuk Next.js App Router
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shipmentid = searchParams.get('shipmentid');

  if (!shipmentid) {
    return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
  }

  try {
    // Ambil data PI Shipment dari database
    const result = await pool.query(
      `SELECT * FROM pi_shipment WHERE id_shipment = $1`,
      [shipmentid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Transformasi data jika diperlukan
    const shipmentData = result.rows[0];
    
    // Hitung amount berdasarkan jumlah
    const amount = shipmentData.jumlah;
    
    // Format data untuk kebutuhan template PDF
    const formattedData = {
      id: shipmentData.id,
      id_shipment: shipmentData.id_shipment,
      invoice_no: shipmentData.no_invoice,
      date: shipmentData.date,
      client: shipmentData.client,
      no_co: shipmentData.no_co,
      jenis_pekerjaan: shipmentData.jenis_pekerjaan,
      lokasi: shipmentData.lokasi,
      quantity: shipmentData.quantity,
      harga_per_mt: shipmentData.harga_per_mt,
      dp: shipmentData.dp,
      amount: amount,
      jumlah: shipmentData.jumlah,
      ppn: shipmentData.ppn,
      description: shipmentData.description,
      total: shipmentData.total
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
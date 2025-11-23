import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jenisPembayaran = searchParams.get('jenisPembayaran');
    const action = searchParams.get('action');
    
    // Handle getNextInvoiceNumber action
    if (action === 'getNextInvoiceNumber') {
      try {
        // Query to get the highest sequence number
        const result = await db.query(`
          SELECT MAX(CAST(
            SUBSTRING(no_invoice FROM '^[^-]+-([0-9]+)/') AS INTEGER
          )) AS max_seq
          FROM pi_shipment
        `);
        
        // Get the next sequence number
        const lastSequenceNumber = result.rows[0].max_seq || 0;
        const nextSequenceNumber = lastSequenceNumber + 1;
        
        return NextResponse.json({ nextSequenceNumber });
      } catch (error) {
        console.error('Error getting next invoice number:', error);
        return NextResponse.json(
          { error: 'Failed to get next invoice number' },
          { status: 500 }
        );
      }
    }
    
    // Regular GET request
    let queryText = 'SELECT * FROM pi_shipment';
    const queryParams = [];
    
    if (jenisPembayaran) {
      queryText += ' WHERE jenis_pembayaran = $1';
      queryParams.push(jenisPembayaran);
    }
    
    queryText += ' ORDER BY date DESC';
    
    const { rows } = await db.query(queryText, queryParams);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validasi data
    if (!data.client || !data.jenis_pembayaran || !data.jenis_pekerjaan || !data.lokasi) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }
    
    // Generate ID shipment jika belum ada
    if (!data.id_shipment) {
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString().slice(-2);
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      
      // Get the latest ID to increment
      const latestResult = await db.query(
        "SELECT MAX(id_shipment) FROM pi_shipment WHERE id_shipment LIKE $1",
        [`SHP${year}${month}%`]
      );
      
      const latestId = latestResult.rows[0].max || `SHP${year}${month}000`;
      const latestNumber = parseInt(latestId.slice(-3));
      const newNumber = (latestNumber + 1).toString().padStart(3, '0');
      data.id_shipment = `SHP${year}${month}${newNumber}`;
    }
    
    // EITHER OPTION 1: Add ID Generation (if id is a sequence/serial)
    // Get the next ID value from the sequence
    // This assumes your table has a sequence for the id column
    // const idResult = await db.query("SELECT nextval('pi_shipment_id_seq')");
    // const nextId = idResult.rows[0].nextval;
    
    // OPTION 2: Include id column explicitly in the query (if you need to provide it)
    const query = `
      INSERT INTO pi_shipment (
        id, id_shipment, jenis_pembayaran, client, no_invoice, no_co, 
        jenis_pekerjaan, lokasi, date, quantity, qty, harga_per_mt,
        description, add_cost_amount, dp, jumlah, ppn, total, sign
      ) VALUES (
        nextval('pi_shipment_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;
    
    const values = [
      data.id_shipment,
      data.jenis_pembayaran,
      data.client,
      data.no_invoice || null,
      data.no_co || null,
      data.jenis_pekerjaan,
      data.lokasi,
      data.date,
      parseInt(data.quantity),
      data.qty,
      parseFloat(data.harga_per_mt),
      data.description || null,
      data.add_cost_amount ? parseFloat(data.add_cost_amount) : 0,
      data.dp ? parseFloat(data.dp) : 0,
      parseFloat(data.jumlah),
      parseFloat(data.ppn),
      parseFloat(data.total),
      false // Default sign to false
    ];
    
    const result = await db.query(query, values);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding PI shipment:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validasi data
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID shipment tidak ditemukan' },
        { status: 400 }
      );
    }
    
    const query = `
      UPDATE pi_shipment SET
        id_shipment = $1,
        jenis_pembayaran = $2,
        client = $3,
        no_invoice = $4,
        no_co = $5,
        jenis_pekerjaan = $6,
        lokasi = $7,
        date = $8,
        quantity = $9,
        qty = $10,
        harga_per_mt = $11,
        description = $12,
        add_cost_amount = $13,
        dp = $14,
        jumlah = $15,
        ppn = $16,
        total = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `;
    
    const values = [
      data.id_shipment,
      data.jenis_pembayaran,
      data.client,
      data.no_invoice || null,
      data.no_co || null,
      data.jenis_pekerjaan,
      data.lokasi,
      data.date,
      parseInt(data.quantity),
      data.qty,
      parseFloat(data.harga_per_mt),
      data.description || null,
      data.add_cost_amount ? parseFloat(data.add_cost_amount) : 0,
      data.dp ? parseFloat(data.dp) : 0,
      parseFloat(data.jumlah),
      parseFloat(data.ppn),
      parseFloat(data.total),
      parseInt(data.id)
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating PI shipment:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}
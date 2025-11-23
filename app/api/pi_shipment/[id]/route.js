import { NextResponse } from "next/server";
import db from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    
    const query = 'SELECT * FROM pi_shipment WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shipment by ID:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const shipmentId = parseInt(params.id, 10);

  if (isNaN(shipmentId)) {
      return NextResponse.json({ error: "Invalid Shipment ID" }, { status: 400 });
  }

  try {
      // Hapus data dari tabel 'pi_shipment'
      const deleteQuery = `DELETE FROM pi_shipment WHERE id = $1 RETURNING *;`;
      const { rows } = await db.query(deleteQuery, [shipmentId]);

      if (rows.length === 0) {
          return NextResponse.json({ error: "pi_shipment tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({ message: "PI berhasil dihapus" }, { status: 200 });
  } catch (error) {
      console.error("Error deleting shipment:", error);
      return NextResponse.json({ error: "Gagal menghapus PI" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const id = params.id;
    const updates = await request.json();
    
    // Build the SET part of the query dynamically based on provided updates
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') { // Skip the ID field
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add updated_at
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add the ID to the values array
    values.push(parseInt(id));
    
    const query = `
      UPDATE pi_shipment SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const data = await request.json();
    
    console.log('Received data for PUT:', data); // Log untuk debugging
    
    // Lakukan validasi data
    if (!data.id_shipment || !data.client || !data.date) {
      return NextResponse.json(
        { message: 'Data tidak lengkap' }, 
        { status: 400 }
      );
    }
    
    // Konversi nilai-nilai numerik
    const jumlah = parseFloat(data.jumlah) || 0;
    const ppn = jumlah * 0.11;
    const total = jumlah + ppn;
    const quantity = parseInt(data.quantity) || 0;
    
    // Gunakan query SQL langsung seperti pada method PATCH
    const query = `
      UPDATE pi_shipment SET 
        id_shipment = $1,
        client = $2,
        no_invoice = $3,
        date = $4,
        description = $5,
        jumlah = $6,
        ppn = $7,
        total = $8,
        jenis_pembayaran = $9,
        quantity = $10,
        jenis_pekerjaan = $11,
        lokasi = $12,
        no_co = $13,
        harga_per_mt = $14,
        add_cost_amount = $15,
        dp = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `;

    const values = [
      data.id_shipment,
      data.client,
      data.no_invoice,
      new Date(data.date),
      data.description,
      parseFloat(data.jumlah) || 0,
      ppn,
      total,
      data.jenis_pembayaran,
      parseInt(data.quantity) || 0,
      data.jenis_pekerjaan,
      data.lokasi,
      data.no_co,
      parseFloat(data.harga_per_mt) || 0,
      parseFloat(data.add_cost_amount) || 0,
      parseFloat(data.dp) || 0,
      parseInt(id)
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Data tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Gagal memperbarui data: ' + error.message }, 
      { status: 500 }
    );
  }
}
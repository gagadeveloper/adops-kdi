// app/api/clients/route.js
import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM clients_shipment ORDER BY name');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name, phone, email, address } = await request.json();
    const { rows } = await db.query(
      'INSERT INTO clients_shipment (id, name, phone, email, address) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
      [name, phone, email, address]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating client' },
      { status: 500 }
    );
  }
}
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Error fetching client details' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Error deleting client' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const { name, phone, email, address } = await request.json();
    
    const { rows } = await pool.query(
      'UPDATE clients SET name = $1, phone = $2, email = $3, address = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, phone, email, address, id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Error updating client' },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import db from '@/lib/db';

export async function GET() {
    try {
        // Query untuk mengambil data orders + total_qty dari samples
        const result = await db.query(`
            SELECT 
                o.*, 
                c.name AS client_name, 
                COALESCE(SUM(s.quantity), 0) AS total_qty -- Hitung total sample
            FROM orders2 o
            LEFT JOIN clients c ON o.sender = c.id::text
            LEFT JOIN samples2 s ON o.id = s.order_id
            GROUP BY o.id, c.name
            ORDER BY o.created_at DESC
        `);

        console.log('Orders fetched:', result.rows.length); // Debugging
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders', details: error.message },
            { status: 500 }
        );
    }
}

// Tambahkan handler untuk debugging
export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Received data:', body);
        
        // Implementasi logic penambahan data di sini
        // ...
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding order:', error);
        return NextResponse.json(
            { error: 'Failed to add order', details: error.message },
            { status: 500 }
        );
    }
}
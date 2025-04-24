import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        // Query untuk mengambil data orders + total_qty dari rs1_detail
        const result = await db.query(`
            SELECT 
                o.*, 
                c.name AS client_name, 
                COALESCE(SUM(d.quantity), 0) AS total_qty -- Hitung total sample
            FROM orders o
            LEFT JOIN clients c ON o.sender = c.id::text
            LEFT JOIN samples d ON o.id = d.order_id
            GROUP BY o.id, c.name -- Pastikan semua kolom yang tidak dalam agregasi masuk ke GROUP BY
            ORDER BY o.created_at DESC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

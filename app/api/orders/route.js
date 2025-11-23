import { NextResponse } from "next/server";
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sampleOrderNo = searchParams.get('sampleOrderNo');
        
        // If sampleOrderNo is provided, get that specific order
        if (sampleOrderNo) {
            console.log('API: Fetching order with sample_order_no:', sampleOrderNo);
            
            const result = await db.query(
                `SELECT * FROM orders WHERE sample_order_no = $1 LIMIT 1`,
                [sampleOrderNo]
            );
            
            if (result.rows.length === 0) {
                console.log('API: No order found with sample_order_no:', sampleOrderNo);
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            
            console.log('API: Found order:', result.rows[0].id);
            return NextResponse.json(result.rows[0]);
        }
        
        // If no sampleOrderNo, return all orders
        const result = await db.query(`
            SELECT 
                o.*, 
                c.name AS client_name, 
                COALESCE(SUM(d.quantity), 0) AS total_qty
            FROM orders o
            LEFT JOIN clients c ON o.sender = c.id::text
            LEFT JOIN samples d ON o.id = d.order_id
            GROUP BY o.id, c.name
            ORDER BY o.created_at DESC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('API error in orders route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
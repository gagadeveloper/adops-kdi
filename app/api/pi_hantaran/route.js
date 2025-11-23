// route.js - Update your API route to include date mapping
import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Modified query to use created_at as date if date is NULL
        const result = await db.query(`
            SELECT 
                *,
                COALESCE(date, created_at::date) as effective_date 
            FROM pi_hantaran
            ORDER BY created_at DESC
        `);
        
        // Format the data before sending to frontend
        const formattedData = result.rows.map(row => ({
            ...row,
            // Ensure date is set - use created_at if date is NULL
            date: row.date || row.created_at,
            // Add default values for fields that might be needed by the frontend
            jenis_pembayaran: row.status === 'Paid' ? 'Pelunasan' : 'DP',
            sign: row.status === 'Paid'
        }));
        
        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching PI Hantaran data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data', message: error.message },
            { status: 500 }
        );
    }
}
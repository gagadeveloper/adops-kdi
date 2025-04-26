import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';
export async function POST(req) {
    try {
        const body = await req.json();
        console.log('Received data:', body);
        
        // Mengambil data dari request body
        const {
            sample_order_no,
            client,
            description,
            amount,
            jumlah,
            ppn,
            total
        } = body;
        
        // Simpan ke database
        const insertResult = await db.query(
            `INSERT INTO pi_hantaran (sample_order_no, client, description, amount, jumlah, ppn, total, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
            [sample_order_no, client, description, amount, jumlah, ppn, total]
        );

        return NextResponse.json(insertResult.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating PI Hantaran:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await db.query(`
            SELECT * FROM pi_hantaran
            ORDER BY created_at DESC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching PI Hantaran data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}
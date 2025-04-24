import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req, { params }) {
    try {
        const { id } = params;
        
        const result = await db.query(`
            SELECT *
            FROM samples
            WHERE order_id = $1
            ORDER BY created_at
        `, [id]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching samples:', error);
        return NextResponse.json(
            { error: 'Failed to fetch samples' },
            { status: 500 }
        );
    }
}
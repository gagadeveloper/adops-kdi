import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const orderId = formData.get("orderId"); // ID dari order yang menerima lampiran

        if (!file || !orderId) {
            return NextResponse.json(
                { error: "File or orderId is missing" },
                { status: 400 }
            );
        }

        // Pastikan direktori uploads ada
        const uploadDir = path.join(process.cwd(), "public/uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Simpan file ke server
        const filePath = path.join(uploadDir, file.name);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, fileBuffer);

        // Simpan path file ke database
        const query = `
            UPDATE orders 
            SET attachment_path = $1, attachment_name = $2
            WHERE id = $3
            RETURNING *;
        `;
        const values = [`/uploads/${file.name}`, file.name, orderId];
        const result = await db.query(query, values);

        return NextResponse.json({ message: "File uploaded successfully", order: result.rows[0] });
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: "File upload failed", details: error.message },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid"; // You'll need to install this: npm install uuid

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Get file extension
    const originalName = file.name;
    const fileExtension = originalName.split(".").pop();
    
    // Create a unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Define uploads directory path
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Write file to disk
    await writeFile(join(uploadDir, fileName), fileBuffer);
    
    // Create a URL path for the file
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      message: "File berhasil diunggah", 
      url: fileUrl 
    });
    
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah file" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

// Configuration for development and production environments
export async function POST(request) {
  console.log("Upload document API called");
  
  try {
    // Configure Cloudinary similar to your other endpoints
    if (process.env.CLOUDINARY_URL) {
      console.log('Using CLOUDINARY_URL for configuration');
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "di91m0u7o",
        api_key: process.env.CLOUDINARY_API_KEY || "667212683317254",
        api_secret: process.env.CLOUDINARY_API_SECRET || "HnuNliTII9q_442SbpczbRYCfas",
        secure: true
      });
      console.log('Using individual credentials for Cloudinary configuration');
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file received' 
      }, { status: 400 });
    }
    
    console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    // Validate the file
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB' 
      }, { status: 400 });
    }
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Use PDF, DOC, or DOCX' 
      }, { status: 400 });
    }
    
    // Upload to Cloudinary using the same pattern as in your other code
    const fileUrl = await uploadToCloudinary(file, 'documents/uploads');
    
    // Return the URL of the uploaded file
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });
    
  } catch (error) {
    console.error('Error in upload-document API route:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An unknown error occurred during file upload'
    }, { status: 500 });
  }
}

// Helper function to upload to Cloudinary using the unsigned preset
async function uploadToCloudinary(file, folder) {
  try {
    // Convert file buffer to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;
    
    // Important: Use the exact preset name from your Cloudinary dashboard
    const UPLOAD_PRESET = "tracking_samples"; // Make sure this matches EXACTLY
    
    console.log('Uploading to Cloudinary with preset:', UPLOAD_PRESET);
    
    // Upload to Cloudinary using unsigned upload with the preset
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.unsigned_upload(
        dataURI, 
        UPLOAD_PRESET, // Use the preset name here
        {
          folder: folder,
          resource_type: 'auto', // Automatically detect whether it's an image or raw file
        }, 
        (error, result) => {
          if (error) {
            console.error('Cloudinary error details:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error details:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}
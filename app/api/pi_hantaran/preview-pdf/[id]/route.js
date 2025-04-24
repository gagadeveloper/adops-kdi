// api/pi_hantaran/preview-pdf/[id].js
// This is similar to print but provides an iframe-friendly response for preview
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { pool } from '@/lib/db'; //  Adjust path as needed

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    // Fetch PI Hantaran data
    const piHantaranResult = await pool.query(
      `SELECT * FROM pi_hantaran WHERE id = $1`,
      [id]
    );

    if (piHantaranResult.rows.length === 0) {
      return res.status(404).json({ message: 'PI Hantaran not found' });
    }

    const piData = piHantaranResult.rows[0];
    
    // Fetch related samples
    const samplesResult = await pool.query(
      `SELECT 
        id, 
        sample_code, 
        commodity,
        type_size, 
        quantity 
      FROM samples 
      WHERE sample_code = $1 OR order_id = $2`,
      [piData.sample_order_no, id]
    );
    
    // You can reuse the generatePDF function defined in the print handler
    const pdfBytes = await generatePDF(piData, samplesResult.rows);
    
    // Send PDF as response with appropriate headers for preview
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="PI_Hantaran_Preview_${id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    res.status(500).json({ message: 'Error generating PDF preview', error: error.message });
  }
}

// The generatePDF function would be identical to the one defined in print/[id].js
// In a real application, you would likely put this in a shared utility file
// For brevity, it's not included here since it would be the same as defined earlier
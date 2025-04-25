import { pool } from '@/lib/db'; //  Adjust path as needed

// New style (App Router)
export async function GET(request, { params }) {
  const id = params.id;
  
  try {
    // Fetch PI Hantaran data
    const piHantaranResult = await pool.query(
      `SELECT * FROM pi_hantaran WHERE id = $1`,
      [id]
    );

    if (piHantaranResult.rows.length === 0) {
      return new Response(JSON.stringify({ url: pdfUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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

export async function POST(request, { params }) {
  const id = params.id;
  const body = await request.json();
  
  // Handle POST logic
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
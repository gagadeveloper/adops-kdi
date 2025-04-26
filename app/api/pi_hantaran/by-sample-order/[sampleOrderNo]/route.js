// /app/api/pi_hantaran/by-sample-order/[sampleOrderNo]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust according to your database setup

export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const sampleOrderNo = params.sampleOrderNo;
    
    if (!sampleOrderNo) {
      return NextResponse.json({ error: 'Sample Order No is required' }, { status: 400 });
    }
    
    // Find PI Hantaran entry by sample order number
    const piHantaran = await db.piHantaran.findFirst({
      where: { 
        sample_order_no: sampleOrderNo 
      },
    });
    
    if (!piHantaran) {
      return NextResponse.json({ error: 'PI Hantaran not found' }, { status: 404 });
    }
    
    return NextResponse.json(piHantaran);
  } catch (error) {
    console.error('Error fetching PI Hantaran by sample order:', error);
    return NextResponse.json(
      { error: `Failed to fetch PI Hantaran: ${error.message}` },
      { status: 500 }
    );
  }
}
import db from '@/lib/db';
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const orderId = params.id;

  try {
    // Determine request type and parse body
    const contentType = request.headers.get("content-type") || "";
    let orderData;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const orderDataJSON = formData.get("orderData");
      
      if (!orderDataJSON) {
        return NextResponse.json(
          { error: "Missing orderData in formData" },
          { status: 400 }
        );
      }
      
      try {
        orderData = JSON.parse(orderDataJSON);
      } catch (error) {
        console.error("Error parsing orderData JSON:", error);
        return NextResponse.json(
          { error: `Error parsing orderData JSON: ${error.message}` },
          { status: 400 }
        );
      }
      
      const file = formData.get("attachment");
      
      // Handle file storage if included in the form
      if (file && file.size > 0) {
        // Store file reference (implement your file storage logic here)
        const filename = file.name;
        const filepath = `/uploads/orders/${Date.now()}-${filename}`;
        
        // Example placeholder for actual file saving
        // await saveFile(file, filepath);
        
        orderData.attachment_name = filename;
        orderData.attachment_path = filepath;
      }
    } else {
      // Handle JSON request
      orderData = await request.json();
    }

    // Start a transaction to handle both order and samples update
    await db.query('BEGIN');
    
    try {
      // 1. Update the order
      const orderQuery = `
        UPDATE orders
        SET 
          sample_order_no = $1,
          client_name = $2,
          phone = $3,
          email = $4,
          address = $5,
          date = $6,
          total_qty = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *;
      `;

      const orderValues = [
        orderData.sample_order_no,
        orderData.client_name,
        orderData.phone,
        orderData.email,
        orderData.address,
        orderData.date,
        orderData.total_qty,
        orderId
      ];

      const orderResult = await db.query(orderQuery, orderValues);
      
      if (orderResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
      }
      
      // 2. Handle samples - first get existing samples to compare
      const existingSamplesResult = await db.query(
        'SELECT id FROM samples WHERE order_id = $1',
        [orderId]
      );
      
      const existingSampleIds = existingSamplesResult.rows.map(row => row.id);
      const updatedSampleIds = [];
      
      // 3. Process each sample from the request
      if (orderData.samples && Array.isArray(orderData.samples)) {
        for (const sample of orderData.samples) {
          if (sample.id) {
            // Update existing sample
            updatedSampleIds.push(sample.id);
            
            await db.query(`
              UPDATE samples
              SET 
                sample_code = $1,
                quantity = $2,
                commodity = $3,
                type_size = $4,
                parameter = $5,
                regulation = $6,
                method_of_analysis = $7,
                updated_at = NOW()
              WHERE id = $8 AND order_id = $9
            `, [
              sample.sample_code,
              sample.quantity,
              sample.commodity,
              sample.type_size,
              sample.parameter,
              sample.regulation,
              sample.method_of_analysis,
              sample.id,
              orderId
            ]);
          } else {
            // Insert new sample
            const newSampleResult = await db.query(`
              INSERT INTO samples (
                order_id,
                sample_code,
                quantity,
                commodity,
                type_size,
                parameter,
                regulation,
                method_of_analysis,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
              RETURNING id
            `, [
              orderId,
              sample.sample_code,
              sample.quantity,
              sample.commodity,
              sample.type_size,
              sample.parameter,
              sample.regulation,
              sample.method_of_analysis
            ]);
            
            if (newSampleResult.rows.length > 0) {
              updatedSampleIds.push(newSampleResult.rows[0].id);
            }
          }
        }
      }
      
      // 4. Delete samples that were not included in the update
      const samplesToDelete = existingSampleIds.filter(
        id => !updatedSampleIds.includes(id)
      );
      
      if (samplesToDelete.length > 0) {
        await db.query(
          'DELETE FROM samples WHERE id = ANY($1)', 
          [samplesToDelete]
        );
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      // 5. Fetch updated samples to return complete data
      const updatedSamplesResult = await db.query(
        'SELECT * FROM samples WHERE order_id = $1',
        [orderId]
      );
      
      return NextResponse.json({ 
        message: "Order berhasil diperbarui",
        data: {
          ...orderResult.rows[0],
          samples: updatedSamplesResult.rows
        }
      }, { status: 200 });
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ 
      error: `Error updating order: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
        return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    try {
        // Determine request type and parse body
        const contentType = req.headers.get("content-type") || "";
        let orderData;
        let file = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
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
            
            file = formData.get("attachment");
            
            // Handle file storage here (this is an example placeholder)
            if (file) {
                // Code to save file to your storage system
                // For now, using placeholders
                const filename = file.name;
                const filepath = `/uploads/${Date.now()}-${filename}`;
                
                // Here you would actually save the file
                // Example: await saveFile(file, filepath);
                
                orderData.attachment_name = filename;
                orderData.attachment_path = filepath;
            }
        } else {
            try {
                orderData = await req.json();
            } catch (error) {
                console.error("Error parsing JSON body:", error);
                return NextResponse.json(
                    { error: `Error parsing JSON body: ${error.message}` },
                    { status: 400 }
                );
            }
            
            // Map attachment fields from frontend to database names
            if (orderData.attachmentName) {
                orderData.attachment_name = orderData.attachmentName;
            }
            if (orderData.attachmentUrl) {
                orderData.attachment_path = orderData.attachmentUrl;
            }
        }

        // Start a transaction to handle both order and samples update
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Update the order
            const orderQuery = `
                UPDATE orders
                SET 
                    sample_order_no = $1,
                    sender = $2,
                    phone = $3,
                    email = $4,
                    address = $5,
                    pic = $6,
                    pic_phone = $7,
                    notes = $8,
                    total_qty = $9,
                    attachment_name = $10,
                    attachment_path = $11
                WHERE id = $12
                RETURNING *;
            `;

            const orderValues = [
                orderData.sample_order_no,
                orderData.sender,
                orderData.phone,
                orderData.email,
                orderData.address,
                orderData.pic,
                orderData.pic_phone,
                orderData.notes,
                orderData.total_qty,
                orderData.attachment_name,
                orderData.attachment_path,
                orderId
            ];

            const orderResult = await client.query(orderQuery, orderValues);
            
            if (orderResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
            }
            
            // 2. Handle samples - first get existing samples to compare
            const existingSamplesResult = await client.query(
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
                        
                        await client.query(`
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
                        const newSampleResult = await client.query(`
                            INSERT INTO samples (
                                order_id,
                                sample_code,
                                quantity,
                                commodity,
                                type_size,
                                parameter,
                                regulation,
                                method_of_analysis
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
                await client.query(
                    'DELETE FROM samples WHERE id = ANY($1)', 
                    [samplesToDelete]
                );
            }
            
            await client.query('COMMIT');
            
            return NextResponse.json({ 
                message: "Order berhasil diperbarui",
                data: {
                    ...orderResult.rows[0],
                    samples: orderData.samples
                }
            }, { status: 200 });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ 
            error: `Error updating order: ${error.message}`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

async function updateOrder(req, res) {
    const { 
      client_order_no, 
      hold_7_days_storage, 
      hold_1_month_storage, 
      hold_custom_months_storage 
    } = req.body;
  
    try {
      const updatedOrder = await db.query(
        `UPDATE orders 
         SET 
           client_order_no = $1,
           hold_7_days_storage = $2,
           hold_1_month_storage = $3,
           hold_custom_months_storage = $4
         WHERE id = $5
         RETURNING *`,
        [
          client_order_no, 
          hold_7_days_storage, 
          hold_1_month_storage, 
          hold_custom_months_storage,
          orderId
        ]
      );
  
      res.json(updatedOrder.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
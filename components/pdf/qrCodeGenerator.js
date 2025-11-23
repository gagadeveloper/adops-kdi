import QRCode from 'qrcode';
import { Image } from '@react-pdf/renderer';

export const generateSignedQRCode = async (orderData, signedImagePath) => {
  try {
    // Compile order information into a QR code string
    const qrCodeData = JSON.stringify({
      sampleOrderNo: orderData.sample_order_no,
      clientName: orderData.client_name || orderData.sender,
      projectName: orderData.project,
      Signed: orderData.signed,
      date: new Date().toISOString(),
      samples: orderData.samples?.map(sample => ({
        sampleCode: sample.sample_code,
        commodity: sample.commodity,
        parameter: sample.parameter
      }))
    });

    // Generate QR code as base64
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, { 
      errorCorrectionLevel: 'H',
      width: 200 
    });

    return qrCodeBase64;
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return null;
  }
};
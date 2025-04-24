'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintPIHantaranModal from "@/components/pdf/PrintPIHantaranModal";
import { ArrowLeft, Printer, Edit, FileUp, Download, CreditCard, FileText, Copy, Check } from 'lucide-react';

export default function PIHantaranDetail({ params }) {
  const router = useRouter();
  const orderId = params.id;
  
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sampleOrderNo, setSampleOrderNo] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data pesanan berdasarkan ID
        const orderResponse = await fetch(`/api/pi_hantaran/${orderId}`);
        
        if (!orderResponse.ok) {
          throw new Error(`Error ${orderResponse.status}: Gagal mengambil detail pesanan`);
        }
        
        const orderData = await orderResponse.json();
        setOrderDetail(orderData);
        
        // Set status pembayaran
        setIsPaid(orderData.status === 'Paid');
        
        // Mencoba untuk mengambil item terkait dari object orderData jika tersedia
        if (orderData.items && Array.isArray(orderData.items)) {
          setItems(orderData.items);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString || '-';
    }
  };

  const handlePrint = () => {
    if (orderDetail && orderDetail.sample_order_no) {
      setSampleOrderNo(orderDetail.sample_order_no);
      setIsModalOpen(true);
    } else {
      console.error("Sample order number not available");
      alert("Sample order number not available");
    }
  };

  const formatCurrency = (amount,jumlah) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount,jumlah);
  };

  const handlePayment = async () => {
    if (!orderDetail || processingPayment) return;
    
    try {
      setProcessingPayment(true);
      
      // Generate invoice number on payment
      // Get current date for invoice number format
      const now = new Date();
      const sequenceNumber = Math.floor(1000 + Math.random() * 9000); // Generate random 4-digit number (can be replaced with actual sequence)
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Get month as 2-digit string
      const year = String(now.getFullYear()).slice(-2); // Get last 2 digits of year
      
      // Format: INVMKS-0123/DBSCM/02/25
      const invoiceNo = `INVMKS-${sequenceNumber}/DBSCM/${month}/${year}`;
      
      // Update status pembayaran and invoice number
      const response = await fetch(`/api/pi_hantaran/update-payment/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Paid',
          invoice_no: invoiceNo,
          payment_date: new Date().toISOString() // Add payment date
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Gagal mengupdate status pembayaran dan invoice`);
      }
      
      // Refresh data setelah pembayaran berhasil
      const updatedOrderResponse = await fetch(`/api/pi_hantaran/${orderId}`);
      const updatedOrderData = await updatedOrderResponse.json();
      
      setOrderDetail(updatedOrderData);
      setIsPaid(true);
      
      // Tampilkan notifikasi berhasil
      alert(`Pembayaran berhasil diproses! Invoice No: ${invoiceNo}`);
      
    } catch (error) {
      console.error('Error processing payment:', error.message);
      alert(`Gagal memproses pembayaran: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // const handleCreateRS2 = async () => {
  //   if (!orderDetail || !orderDetail.sample_order_no) {
  //     alert('Sample Order No tidak tersedia');
  //     return;
  //   }
    
  //   try {
  //     // Pastikan data yang diperlukan sudah diambil sebelum navigasi
  //     const orderResponse = await fetch(`/api/orders?sampleOrderNo=${encodeURIComponent(orderDetail.sample_order_no)}`);
      
  //     if (!orderResponse.ok) {
  //       // Jika tidak ada data order, buat order baru dengan data dari PI Hantaran
  //       const newOrderData = {
  //         sampleOrderNo: orderDetail.sample_order_no,
  //         sender: orderDetail.client_id,
  //         totalQty: orderDetail.jumlah || 0,
  //         notes: orderDetail.description || '',
  //         // Data lainnya dari PI Hantaran
  //       };
        
  //       // Simpan data sementara di localStorage untuk diakses oleh halaman RS2
  //       localStorage.setItem('rs2_prefill_data', JSON.stringify(newOrderData));
  //     }
      
  //     // Navigasi ke halaman RS2 form dengan sample order no
  //     router.push(`/dashboard/adopsi/rs2/add?sampleOrderNo=${orderDetail.sample_order_no}&fromPi=true`);
  //   } catch (error) {
  //     console.error('Error saat menyiapkan data RS2:', error);
  //     // Navigasi tetap dilakukan meskipun ada error
  //     router.push(`/dashboard/adopsi/rs2/add?sampleOrderNo=${orderDetail.sample_order_no}&fromPi=true`);
  //   }
  // };

  // Menghitung total dari semua item
  const calculateTotal = () => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(true);
        setTimeout(() => {
          setCopiedText(false);
        }, 2000); // Reset copied state after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        alert('Gagal menyalin teks ke clipboard');
      });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.push('/dashboard/adopsi/pi_hantaran')} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </button>
        
        <h1 className="text-2xl font-bold">Detail PI Hantaran</h1>
        
        <div className="flex space-x-2">
        <button 
          onClick={handlePrint} 
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak PI
        </button>

          {/* <button 
            onClick={handlePayment}
            disabled={processingPayment || !orderDetail} 
            className="p-2 rounded bg-green-500 hover:bg-green-600 text-white flex items-center"
            title="Paid"
          >
            <CreditCard className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">{processingPayment ? 'Processing...' : 'Paid'}</span>
          </button> */}
          
          <button
            onClick={handlePayment}
            disabled={isPaid || processingPayment || !orderDetail}
            className={`p-2 rounded text-white flex items-center ${
              isPaid || processingPayment || !orderDetail ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            }`}
            title="Paid"
          >
            <CreditCard className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">
              {processingPayment ? "Processing..." : isPaid ? "Paid" : "Pay Now"}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-6 rounded-md text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <p className="mt-4">Silakan coba beberapa saran berikut:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Pastikan ID pesanan benar</li>
            <li>Pastikan API endpoint `/api/pi_hantaran/${orderId}` tersedia dan berfungsi</li>
            <li>Periksa console untuk error lebih detail</li>
          </ul>
        </div>
      ) : orderDetail ? (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          {/* Informasi Umum */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Informasi PI Hantaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Sample Order No</p>
                  <div className="flex items-center">
                    <p className="font-medium mr-2">{orderDetail.sample_order_no || '-'}</p>
                    {orderDetail.sample_order_no && (
                      <button 
                        onClick={() => copyToClipboard(orderDetail.sample_order_no)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        title="Copy to clipboard"
                      >
                        {copiedText ? 
                          <Check className="w-4 h-4 text-green-500" /> : 
                          <Copy className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Invoice No</p>
                  <div className="flex items-center">
                    <p className="font-medium mr-2">{orderDetail.invoice_no || '-'}</p>
                    {orderDetail.invoice_no && (
                      <button 
                        onClick={() => copyToClipboard(orderDetail.invoice_no)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        title="Copy to clipboard"
                      >
                        {copiedText ? 
                          <Check className="w-4 h-4 text-green-500" /> : 
                          <Copy className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Client</p>
                  <p className="font-medium">{orderDetail.client || '-'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Tanggal</p>
                  <p className="font-medium">{formatDate(orderDetail.created_at)}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Deskripsi</p>
                  <p className="font-medium">{orderDetail.description || '-'}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Amount</p>
                  <p className="font-medium">{formatCurrency(orderDetail.amount || 0)}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Jumlah</p>
                  <p className="font-medium">{formatCurrency(orderDetail.jumlah || 0)}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className={`font-medium ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isPaid ? 'Paid' : 'Pending Payment'}
                  </p>
                </div>
                {isPaid && orderDetail.payment_date && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Tanggal Pembayaran</p>
                    <p className="font-medium">{formatDate(orderDetail.payment_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Catatan atau informasi tambahan */}
          {orderDetail.notes && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Catatan</h2>
              <p className="text-gray-700">{orderDetail.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-100 p-6 rounded-md text-red-700">
          <p className="font-medium">Tidak dapat menemukan detail pesanan.</p>
          <p className="mt-2">Pastikan ID pesanan benar dan API endpoint berfungsi dengan baik.</p>
        </div>
      )}
      <PrintPIHantaranModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sampleOrderNo={sampleOrderNo}
      />
    </div>
  );
}
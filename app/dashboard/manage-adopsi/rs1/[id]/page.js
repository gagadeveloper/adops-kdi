'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PrintRS1Modal from "@/components/pdf/PrintRS1Modal";
import { ArrowLeft, Printer, Edit, FileUp, Download, CreditCard, FileText, Copy, Check } from 'lucide-react';

export default function SampleDetailPage() {
  const [order, setOrder] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sampleOrderNo, setSampleOrderNo] = useState("");
  const params = useParams();
  const router = useRouter(); // Menambahkan router yang diperlukan
  const { id } = params;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    fetchOrders();
  }, []);
  
  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const [orderResponse, samplesResponse] = await Promise.all([
        fetch(`/api/orders/${id}`),
        fetch(`/api/orders/${id}/samples`)
      ]);

      if (!orderResponse.ok) throw new Error('Failed to fetch order details');
      if (!samplesResponse.ok) throw new Error('Failed to fetch samples');

      const orderData = await orderResponse.json();
      const samplesData = await samplesResponse.json();

      setOrder(orderData);
      setSamples(samplesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setSampleOrderNo(order.sample_order_no);
    setIsModalOpen(true);
  };

  const handleViewAttachment = async () => {
    try {
      const response = await fetch(`/api/attachments/${order.id}`);
      const data = await response.json();
  
      console.log("Attachment API Response:", data); // Debugging
  
      if (!response.ok) {
        alert(data.error || "Gagal melihat lampiran");
        return;
      }
  
      // Periksa attachment_path, jika tidak ada coba periksa attachment_name
      if (data.attachment_path) {
        // Pastikan format path sudah benar
        // Jika attachment_path sudah termasuk /uploads/, tidak perlu tambahkan lagi
        const attachmentUrl = data.attachment_path.startsWith('/') 
          ? data.attachment_path 
          : `/uploads/${data.attachment_path}`;
        
        console.log("Opening attachment URL:", attachmentUrl); // Debugging
        window.open(attachmentUrl, "_blank");
      } else {
        alert("Tidak ada lampiran tersedia");
      }
    } catch (error) {
      console.error("Error melihat lampiran:", error);
      alert("Gagal melihat lampiran");
    }
  }; 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Order not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">Details RS1</h1>
        </div>
        
        {/* Tombol Cetak dipindahkan ke sini */}
        {/* <button 
          onClick={() => router.push('/dashboard/adopsi/pi_hantaran/add?orderId=${orderId}')} 
          className="btn-green p-2 rounded bg-green-500 hover:bg-green-600 text-white"
          >
          <FileText className="w-4 h-4 mr-1" />
          Create PI
        </button> */}
        <button 
          onClick={handlePrint} 
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak RS1
        </button>
      </div>
  
      
      {/* Tombol Kembali */}
      <button 
        onClick={() => router.push('/dashboard/manage-adopsi')} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="grid grid-cols-2 gap-y-4">
          <div className="space-y-4">
            <div className="flex">
              <span className="w-48 text-gray-600">Sample Order No.</span>
              <span className="text-gray-800">: {order.sample_order_no}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Client Order No.</span>
              <span className="text-gray-800">: {order.client_order_no || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Sender</span>
              <span className="text-gray-800">: {order.client_name}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Phone</span>
              <span className="text-gray-800">: {order.phone}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Email</span>
              <span className="text-gray-800">: {order.email}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Attachment</span>
              <span className="text-gray-800">: 
              {order.attachment_path ? (
                <button
                  onClick={handleViewAttachment}
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  Lihat Lampiran
                </button>
              ) : (
                ' -'
              )}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex">
              <span className="w-48 text-gray-600">Address</span>
              <span className="text-gray-800">: {order.address}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">PIC</span>
              <span className="text-gray-800">: {order.pic}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">PIC Phone</span>
              <span className="text-gray-800">: {order.pic_phone}</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Notes</span>
              <span className="text-gray-800">: {order.notes || '-'}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 border">
                <th className="px-4 py-2 text-left border">Sample Code</th>
                <th className="px-4 py-2 text-left border">Quantity</th>
                <th className="px-4 py-2 text-left border">Commodity</th>
                <th className="px-4 py-2 text-left border">Type/Size</th>
                <th className="px-4 py-2 text-left border">Parameter</th>
                <th className="px-4 py-2 text-left border">Regulation</th>
                <th className="px-4 py-2 text-left border">Method of Analysis</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id} className="border">
                  <td className="px-4 py-2 border">{sample.sample_code}</td>
                  <td className="px-4 py-2 border">{sample.quantity}</td>
                  <td className="px-4 py-2 border">{sample.commodity}</td>
                  <td className="px-4 py-2 border">{sample.type_size}</td>
                  <td className="px-4 py-2 border">{sample.parameter}</td>
                  <td className="px-4 py-2 border">{sample.regulation || '-'}</td>
                  <td className="px-4 py-2 border">{sample.method_of_analysis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PrintRS1Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sampleOrderNo={sampleOrderNo}
      />
    </div>
  );
}
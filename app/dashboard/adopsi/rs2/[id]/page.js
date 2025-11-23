'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PrintRS1Modal from "@/components/pdf/PrintRS1Modal";
import PrintRS2Modal from "@/components/pdf/PrintRS2Modal";
import { ArrowLeft, Printer, FileText } from 'lucide-react';

export default function SampleDetailPage() {
  const [order, setOrder] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRS1ModalOpen, setIsRS1ModalOpen] = useState(false);
  const [isRS2ModalOpen, setIsRS2ModalOpen] = useState(false);
  const [sampleOrderNo, setSampleOrderNo] = useState("");
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders2');
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
        fetch(`/api/orders2/${id}`),
        fetch(`/api/orders2/${id}/samples`)
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
  

  const handlePrintRS1 = () => {
    setSampleOrderNo(order.sample_order_no);
    setIsRS1ModalOpen(true);
  };

  const handlePrintRS2 = () => {
    setSampleOrderNo(order.sample_order_no);
    setIsRS2ModalOpen(true);
  };

  const handleViewAttachment = async () => {
    try {
      const response = await fetch(`/api/attachments/${order.id}`);
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.error || "Gagal melihat lampiran");
        return;
      }
  
      if (data.attachment_path) {
        const attachmentUrl = data.attachment_path.startsWith('/') 
          ? data.attachment_path 
          : `/uploads/${data.attachment_path}`;
        
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

  // Function to get storage option text
  const getStorageOptions = () => {
    const options = [];
    
    if (order.hold_7_days_storage) {
      options.push("Hold 7 Days Storage in Lab PT. SI");
    }
    
    if (order.hold_1_month_storage) {
      options.push("Hold 1 Month Storage in Lab PT. SI");
    }
    
    if (order.hold_custom_months_storage > 0) {
      options.push(`Hold ${order.hold_custom_months_storage} Month(s) Storage to Client`);
    }
    
    return options.length > 0 ? options.join(", ") : "-";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">Details RS2</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrintRS1} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak RS1
          </button>
          <button 
            onClick={handlePrintRS2} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak RS2
          </button>
        </div>
      </div>
      
      {/* Tombol Kembali */}
      <button 
        onClick={() => router.push('/dashboard/adopsi/rs2')} 
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
              <span className="text-gray-800">: {order.sender}</span>
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
              <span className="w-48 text-gray-600">Deadline Order</span>
              <span className="text-gray-800">: {order.deadline || '-'} Day(s)</span>
            </div>
            <div className="flex">
              <span className="w-48 text-gray-600">Notes</span>
              <span className="text-gray-800">: {order.notes || '-'}</span>
            </div>
            {/* Add storage options display */}
            <div className="flex">
              <span className="w-48 text-gray-600">Storage Options</span>
              <span className="text-gray-800">: {getStorageOptions()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 border">
                <th className="px-4 py-2 text-left border">Sample Numbers</th>
                <th className="px-4 py-2 text-left border">QTY</th>
                <th className="px-4 py-2 text-left border">Commodity</th>
                <th className="px-4 py-2 text-left border">Type/Size</th>
                <th className="px-4 py-2 text-left border">Parameter/Element</th>
                <th className="px-4 py-2 text-left border">Regulation</th>
                <th className="px-4 py-2 text-left border">Method of Analysis</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id} className="border">
                  <td className="px-4 py-2 border">{sample.sample_code || 'DATA SAMPEL TERLAMPIR'}</td>
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
        isOpen={isRS1ModalOpen}
        onClose={() => setIsRS1ModalOpen(false)}
        sampleOrderNo={sampleOrderNo}
      />
      
      <PrintRS2Modal
        isOpen={isRS2ModalOpen}
        onClose={() => setIsRS2ModalOpen(false)}
        sampleOrderNo={sampleOrderNo}
      />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Paperclip, X } from 'lucide-react';

export default function SampleDetailPage() {
  const [order, setOrder] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAttachment, setShowAttachment] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const params = useParams();

  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);

  const fetchOrderDetail = async () => {
    try {
      const [orderResponse, samplesResponse] = await Promise.all([
        fetch(`/api/orders/${params.id}`),
        fetch(`/api/orders/${params.id}/samples`)
      ]);

      if (!orderResponse.ok) throw new Error('Failed to fetch order details');
      if (!samplesResponse.ok) throw new Error('Failed to fetch samples');

      const orderData = await orderResponse.json();
      const samplesData = await samplesResponse.json();

      console.log('Order Data:', orderData); // Debug log
      console.log('Samples Data:', samplesData); // Debug log

      setOrder(orderData);
      setSamples(samplesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttachment = async () => {
    try {
      console.log('Fetching attachment for ID:', params.id); // Debug log
      
      const response = await fetch(`/api/attachments/${params.id}`);
      console.log('Attachment Response:', response); // Debug log
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attachment: ${response.status}`);
      }
      
      const attachmentData = await response.json();
      console.log('Attachment Data:', attachmentData); // Debug log
      
      setAttachment(attachmentData);
      setShowAttachment(true);
    } catch (error) {
      console.error('Error viewing attachment:', error);
      alert(`Failed to load attachment: ${error.message}`);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Detail Sample Order</h1>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        {/* Order details section */}
        <div className="grid grid-cols-2 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex">
              <span className="w-48 text-gray-600">Project</span>
              <span className="text-gray-800">: {order.project}</span>
            </div>
            {/* ... other order details ... */}
          </div>
        </div>

        {/* Samples Table */}
        <div className="mt-8">
          <table className="w-full">
            {/* ... table content ... */}
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleViewAttachment}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Paperclip className="w-4 h-4 mr-2" />
          Lihat Lampiran
        </button>
      </div>

      {/* Attachment Modal */}
      {showAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {attachment?.attachment_name || 'Lampiran Document'}
              </h2>
              <button
                onClick={() => setShowAttachment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ height: 'calc(90vh - 120px)' }}>
              {attachment?.attachment_path ? (
                <>
                  <div className="mb-4">
                    <p>Debug Info:</p>
                    <pre className="bg-gray-100 p-2 rounded">
                      {JSON.stringify(attachment, null, 2)}
                    </pre>
                  </div>
                  <iframe
                    src={attachment.attachment_path}
                    className="w-full h-full min-h-[500px]"
                    title="Document Preview"
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No attachment available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
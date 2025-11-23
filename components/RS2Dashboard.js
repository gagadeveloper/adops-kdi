'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RS2Dashboard() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders2');
      if (!response.ok) throw new Error('Gagal mengambil data pesanan');
      const data = await response.json();
      console.log('Fetched orders:', data); // Debug log
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Gagal mengambil data pengguna');
        const data = await response.json();
        setUserRole(data.roleId);
      } catch (error) {
        console.error('Error fetching user:', error.message);
      }
    };

    const initData = async () => {
      await fetchOrders();
      await fetchUserRole();
    };

    initData();

    // Tambahkan listener untuk event kustom setelah penambahan data
    window.addEventListener('orderAdded', fetchOrders);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('orderAdded', fetchOrders);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredOrders = useMemo(
    () => {
      if (!orders || orders.length === 0) return [];
      return orders.filter((order) => (activeTab === 'ongoing' ? !order.invoice_number : order.invoice_number));
    },
    [orders, activeTab]
  );

  const downloadAttachment = async (attachmentPath) => {
    if (!attachmentPath) {
      alert('Tidak ada attachment tersedia');
      return;
    }
    
    try {
      window.open(`/api/download-attachment?path=${encodeURIComponent(attachmentPath)}`, '_blank');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Terjadi kesalahan saat mengunduh attachment');
    }
  };

  const ActionButtons = ({ order }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button 
        onClick={() => router.push(`/dashboard/adopsi/rs2/${order.id}`)} 
        className="btn-primary p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={() => router.push(`/dashboard/adopsi/rs2/edit/${order.id}`)} 
        className="btn-yellow p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      {order.attachment_path && (
        <button 
          onClick={() => downloadAttachment(order.attachment_path)} 
          className="btn-green p-2 rounded bg-green-500 hover:bg-green-600 text-white"
          title="Download Attachment"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // Fungsi untuk refresh data manual
  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Table Hantaran (RS2)</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={() => router.push('/dashboard/adopsi/rs2/add')} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Baru
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md overflow-hidden">        
        {loading ? (
          <p className="p-4 text-center">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">No. Order</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Total Sample</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Attachment</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{order.sample_order_no || '-'}</td>
                      <td className="p-3">{order.client_name || '-'}</td>
                      <td className="p-3">{formatDate(order.date)}</td>
                      <td className="p-3">{order.total_qty || 0}</td>
                      <td className="p-3">{order.phone || '-'}</td>
                      <td className="p-3">{order.address || '-'}</td>
                      <td className="p-3">
                        {order.attachment_path ? (
                          <button
                            onClick={() => downloadAttachment(order.attachment_path)}
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            {order.attachment_name || 'Download'}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <ActionButtons order={order} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
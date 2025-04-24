'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, FileText, Printer, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RS1Dashboard() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

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

    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Gagal mengambil data pengguna');
        const data = await response.json();
        setUserRole(data.roleId);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchUserRole()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const filteredOrders = useMemo(
    () => orders.filter((order) => (activeTab === 'ongoing' ? !order.invoice_number : order.invoice_number)),
    [orders, activeTab]
  );

  const ActionButtons = ({ orderId }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button onClick={() => router.push(`/dashboard/adopsi/rs1/${orderId}`)} className="btn-primary p-2 rounded bg-blue-500 hover:bg-blue-600 text-white">
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={() => router.push(`/dashboard/adopsi/rs1/edit/${orderId}}`)} 
        className="btn-yellow p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard RS1</h1>
        <button
          onClick={() => router.push('/dashboard/adopsi/rs1/add')} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Baru
        </button>
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
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-3">{order.sample_order_no}</td>
                      <td className="p-3">{order.client_name}</td>
                      <td className="p-3">{formatDate(order.date)}</td>
                      <td className="p-3">{order.total_qty}</td>
                      <td className="p-3">{order.phone}</td>
                      <td className="p-3">{order.address}</td>
                      <td className="p-3 text-right">
                        <ActionButtons orderId={order.id} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
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

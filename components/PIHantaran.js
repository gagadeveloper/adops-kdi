'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, FileText, Printer, Edit, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PIHantaran() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [orders, setOrders] = useState([]);
  const [rs1Orders, setRs1Orders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  // Fungsi untuk mengambil data terbaru ketika tab diubah
  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pi_hantaran');
      if (!response.ok) throw new Error('Gagal mengambil data pesanan');
      const data = await response.json();
      setOrders(data);
      
      const rs1Response = await fetch('/api/orders');
      if (!rs1Response.ok) throw new Error('Gagal mengambil data RS1');
      const rs1Data = await rs1Response.json();
      setRs1Orders(rs1Data);
    } catch (error) {
      console.error('Error refreshing data:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/pi_hantaran');
        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchRs1Orders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Gagal mengambil data RS1');
        const data = await response.json();
        setRs1Orders(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) throw new Error('Gagal mengambil data pengguna');
        const data = await response.json();
        setUserRole(data.roleId);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchRs1Orders(), fetchUserRole()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Refresh data setiap kali tab diubah
  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // Filter orders berdasarkan tab yang aktif
  const filteredOrders = useMemo(() => {
    console.log("Filtering orders for tab:", activeTab);
    console.log("Total orders:", orders.length);
    
    return orders.filter((order) => {
      console.log(`Order ${order.id}: status=${order.status}, invoice_number=${order.invoice_number}`);
      
      if (activeTab === 'ongoing') {
        // Order dianggap ongoing jika status bukan 'paid' dan tidak memiliki invoice_number
        const isOngoing = order.status !== 'paid' && !order.invoice_number;
        console.log(`Order ${order.id} is ongoing: ${isOngoing}`);
        return isOngoing;
      }
      return false;
    });
  }, [orders, activeTab]);

  // Fungsi untuk mengubah status order (untuk testing)
  const handleChangeStatus = async (orderId, newStatus) => {
    try {
      // Simulasi update ke API
      console.log(`Changing order ${orderId} status to ${newStatus}`);
      
      // Update state secara lokal untuk demo
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {...order, status: newStatus} 
            : order
        )
      );
      
      // Dalam implementasi sebenarnya, Anda akan memanggil API:
      // await fetch(`/api/pi_hantaran/${orderId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      
      // Refresh data
      refreshData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetail = (orderId, isRS1 = false) => {
    if (isRS1) {
      router.push(`/dashboard/adopsi/pi_hantaran/rs1/${orderId}`);
    } else {
      router.push(`/dashboard/adopsi/pi_hantaran/${orderId}`);
    }
  };

  const PIActionButtons = ({ orderId, status }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button 
        onClick={() => handleViewDetail(orderId)} 
        className="btn-primary p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
        title="Lihat Detail"
      >
        <Eye className="w-4 h-4" />
      </button>
      
      {/* <button 
        onClick={() => router.push(`/dashboard/adopsi/pi_hantaran/edit/${orderId}`)} 
        className="btn-yellow p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button> */}
    </div>
  );

  const RS1ActionButtons = ({ orderId }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button 
        onClick={() => handleViewDetail(orderId, true)} 
        className="btn-primary p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
        title="Lihat Detail"
      >
        <Eye className="w-4 h-4" />
      </button>
      
      <button 
        onClick={() => router.push(`/dashboard/adopsi/pi_hantaran/add?orderId=${orderId}`)} 
        className="btn-green p-2 rounded bg-green-500 hover:bg-green-600 text-white"
        title="Create PI Hantaran"
      >
        <FileText className="w-4 h-4" />
      </button>
      
      <button 
        onClick={() => router.push(`/dashboard/adopsi/pi_hantaran/rs1/edit/${orderId}`)} 
        className="btn-yellow p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Main navigation tabs */}
      <div className="flex space-x-4 my-4">
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('ongoing')}
        >
          PI Hantaran
        </button>
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'rs1' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('rs1')}
        >
          RS1
        </button>
      </div>

      {/* Debug info - Remove in production */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
        <p>Active Tab: {activeTab}</p>
        <p>Total Orders: {orders.length}</p>
        <p>Filtered Orders: {filteredOrders.length}</p>
      </div>

      {/* PI Hantaran Tables (Ongoing & Completed) */}
      {(activeTab === 'ongoing') && (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 font-semibold">Sample Order No</th>
                    <th className="p-3 font-semibold">Invoice No</th>
                    <th className="p-3 font-semibold">Client</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Jumlah</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{order.sample_order_no}</td>
                        <td className="p-3">{order.invoice_no}</td>
                        <td className="p-3">{order.client}</td>
                        <td className="p-3">{formatDate(order.created_at)}</td>
                        <td className="p-3">{order.amount}</td>
                        <td className="p-3">{order.jumlah}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <PIActionButtons orderId={order.id} status={order.status} />
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
      )}

      {/* RS1 Table */}
      {activeTab === 'rs1' && (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 font-semibold">No. Order</th>
                    <th className="p-3 font-semibold">Client</th>
                    <th className="p-3 font-semibold">Tanggal</th>
                    <th className="p-3 font-semibold">Total Sample</th>
                    <th className="p-3 font-semibold">Phone</th>
                    <th className="p-3 font-semibold">Address</th>
                    <th className="p-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rs1Orders.length > 0 ? (
                    rs1Orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{order.sample_order_no}</td>
                        <td className="p-3">{order.client_name}</td>
                        <td className="p-3">{formatDate(order.date)}</td>
                        <td className="p-3">{order.total_qty}</td>
                        <td className="p-3">{order.phone}</td>
                        <td className="p-3">{order.address}</td>
                        <td className="p-3 text-right">
                          <RS1ActionButtons orderId={order.id} />
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
      )}
    </div>
  );
}
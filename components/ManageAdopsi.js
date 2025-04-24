'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Trash, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManageAdopsi() {
  const [activeTab, setActiveTab] = useState('adopsi');
  const [orders, setOrders] = useState([]);
  const [PIHantaranOrders, setPIHantaranOrders] = useState([]);
  const [shipments, setShipments] = useState([]); // New state for shipments
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Gagal mengambil data RS1');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchPIHantaranOrders = async () => {
      try {
        const response = await fetch('/api/pi_hantaran');
        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
        const data = await response.json();
        setPIHantaranOrders(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const fetchShipments = async () => {
      try {
        const response = await fetch('/api/pi_shipment');
        if (!response.ok) throw new Error('Gagal mengambil data shipment');
        const data = await response.json();
        setShipments(data);
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
      await Promise.all([fetchOrders(), fetchPIHantaranOrders(), fetchShipments(), fetchUserRole()]);
      setLoading(false);
    };

    // Ganti dengan fetchData untuk mengambil semua data sekaligus
    fetchData();
  }, []);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredOrders = useMemo(
    () => orders.filter((order) => (activeTab === 'adopsi' ? !order.invoice_number : order.invoice_number)),
    [orders, activeTab]
  );

  // Komponen untuk tombol aksi PI Hantaran
  const PIActionButtons = ({ orderId, status }) => {
    return (
      <div className="flex gap-2 justify-end">
        <button onClick={() => router.push(`/dashboard/manage-adopsi/pi_hantaran/${orderId}`)} className="btn-primary">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => router.push(`/dashboard/adopsi/pi_hantaran/edit/${orderId}`)} className="btn-warning">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => handleDeletePIHantaran(orderId)} className="btn-danger">
          <Trash className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Komponen untuk tombol aksi PI Shipment
  const ShipmentActionButtons = ({ shipmentId }) => {
    return (
      <div className="flex gap-2 justify-end">
        <button onClick={() => router.push(`/dashboard/manage-adopsi/pi_shipment/${shipmentId}`)} className="btn-primary">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => router.push(`/dashboard/adopsi/pi_shipment/edit/${shipmentId}`)} className="btn-warning">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => handleDeletePIShipment(shipmentId)} className="btn-danger">
          <Trash className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const handleEdit = (id) => {
    router.push(`/dashboard/manage-adopsi/rs1/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus order ini?')) return;

    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Gagal menghapus order');

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
      alert('Order berhasil dihapus');
    } catch (error) {
      console.error('Error:', error.message);
      alert('Gagal menghapus order');
    }
  };

  const handleDeletePIHantaran = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus PI ini?')) return;

    try {
      const response = await fetch(`/api/pi_hantaran/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Gagal menghapus PI');

      setPIHantaranOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
      alert('PI berhasil dihapus');
    } catch (error) {
      console.error('Error:', error.message);
      alert('Gagal menghapus PI');
    }
  };

  const handleDeletePIShipment = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus PI ini?')) return;
  
    try {
      const response = await fetch(`/api/pi_shipment/${id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) throw new Error('Gagal menghapus PI');
  
      setShipments((prevShipments) => prevShipments.filter((shipment) => shipment.id !== id));
      alert('PI berhasil dihapus');
    } catch (error) {
      console.error('Error:', error.message);
      alert('Gagal menghapus PI');
    }
  };

  const handleAddShipment = () => {
    router.push('/dashboard/adopsi/pi_shipment/add');
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold">Manage Adopsi</h1>
      <text>Dashboard Manage Adops by Admin</text>

      <div className="flex space-x-4 my-4">
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'adopsi' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('adopsi')}
        >
          Adopsi
        </button>
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'pi_hantaran' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('pi_hantaran')}
        >
          PI Hantaran
        </button>
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === 'pi_shipment' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setActiveTab('pi_shipment')}
        >
          PI Shipment
        </button>
      </div>

      {/* PI Shipment Table */}
      {activeTab === 'pi_shipment' && (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <div className="p-4 flex justify-end">
            <button
              onClick={handleAddShipment}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Baru
            </button>
          </div>
          
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
                    <th className="p-3 font-semibold">ID Shipment</th>
                    <th className="p-3 font-semibold">Pembayaran</th>
                    <th className="p-3 font-semibold">Client</th>
                    <th className="p-3 font-semibold">Invoice</th>
                    <th className="p-3 font-semibold">Tanggal</th>
                    <th className="p-3 font-semibold">Jumlah</th>
                    <th className="p-3 font-semibold">PPN</th>
                    <th className="p-3 font-semibold">Total</th>
                    <th className="p-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.length > 0 ? (
                    shipments.map((shipment) => (
                      <tr key={shipment.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{shipment.id_shipment}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            shipment.jenis_pembayaran === 'DP' ? 'bg-yellow-100 text-yellow-800' : 
                            shipment.jenis_pembayaran === 'Pelunasan' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {shipment.jenis_pembayaran}
                          </span>
                        </td>
                        <td className="p-3">{shipment.client}</td>
                        <td className="p-3">{shipment.no_invoice || '-'}</td>
                        <td className="p-3">{formatDate(shipment.date)}</td>
                        <td className="p-3">{formatCurrency(shipment.jumlah)}</td>
                        <td className="p-3">{formatCurrency(shipment.ppn)}</td>
                        <td className="p-3">{formatCurrency(shipment.total)}</td>
                        <td className="p-3 text-right">
                          <ShipmentActionButtons shipmentId={shipment.id} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-500">
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

      {/* PI Hantaran Table */}
      {activeTab === 'pi_hantaran' && (
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
                    <th className="p-3 font-semibold">Client</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Jumlah</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {PIHantaranOrders.length > 0 ? (
                    PIHantaranOrders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{order.sample_order_no}</td>
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

      {/* Adopsi Table */}
      {activeTab === 'adopsi' && (
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
                        <td className="p-3 text-right flex gap-2 justify-end">
                          <button onClick={() => router.push(`/dashboard/manage-adopsi/rs1/${order.id}`)} className="btn-primary">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(order.id)} className="btn-warning">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(order.id)} className="btn-danger">
                            <Trash className="w-4 h-4" />
                          </button>
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
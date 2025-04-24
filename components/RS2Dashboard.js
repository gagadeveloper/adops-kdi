'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, FileText, Printer, Edit, Search, Calendar, Clipboard, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RS1Dashboard() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
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

  // Handle clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setSearchTerm(clipboardText.trim());
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Gagal membaca clipboard. Pastikan Anda memberikan izin untuk mengakses clipboard.');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Filter orders based on search term and dates
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by ongoing/completed status
      const statusMatch = activeTab === 'ongoing' ? !order.invoice_number : order.invoice_number;
      
      // Filter by search term (check multiple fields)
      const searchMatch = searchTerm === '' || 
        (order.sample_order_no && order.sample_order_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.client_name && order.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by date range
      let dateMatch = true;
      if (startDate && endDate) {
        const orderDate = new Date(order.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        dateMatch = orderDate >= start && orderDate <= end;
      } else if (startDate) {
        const orderDate = new Date(order.date);
        const start = new Date(startDate);
        dateMatch = orderDate >= start;
      } else if (endDate) {
        const orderDate = new Date(order.date);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = orderDate <= end;
      }
      
      return statusMatch && searchMatch && dateMatch;
    });
  }, [orders, activeTab, searchTerm, startDate, endDate]);

  const ActionButtons = ({ orderId }) => (
    <div className="flex flex-wrap justify-end gap-2">
      <button 
        onClick={() => router.push(`/dashboard/adopsi/rs2/${orderId}`)} 
        className="btn-primary p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
        title="Lihat detail"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button 
        onClick={() => router.push(`/dashboard/adopsi/rs2/edit/${orderId}}`)} 
        className="btn-yellow p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        title="Create RS2"
      >
        <FileText className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold">Dashboard RS2</h1>
      
      {/* Search and Filter Section */}
      <div className="my-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search Input with Paste Button */}
          <div className="flex-1 flex items-center gap-2 min-w-64">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nomor order atau client..."
                className="w-full p-2 pr-10 border rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={handlePasteFromClipboard}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
              <span className="hidden sm:inline">Paste</span>
            </button>
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-2 rounded-md flex items-center gap-1 ${showDateFilter ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Toggle date filter"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Tanggal</span>
            </button>
            {(searchTerm || startDate || endDate) && (
              <button 
                onClick={clearFilters}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md flex items-center gap-1"
                title="Clear filters"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Date Range Filter */}
        {showDateFilter && (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-1 gap-2 min-w-64">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>

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
                    <tr key={order.id} className="border-t hover:bg-gray-50">
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
'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PIShipment() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/pi_shipment');
        if (!response.ok) throw new Error('Gagal mengambil data shipment');
        const data = await response.json();
        setShipments(data);
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
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

  const handleViewDetail = (shipmentId) => {
    router.push(`/dashboard/adopsi/pi_shipment/${shipmentId}`);
  };

  const handleEdit = (shipmentId) => {
    router.push(`/dashboard/adopsi/pi_shipment/edit/${shipmentId}`);
  };

  const handleAdd = () => {
    router.push('/dashboard/adopsi/pi_shipment/add');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Proforma Invoice Shipment</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Baru
        </button>
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
                        <div className="flex flex-wrap justify-end gap-2">
                          <button 
                            onClick={() => handleViewDetail(shipment.id)} 
                            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => handleEdit(shipment.id)} 
                            className="p-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
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
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Edit, FileUp, Download, CreditCard, FileText, Copy, Check } from 'lucide-react';
import PrintPIShipmentModal from "@/components/pdf/PrintPIShipmentModal";

export default function PIShipmentDetail({ params }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shipmentId, setShipmentId] = useState("");
  const router = useRouter();
  const paramId = params.id;

  useEffect(() => {
    const fetchShipmentDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/pi_shipment/${paramId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data detail shipment');
        }
        const data = await response.json();
        setShipment(data);
      } catch (error) {
        console.error('Error:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (paramId) {
      fetchShipmentDetail();
    }
  }, [paramId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDecimal = (value) => {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);
  };

  const handlePrint = () => {
    if (shipment && shipment.id_shipment) {
      setShipmentId(shipment.id_shipment);
      setIsModalOpen(true);
    } else {
      console.error("Shipment ID not available");
      alert("Shipment ID not available");
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Perhatian! </strong>
          <span className="block sm:inline">Data shipment tidak ditemukan.</span>
        </div>
        <button 
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detail PI Shipment</h1>
        <div className="flex gap-2">
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Kembali
          </button>
          <button
            onClick={handlePrint} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak PI
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Informasi Umum</h2>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                shipment.jenis_pembayaran === 'DP' ? 'bg-yellow-100 text-yellow-800' : 
                shipment.jenis_pembayaran === 'Pelunasan' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {shipment.jenis_pembayaran}
              </span>
            </div>
            <hr className="mb-4" />
          </div>

          <div>
            <p className="text-sm text-gray-500">ID Shipment</p>
            <p className="font-medium">{shipment.id_shipment || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Tanggal</p>
            <p className="font-medium">{formatDate(shipment.date)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium">{shipment.client || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Nomor Invoice</p>
            <p className="font-medium">{shipment.no_invoice || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Jenis Pekerjaan</p>
            <p className="font-medium">{shipment.jenis_pekerjaan || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Lokasi</p>
            <p className="font-medium">{shipment.lokasi || '-'}</p>
          </div>

          {shipment.jenis_pembayaran !== 'DP' && (
            <div>
              <p className="text-sm text-gray-500">Nomor CO</p>
              <p className="font-medium">{shipment.no_co || '-'}</p>
            </div>
          )}

          <div className="col-span-2 mt-4">
            <h2 className="text-xl font-semibold mb-4">Informasi Biaya</h2>
            <hr className="mb-4" />
          </div>

          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="font-medium">{formatDecimal(shipment.quantity)} MT</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Harga per MT</p>
            <p className="font-medium">{formatCurrency(shipment.harga_per_mt)}</p>
          </div>

          {shipment.jenis_pembayaran !== 'DP' && (
            <div>
              <p className="text-sm text-gray-500">Biaya Tambahan</p>
              <p className="font-medium">{formatCurrency(shipment.add_cost_amount)}</p>
            </div>
          )}

          {shipment.jenis_pembayaran !== 'DP' && (
            <div>
              <p className="text-sm text-gray-500">DP</p>
              <p className="font-medium">{formatCurrency(shipment.dp)}</p>
            </div>
          )}

          <div className="col-span-2 mt-4">
            <h2 className="text-xl font-semibold mb-4">Deskripsi</h2>
            <hr className="mb-4" />
            <p className="whitespace-pre-wrap">{shipment.description || '-'}</p>
          </div>

          <div className="col-span-2 mt-6">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700 mb-3">Rincian Biaya</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Jumlah</label>
                  <p className="text-lg font-medium">{formatCurrency(shipment.jumlah)}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">PPN (11%)</label>
                  <p className="text-lg font-medium">{formatCurrency(shipment.ppn)}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Total</label>
                  <p className="text-lg font-medium">{formatCurrency(shipment.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrintPIShipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentid={shipmentId}
      />
    </div>
  );
}
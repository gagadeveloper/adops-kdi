'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditPIShipment() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params?.id;

  const [formData, setFormData] = useState({
    id_shipment: '',
    client: '',
    no_invoice: '',
    date: '',
    description: '',
    jumlah: 0,
    jenis_pembayaran: 'Full Payment',
    quantity: 0,
    jenis_pekerjaan: '',
    lokasi: '',
    no_co: '',
    harga_per_mt: 0,
    add_cost_amount: 0,
    dp: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!shipmentId) return;

    const fetchShipmentDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/pi_shipment/${shipmentId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data shipment');
        }
        const data = await response.json();
        
        // Format date untuk input date (YYYY-MM-DD)
        const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
        
        setFormData({
          id_shipment: data.id_shipment || '',
          client: data.client || '',
          no_invoice: data.no_invoice || '',
          date: formattedDate,
          description: data.description || '',
          jumlah: data.jumlah || 0,
          jenis_pembayaran: data.jenis_pembayaran || 'Full Payment',
          quantity: data.quantity || 0,
          jenis_pekerjaan: data.jenis_pekerjaan || '',
          lokasi: data.lokasi || '',
          no_co: data.no_co || '',
          harga_per_mt: data.harga_per_mt || 0,
          add_cost_amount: data.add_cost_amount || 0,
          dp: data.dp || 0
        });
      } catch (error) {
        console.error('Error:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShipmentDetails();
  }, [shipmentId]);

  // Calculate jumlah whenever relevant fields change
  useEffect(() => {
    calculateJumlah();
  }, [formData.harga_per_mt, formData.quantity, formData.jenis_pembayaran, formData.dp, formData.add_cost_amount]);

  const calculateJumlah = () => {
    let calculatedJumlah = 0;
    
    // Base calculation: price per MT * quantity
    if (formData.harga_per_mt && formData.quantity) {
      calculatedJumlah = parseFloat(formData.harga_per_mt) * parseFloat(formData.quantity);
    }
    
    // For DP payment type, take 50%
    if (formData.jenis_pembayaran === 'DP') {
      calculatedJumlah = calculatedJumlah * 0.5;
    }
    
    // For Pelunasan or Full Payment, include additional costs if present
    if (formData.jenis_pembayaran === 'Pelunasan' || formData.jenis_pembayaran === 'Full Payment') {
      // Add the add_cost_amount if it exists
      if (formData.add_cost_amount) {
        calculatedJumlah += parseFloat(formData.add_cost_amount);
      }
      
      // For Pelunasan, subtract DP if it exists
      if (formData.jenis_pembayaran === 'Pelunasan' && formData.dp) {
        calculatedJumlah -= parseFloat(formData.dp);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      jumlah: calculatedJumlah
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For numeric fields, ensure they're valid
    if (['jumlah', 'quantity', 'harga_per_mt', 'add_cost_amount', 'dp'].includes(name)) {
      // Remove all non-numeric characters except decimal point
      processedValue = value.replace(/[^\d.]/g, '');
      
      // Convert to number if needed but leave as string for display
      if (processedValue !== '') {
        processedValue = processedValue;
      }
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  // New description generation logic
  const generateDescription = () => {
    // Format harga_per_mt with thousand separators and 2 decimal places
    const formattedHargaPerMt = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(formData.harga_per_mt);
    
    // Format the quantity with thousand separators and 3 decimal places
    const formattedQuantity = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(parseFloat(formData.quantity) || 0);
    
    // Format add_cost_amount with currency format
    const formattedAddCost = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(formData.add_cost_amount);
    
    let description = '';
    
    if (formData.jenis_pembayaran === 'DP') {
      description = `Biaya Uang Muka (DP 50%) Jasa Pekerjaan ${formData.jenis_pekerjaan}, Qty ${formattedQuantity} WMT, ${formData.client}, Lokasi ${formData.lokasi}, (Harga/MT @Rp. ${formattedHargaPerMt},-).`;
    } else {
      // For Pelunasan or Full Payment
      const addCostText = parseFloat(formData.add_cost_amount) > 0
        ? ` Add cost : ${formattedAddCost}`
        : '';
      
      description = `Biaya ${formData.jenis_pembayaran === 'Pelunasan' ? 'Pelunasan' : 'Full Payment'} Jasa Pekerjaan ${formData.jenis_pekerjaan}, No-CO ${formData.no_co || 'CO-XXXXX'}, Lokasi ${formData.lokasi}, Qty ${formattedQuantity} MT, ${formData.client}, (Harga/MT@ Rp. ${formattedHargaPerMt},.)${addCostText}`;
    }
    
    return description;
  };

  // Update description when relevant fields change
  useEffect(() => {
    const newDescription = generateDescription();
    setFormData(prev => ({
      ...prev,
      description: newDescription
    }));
  }, [
    formData.jenis_pembayaran,
    formData.jenis_pekerjaan,
    formData.lokasi,
    formData.quantity,
    formData.harga_per_mt,
    formData.client,
    formData.no_co,
    formData.add_cost_amount
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Calculate PPN and total
      const calculatedJumlah = parseFloat(formData.jumlah);
      const ppn = calculatedJumlah * 0.11;
      const total = calculatedJumlah + ppn;

      const dataToSend = {
        ...formData,
        jumlah: calculatedJumlah,
        ppn: ppn,
        total: total
      };

      console.log('Data yang dikirim:', dataToSend);

      const response = await fetch(`/api/pi_shipment/${shipmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      // Cek status HTTP terlebih dahulu
      if (!response.ok) {
        // Coba baca text response terlebih dahulu
        const responseText = await response.text();
        
        // Cek apakah responseText berisi JSON valid
        let errorMessage = `HTTP Error: ${response.status}`;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // Jika parsing gagal, gunakan responseText sebagai error message
            errorMessage = responseText || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Cek apakah ada content sebelum parse JSON
      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};

      setSuccessMessage('Data berhasil diperbarui');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/manage-adopsi/pi_shipment');
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading data...</p>
        </div>
      </div>
    );
  }

  // Determine which fields should be shown based on payment type
  const showNoCO = formData.jenis_pembayaran !== 'DP';
  const showDP = formData.jenis_pembayaran !== 'DP';
  const showAddCost = formData.jenis_pembayaran !== 'DP';

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link href="/dashboard/manage-adopsi/pi_shipment" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
        </Link>
      </div>
      
      <div className="bg-white rounded-md shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Proforma Invoice Shipment</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
            <p>{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="id_shipment" className="block text-sm font-medium text-gray-700 mb-1">
                ID Shipment
              </label>
              <input
                id="id_shipment"
                name="id_shipment"
                type="text"
                value={formData.id_shipment}
                onChange={handleChange}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <input
                id="client"
                name="client"
                type="text"
                value={formData.client}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="no_invoice" className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Invoice
              </label>
              <input
                id="no_invoice"
                name="no_invoice"
                type="text"
                value={formData.no_invoice}
                onChange={handleChange}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="jenis_pekerjaan" className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Pekerjaan
              </label>
              <input
                id="jenis_pekerjaan"
                name="jenis_pekerjaan"
                type="text"
                value={formData.jenis_pekerjaan || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi
              </label>
              <input
                id="lokasi"
                name="lokasi"
                type="text"
                value={formData.lokasi || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {showNoCO && (
              <div>
                <label htmlFor="no_co" className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor CO
                </label>
                <input
                  id="no_co"
                  name="no_co"
                  type="text"
                  value={formData.no_co || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {showDP && (
              <div>
                <label htmlFor="dp" className="block text-sm font-medium text-gray-700 mb-1">
                  DP
                </label>
                <input
                  id="dp"
                  name="dp"
                  type="text"
                  value={formData.dp || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="jenis_pembayaran" className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Pembayaran
              </label>
              <select
                id="jenis_pembayaran"
                name="jenis_pembayaran"
                value={formData.jenis_pembayaran}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Full Payment">Full Payment</option>
                <option value="DP">DP</option>
                <option value="Pelunasan">Pelunasan</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah (Rp)
              </label>
              <input
                id="jumlah"
                name="jumlah"
                type="text"
                value={parseFloat(formData.jumlah || 0).toLocaleString('id-ID')}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">
                PPN (11%): Rp. {(formData.jumlah * 0.11).toLocaleString('id-ID')}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Total: Rp. {(formData.jumlah * 1.11).toLocaleString('id-ID')}
              </p>
            </div>
            
            <div>
              <label htmlFor="harga_per_mt" className="block text-sm font-medium text-gray-700 mb-1">
                Harga per MT
              </label>
              <input
                id="harga_per_mt"
                name="harga_per_mt"
                type="text"
                value={formData.harga_per_mt || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                step="0.001"
              />
            </div>
            
            {showAddCost && (
              <div>
                <label htmlFor="add_cost_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Biaya Tambahan
                </label>
                <input
                  id="add_cost_amount"
                  name="add_cost_amount"
                  type="text"
                  value={formData.add_cost_amount || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              readOnly
              className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/manage-adopsi/pi_shipment"
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
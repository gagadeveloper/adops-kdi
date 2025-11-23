'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddPIShipment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    jenis_pembayaran: 'DP', // Default value
    jenis_pekerjaan: '',
    lokasi: '',
    no_invoice: '',
    no_co: '',
    date: new Date().toISOString().split('T')[0], // Current date as default
    quantity: 0,
    qty: '',
    harga_per_mt: 0,
    description: '',
    add_cost_amount: 0,
    dp: 0,
    jumlah: 0,
    ppn: 0,
    total: 0
  });

  const [errors, setErrors] = useState({});
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const response = await fetch('/api/clients_shipment');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data);
        setFilteredClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Generate invoice number on component mount
  useEffect(() => {
    const initializeInvoiceNumber = async () => {
      await generateInvoiceNumber();
    };
    
    initializeInvoiceNumber();
  }, []);

  // Generate description when relevant fields change
  useEffect(() => {
    generateDescription();
  }, [
    formData.jenis_pembayaran,
    formData.client,
    formData.jenis_pekerjaan,
    formData.lokasi,
    formData.quantity,
    formData.harga_per_mt,
    formData.no_co,
    formData.add_cost_amount
  ]);

  // Filter clients when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  // Generate invoice number based on date
  const generateInvoiceNumber = async () => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month (01-12)
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    
    setLoading(true);
    try {
      // Fetch the latest sequence number from the server
      const response = await fetch('/api/pi_shipment?action=getNextInvoiceNumber');
      if (!response.ok) {
        throw new Error('Failed to get next invoice number');
      }
      
      const data = await response.json();
      const nextSequenceNumber = data.nextSequenceNumber.toString().padStart(4, '0');
      
      const invoiceNumber = `INVMKS-${nextSequenceNumber}/DBSCM/${month}/${year}`;
      
      setFormData(prev => ({
        ...prev,
        no_invoice: invoiceNumber
      }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to a placeholder if API call fails
      const fallbackNumber = '0001';
      const invoiceNumber = `INVMKS-${fallbackNumber}/DBSCM/${month}/${year}`;
      
      setFormData(prev => ({
        ...prev,
        no_invoice: invoiceNumber
      }));
    } finally {
      setLoading(false);
    }
  };

  // Generate description based on form fields
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
      // For Pelunasan or Lumpsum
      const addCostText = formData.add_cost_amount > 0 
        ? ` Add cost : ${formattedAddCost}`
        : '';
      
      description = `Biaya ${formData.jenis_pembayaran === 'Pelunasan' ? 'Pelunasan' : 'Full Payment'} Jasa Pekerjaan ${formData.jenis_pekerjaan}, No-CO ${formData.no_co || 'CO-XXXXX'}, Lokasi ${formData.lokasi}, Qty ${formattedQuantity} MT, ${formData.client}, (Harga/MT@ Rp. ${formattedHargaPerMt},.)${addCostText}`;
    }
    
    setFormData(prev => ({
      ...prev,
      description: description
    }));
  };

  // Reset fields when jenis_pembayaran changes
  const handlePaymentTypeChange = (e) => {
    const { value } = e.target;
    
    // Reset fields that depend on payment type
    setFormData(prev => {
      const updatedData = {
        ...prev,
        jenis_pembayaran: value,
        // Reset DP to 0 for DP payment type
        dp: value === 'DP' ? 0 : prev.dp,
        no_co: '',
        add_cost_amount: 0
      };
      
      // Recalculate total after changing payment type
      calculateTotal();
      
      return updatedData;
    });
    
    // Clear errors
    if (errors.jenis_pembayaran) {
      setErrors(prev => ({
        ...prev,
        jenis_pembayaran: null
      }));
    }
  };

  const calculateTotal = () => {
    // Convert input values to numbers and handle NaN
    const quantity = parseFloat(formData.quantity) || 0;
    const hargaPerMt = parseFloat(formData.harga_per_mt) || 0;
    const addCost = parseFloat(formData.add_cost_amount) || 0;
    const dp = parseFloat(formData.dp) || 0;
    
    // Calculate jumlah (subtotal)
    const jumlah = (quantity * hargaPerMt) + addCost;
    
    // Calculate PPN (11% of jumlah)
    const ppn = jumlah * 0.11;
    
    // Calculate total based on payment type
    let total;
    switch (formData.jenis_pembayaran) {
      case 'DP':
        // For DP, total is the full amount
        total = jumlah + ppn;
        break;
      case 'Pelunasan':
        // For Pelunasan, subtract previous DP
        total = jumlah + ppn - dp;
        break;
      case 'Lumpsum':
        // For Lumpsum, subtract DP if it exists
        total = jumlah + ppn - dp;
        break;
      default:
        total = jumlah + ppn;
    }
    
    // Ensure total is not negative
    total = Math.max(total, 0);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      jumlah: jumlah,
      ppn: ppn,
      total: total
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [
    formData.jenis_pembayaran,
    formData.quantity,
    formData.harga_per_mt,
    formData.add_cost_amount,
    formData.dp
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleClientSearch = (e) => {
    setSearchTerm(e.target.value);
    
    // If search is empty and client field is not, keep the current selection
    if (e.target.value === '' && formData.client !== '') {
      return;
    }
    
    // Set the search term as the client value for temporary display
    setFormData(prev => ({
      ...prev,
      client: e.target.value
    }));
    
    // Show dropdown when searching
    setShowDropdown(true);
    
    // Clear client error if exists
    if (errors.client) {
      setErrors(prev => ({
        ...prev,
        client: null
      }));
    }
  };

  const handleClientSelect = (clientName) => {
    setFormData(prev => ({
      ...prev,
      client: clientName
    }));
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers or empty strings
    const numericValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle change for quantity with comma decimal format
  const handleQuantityChange = (e) => {
    const { value } = e.target;
    
    // Allow input with comma as decimal separator
    const sanitizedValue = value.replace(/,/g, '.');
    
    // Check if the value is a valid number
    if (sanitizedValue === '' || !isNaN(parseFloat(sanitizedValue))) {
      setFormData(prev => ({
        ...prev,
        quantity: sanitizedValue
      }));
      
      // Clear error
      if (errors.quantity) {
        setErrors(prev => ({
          ...prev,
          quantity: null
        }));
      }
    }
  };

  const handleBlur = () => {
    // Ensure quantity is a valid number for calculations
    const quantityValue = parseFloat(formData.quantity) || 0;
    setFormData(prev => ({
      ...prev,
      quantity: quantityValue
    }));
    
    calculateTotal();
  };

  const handleClientInputBlur = () => {
    // Hide dropdown after a short delay to allow click events on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.client) newErrors.client = 'Client harus diisi';
    if (!formData.jenis_pembayaran) newErrors.jenis_pembayaran = 'Jenis pembayaran harus dipilih';
    if (!formData.jenis_pekerjaan) newErrors.jenis_pekerjaan = 'Jenis pekerjaan harus diisi';
    if (!formData.lokasi) newErrors.lokasi = 'Lokasi harus diisi';
    if (!formData.date) newErrors.date = 'Tanggal harus diisi';
    if (!formData.quantity) newErrors.quantity = 'Quantity harus diisi';
    if (!formData.harga_per_mt) newErrors.harga_per_mt = 'Harga per MT harus diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Recalculate totals before submission
    calculateTotal();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/pi_shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan data');
      }
      
      // Success - redirect to list page
      router.push('/dashboard/adopsi/pi_shipment');
      
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  const handleCancel = () => {
    router.push('/dashboard/adopsi/pi_shipment');
  };

  // Determine which fields to show based on payment type
  const showDpField = formData.jenis_pembayaran !== 'DP';
  const showNoCoField = formData.jenis_pembayaran !== 'DP';
  const showAddCostField = formData.jenis_pembayaran !== 'DP';

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tambah PI Shipment Baru</h1>
      </div>

      <div className="bg-white shadow-md rounded-md p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Dropdown */}
            <div className="col-span-2 md:col-span-1">
              <label className="block mb-2 font-medium text-gray-700">Client <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleClientSearch}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={handleClientInputBlur}
                  className={`w-full p-2 border ${errors.client ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Cari atau tulis nama client..."
                  autoComplete="off"
                />
                {isLoadingClients && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto border border-gray-300">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-blue-50 cursor-pointer"
                          onMouseDown={() => handleClientSelect(client.name)}
                        >
                          {client.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500">
                        {isLoadingClients ? 'Loading...' : 'Tidak ada client yang cocok'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.client && <p className="mt-1 text-sm text-red-500">{errors.client}</p>}
            </div>

            {/* Jenis Pembayaran */}
            <div className="col-span-2 md:col-span-1">
              <label className="block mb-2 font-medium text-gray-700">Jenis Pembayaran <span className="text-red-500">*</span></label>
              <select
                name="jenis_pembayaran"
                value={formData.jenis_pembayaran}
                onChange={handlePaymentTypeChange}
                className={`w-full p-2 border ${errors.jenis_pembayaran ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="DP">DP</option>
                <option value="Pelunasan">Pelunasan</option>
                <option value="Lumpsum">Full Payment</option>
              </select>
              {errors.jenis_pembayaran && <p className="mt-1 text-sm text-red-500">{errors.jenis_pembayaran}</p>}
            </div>

            {/* No Invoice */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">No Invoice</label>
              <input
                type="text"
                name="no_invoice"
                value={formData.no_invoice}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nomor Invoice"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Nomor invoice digenerate otomatis</p>
            </div>

            {/* No CO - Only shown if jenis_pembayaran is not DP */}
            {showNoCoField && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">No CO</label>
                <input
                  type="text"
                  name="no_co"
                  value={formData.no_co}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nomor CO"
                />
              </div>
            )}

            {/* Jenis Pekerjaan */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Jenis Pekerjaan <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="jenis_pekerjaan"
                value={formData.jenis_pekerjaan}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.jenis_pekerjaan ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Jenis Pekerjaan"
              />
              {errors.jenis_pekerjaan && <p className="mt-1 text-sm text-red-500">{errors.jenis_pekerjaan}</p>}
            </div>

            {/* Lokasi */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Lokasi <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.lokasi ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Lokasi"
              />
              {errors.lokasi && <p className="mt-1 text-sm text-red-500">{errors.lokasi}</p>}
            </div>

            {/* Tanggal */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Tanggal <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                onBlur={handleBlur}
                className={`w-full p-2 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Contoh: 100 atau 100,333"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
              <p className="mt-1 text-xs text-gray-500">Masukkan angka dengan koma atau titik sebagai pemisah desimal</p>
            </div>

            {/* Harga per MT */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Harga per MT <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="harga_per_mt"
                value={formData.harga_per_mt}
                onChange={handleNumberChange}
                onBlur={handleBlur}
                className={`w-full p-2 border ${errors.harga_per_mt ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                min="0"
                step="0.01"
              />
              {errors.harga_per_mt && <p className="mt-1 text-sm text-red-500">{errors.harga_per_mt}</p>}
            </div>

            {/* Additional Cost - Only shown if jenis_pembayaran is not DP */}
            {showAddCostField && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">Biaya Tambahan</label>
                <input
                  type="number"
                  name="add_cost_amount"
                  value={formData.add_cost_amount}
                  onChange={handleNumberChange}
                  onBlur={handleBlur}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Description */}
            <div className="col-span-2">
              <label className="block mb-2 font-medium text-gray-700">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deskripsi tambahan"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">Deskripsi digenerate otomatis berdasarkan data yang diinput</p>
            </div>

            {/* DP - Only shown if jenis_pembayaran is not DP */}
            {showDpField && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">DP</label>
                <input
                  type="number"
                  name="dp"
                  value={formData.dp}
                  onChange={handleNumberChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Calculations Display */}
            <div className="col-span-2">
              <div className="p-4 bg-gray-50 rounded-md mt-4">
                <h3 className="font-medium text-gray-700 mb-3">Rincian Biaya</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">Jumlah</label>
                    <p className="text-lg font-medium">{formatCurrency(formData.jumlah)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">PPN (11%)</label>
                    <p className="text-lg font-medium">{formatCurrency(formData.ppn)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Total</label>
                    <p className="text-lg font-medium">{formatCurrency(formData.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
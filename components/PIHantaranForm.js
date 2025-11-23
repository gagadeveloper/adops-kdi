'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function PIHantaranForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [formData, setFormData] = useState({
    sample_order_no: '',
    client: '',
    description: '',
    amount: 0,
    jumlah: 0,
    ppn: 0,
    total: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [samples, setSamples] = useState([]);
  
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Order ID tidak ditemukan');
      return;
    }
    
    const fetchOrderData = async () => {
      try {
        // Fetch order details
        console.log('Fetching order data for ID:', orderId);
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          throw new Error(`Gagal mengambil data order: ${orderResponse.status} - ${errorText}`);
        }
        const orderData = await orderResponse.json();
        
        // Fetch all clients to find the matching one
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) {
          const errorText = await clientsResponse.text();
          throw new Error(`Gagal mengambil data clients: ${clientsResponse.status} - ${errorText}`);
        }
        const clientsData = await clientsResponse.json();
        
        // Find the client that matches the order's sender
        const clientData = clientsData.find(client => client.id === orderData.sender) || 
                          { name: orderData.client_name || 'Unknown Client' };
        
        // Fetch samples for this order
        console.log('Fetching samples for order ID:', orderId);
        const samplesResponse = await fetch(`/api/samples?orderId=${orderId}`);
        
        console.log('Samples response status:', samplesResponse.status);
        
        if (!samplesResponse.ok) {
          const errorText = await samplesResponse.text();
          console.error('Samples API error:', errorText);
          throw new Error(`Gagal mengambil data samples: ${samplesResponse.status} - ${errorText}`);
        }
        
        const samplesData = await samplesResponse.json();
        console.log('Samples data received:', samplesData);
        setSamples(samplesData);

        // Check each sample to make sure mc_analysis is properly set
        samplesData.forEach(sample => {
          console.log('Sample MC Analysis value:', sample.mc_analysis, 
                      'Method string:', sample.method_of_analysis);
        });
        
        // Handle case when samples are empty
        if (!Array.isArray(samplesData) || samplesData.length === 0) {
          console.warn('Tidak ada sample ditemukan untuk order ini');
          setFormData({
            sample_order_no: orderData.sample_order_no,
            client: clientData.name,
            description: `Analisa Sample Order ${orderData.sample_order_no}`,
            amount: 0,
            jumlah: 0,
            ppn: 0,
            total: 0
          });
        } else {
          // Generate description
          const description = generateDescription(samplesData);
          
          // Calculate amount based on samples
          const calculatedAmount = calculateTotalAmount(samplesData);
          
          // Set form data
          setFormData({
            sample_order_no: orderData.sample_order_no,
            client: clientData.name,
            description: description,
            amount: calculatedAmount,
            jumlah: calculatedAmount,
            ppn: calculatedAmount * 0.11, // 11% PPN
            total: calculatedAmount * 1.11 // Total including PPN
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId]);
  
  // Fungsi untuk menghasilkan deskripsi
  const generateDescription = (samples) => {
    if (!samples || samples.length === 0) return '';
    
    // Group samples using the same logic as in calculateTotalAmount
    const groupedSamples = {};
    samples.forEach(sample => {
      const quantity = sample.quantity || 1;
      const methodString = sample.method_of_analysis || '';
      
      const key = `${sample.commodity}|${sample.type_size || 'Standard'}|${methodString}|${sample.mc_analysis ? 'MC' : 'noMC'}`;
      
      if (!groupedSamples[key]) {
        groupedSamples[key] = {
          commodity: sample.commodity || '',
          type_size: sample.type_size || '',
          method: methodString,
          mc_analysis: sample.mc_analysis || false,
          count: 0
        };
      }
      
      groupedSamples[key].count += quantity;
    });
    
    // Create descriptions from the grouped samples
    const descriptions = Object.values(groupedSamples).map(group => {
      let desc = `Analisa ${group.count} Sample ${group.commodity}`;
      
      if (group.type_size) {
        desc += ` ${group.type_size}`;
      }
      
      if (group.method) {
        desc += ` dengan metode ${group.method}`;
      }
      
      return desc;
    });
    
    return descriptions.join('. ');
  };
  
  // Fungsi untuk menghitung total amount berdasarkan samples
  const calculateTotalAmount = (samples) => {
    // Group samples based on commodity, type, and method combination
    const groupedSamples = {};
    
    samples.forEach(sample => {
      // Get the quantity from sample or default to 1
      const quantity = sample.quantity || 1;
      
      // Get all methods - this should be a string like "Press Pellet, MC Analysis"
      const methodString = sample.method_of_analysis || '';
      
      // Log each sample for debugging
      console.log('Processing sample for amount calculation:', {
        commodity: sample.commodity,
        type_size: sample.type_size,
        method_string: methodString,
        mc_analysis: sample.mc_analysis,
        quantity: quantity
      });
      
      // Create a consistent key that includes all the relevant sample properties
      // Important: Make sure mc_analysis is a boolean value
      const hasMC = sample.mc_analysis === true || 
                    sample.mc_analysis === 'true' || 
                    methodString.includes('MC Analysis');
                    
      const key = `${sample.commodity}|${sample.type_size || 'Standard'}|${methodString}|${hasMC ? 'MC' : 'noMC'}`;
      
      if (!groupedSamples[key]) {
        groupedSamples[key] = {
          commodity: sample.commodity || '',
          type_size: sample.type_size || '',
          method: methodString,
          mc_analysis: hasMC,
          count: 0
        };
      }
      
      // Add the quantity to the count
      groupedSamples[key].count += quantity;
    });
    
    // Log the grouped samples for debugging
    console.log('Grouped samples with quantities:', groupedSamples);
    
    // Calculate amount for each group of samples
    let totalAmount = 0;
    
    Object.values(groupedSamples).forEach(group => {
      const groupAmount = calculateGroupAmount(group);
      totalAmount += groupAmount;
    });
    
    return totalAmount;
  };
  
  // Function to calculate amount for each group of samples
  const calculateGroupAmount = (group) => {
    const { commodity, type_size, method, mc_analysis, count } = group;
    
    // Log detail for debugging
    console.log('Calculating group amount:', {
      commodity,
      type_size,
      method,
      mc_analysis: Boolean(mc_analysis),
      count
    });
    
    // Check if methods contain Press Pellet or Fusion Bead
    const methods = (method || '').split(',')  // Use method instead of methodString
      .map(m => m.trim())
      .filter(m => m);
      
    const hasPressMethod = methods.some(m => m.toLowerCase().includes('press'));
    const hasFushionMethod = methods.some(m => m.toLowerCase().includes('fushion'));
  
    console.log('Method string:', method);  // Use method instead of methodString
    console.log('Parsed methods:', methods);
    console.log('Has Press Method:', hasPressMethod);
    console.log('Has Fushion Method:', hasFushionMethod);
    
    let baseAmount = 0;
    
    // For samples with both Press Pellet and Fusion Bead, use the higher-priced method (Fusion)
    const primaryMethod = hasFushionMethod ? "Fushion Bead" : (hasPressMethod ? "Press Pellet" : "");
    
    // NICKEL ORE PRICING LOGIC
    if (commodity === "Nickel Ore") {
      // GROSS SAMPLES
      if (type_size === "Gross") {
        if (primaryMethod === "Press Pellet") {
          if (count < 5) {
            baseAmount = 1925000;
          } else if (count >= 5 && count <= 25) {
            baseAmount = 385000 * count;
          } else if (count >= 26 && count <= 50) {
            baseAmount = 330000 * count;
          } else if (count >= 51 && count <= 100) {
            baseAmount = 300000 * count;
          } else {
            baseAmount = 285000 * count;
          }
        } 
        else if (primaryMethod === "Fushion Bead") {
          if (count < 5) {
            baseAmount = 3000000;
          } else {
            baseAmount = 600000 * count;
          }
        }
      }
      // PULP SAMPLES
      else if (type_size === "Pulp") {
        if (primaryMethod === "Press Pellet") {
          if (count < 5) {
            baseAmount = 1250000;
          } else if (count >= 5 && count <= 25) {
            baseAmount = 250000 * count;
          } else if (count >= 26 && count <= 50) {
            baseAmount = 235000 * count;
          } else if (count >= 51 && count <= 100) {
            baseAmount = 225000 * count;
          } else {
            baseAmount = 200000 * count;
          }
        } 
        else if (primaryMethod === "Fushion Bead") {
          if (count < 5) {
            baseAmount = 2500000;
          } else {
            baseAmount = 500000 * count;
          }
        }
      }
    }
    // FERRONICKEL PRICING LOGIC (add specific pricing if available)
    else if (commodity === "Ferronickel") {
      // Use default pricing for now
      baseAmount = 1500000 * count;
    }
    // Default pricing for other scenarios
    else {
      baseAmount = 500000 * count;
    }

    // Add MC Analysis cost if selected - make sure to check it properly
    let mcAnalysisAmount = 0;
    if (mc_analysis === true || methods.includes("MC Analysis")) {
      console.log("MC Analysis detected, applying pricing");
      if (count < 5) {
        mcAnalysisAmount = 750000; // Fixed price for small batch MC Analysis
      } else {
        mcAnalysisAmount = 150000 * count; // Per-sample price for larger batches
      }
    }
    
    // Log the calculated amounts for debugging
    console.log('Calculated amounts:', {
      baseAmount,
      mcAnalysisAmount,
      total: baseAmount + mcAnalysisAmount
    });
    
    return baseAmount + mcAnalysisAmount;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'amount') {
        const amount = parseFloat(value) || 0;
        newData.jumlah = amount;
        newData.ppn = amount * 0.11;
        newData.total = amount * 1.11;
      }
      
      return newData;
    });
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Tampilkan data yang akan dikirim untuk debugging
      console.log('Submitting data:', {
        sample_order_no: formData.sample_order_no,
        client: formData.client,
        description: formData.description,
        amount: Number(formData.amount),
        jumlah: Number(formData.jumlah),
        ppn: Number(formData.ppn),
        total: Number(formData.total),
        orderId: orderId
      });
      
      const response = await fetch('/api/pi_hantaran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sample_order_no: formData.sample_order_no,
          client: formData.client,
          description: formData.description,
          amount: Number(formData.amount),
          jumlah: Number(formData.jumlah),
          ppn: Number(formData.ppn),
          total: Number(formData.total),
          orderId: orderId
        }),
      });
      
      // Tambahkan cek status response sebelum mencoba parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      alert('Data PI Hantaran berhasil disimpan');
      router.push('/dashboard/adopsi/pi_hantaran');
    } catch (error) {
      console.error('Error:', error);
      setError(`Gagal menyimpan: ${error.message}`);
      alert(`Gagal menyimpan data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div className="text-center">Loading...</div>;
  
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;
  
  return (
    <div className="bg-white shadow-md rounded-md p-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Order
            </label>
            <input
              type="text"
              name="sample_order_no"
              value={formData.sample_order_no}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <input
              type="text"
              name="client"
              value={formData.client}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="3"
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Rp)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(formData.amount)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah (Rp)
            </label>
            <input
              type="number"
              name="jumlah"
              value={formData.jumlah}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(formData.jumlah)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PPN 11% (Rp)
            </label>
            <input
              type="number"
              name="ppn"
              value={formData.ppn}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(formData.ppn)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total (Rp)
            </label>
            <input
              type="number"
              name="total"
              value={formData.total}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(formData.total)}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/adopsi/pi_hantaran')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition`}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
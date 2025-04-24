'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function RS2Form() {
  const [orders, setOrders] = useState([]);
  const searchParams = useSearchParams();
  const [clients, setClients] = useState([]);
  const [orderForm, setOrderForm] = useState({
    id: '',
    sampleOrderNo: '',
    sender: '',
    phone: '',
    email: '',
    address: '',
    totalQty: 0,
    samples: [],
    attachment: null,
    attachment_Name: '',
    attachment_path: '',
    notes: '',
    pic: '',
    picPhone: '',
    signed: false,
    date: new Date(),
  });

  const [samples, setSamples] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown options
  const COMMODITY_OPTIONS = ['Nickel Ore', 'Ferronickel'];
  const TYPE_SIZE_OPTIONS = ['Pulp', 'Gross', 'Limestone'];
  const METHOD_OPTIONS = ['Press Pellet', 'Fushion Bead', 'MC Analysis'];

  // File upload validation
  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB in bytes
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File terlalu besar. Maksimal ukuran file adalah 250MB');
      e.target.value = null;
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Tipe file tidak didukung. Silakan upload file PDF, JPG, CSV, atau Excel');
      e.target.value = null;
      return;
    }

    setOrderForm(prev => ({
      ...prev,
      attachment: file,
      attachment_Name: file.name
    }));
  };

  // Function to get next sample code
  const getNextSampleCode = (currentCode) => {
    if (!currentCode) return '';
    
    // Check if the code ends with a number
    const numberMatch = currentCode.match(/(\d+)$/);
    if (numberMatch) {
      const base = currentCode.slice(0, -numberMatch[0].length);
      const nextNumber = parseInt(numberMatch[0]) + 1;
      return `${base}${nextNumber}`;
    }
    
    // Check if the code ends with a letter
    const letterMatch = currentCode.match(/([A-Za-z])$/);
    if (letterMatch) {
      const base = currentCode.slice(0, -1);
      const nextLetter = String.fromCharCode(letterMatch[0].charCodeAt(0) + 1);
      return `${base}${nextLetter}`;
    }
    
    return currentCode;
  };

  const addSample = () => {
    setSamples([...samples, {
      sampleCode: '',
      quantity: 0,
      commodity: '',
      typeSize: '',
      parameter: 'Full',
      regulation: '-',
      methodOfAnalysis: ''
    }]);
  };

  useEffect(() => {
    const autoFillFromUrl = async () => {
      const urlSampleOrderNo = searchParams.get('sampleOrderNo');
      const fromPi = searchParams.get('fromPi') === 'true';
      
      if (urlSampleOrderNo) {
        try {
          setIsLoading(true);
          
          // Periksa apakah ada data pre-fill dari localStorage (jika berasal dari PI Hantaran)
          let preFillData = null;
          if (fromPi) {
            const storedData = localStorage.getItem('rs2_prefill_data');
            if (storedData) {
              preFillData = JSON.parse(storedData);
              // Hapus data setelah digunakan
              localStorage.removeItem('rs2_prefill_data');
            }
          }
          
          // Fetch data order berdasarkan sample order number dari URL
          const response = await fetch(`/api/orders?sampleOrderNo=${encodeURIComponent(urlSampleOrderNo)}`);
          
          let orderData = null;
          if (response.ok) {
            orderData = await response.json();
          } else if (preFillData) {
            // Gunakan data pre-fill jika tidak ada data order yang tersedia
            orderData = preFillData;
          } else {
            throw new Error('Sample order tidak ditemukan');
          }
          
          // Fetch client data jika diperlukan
          let clientData = null;
          if (orderData.sender) {
            const clientResponse = await fetch(`/api/clients/${encodeURIComponent(orderData.sender)}`);
            if (clientResponse.ok) {
              clientData = await clientResponse.json();
            }
          }
          
          // Fetch PI Hantaran data jika diperlukan
          let piHantaranData = null;
          const piHantaranResponse = await fetch(`/api/pi_hantaran?sampleOrderNo=${encodeURIComponent(urlSampleOrderNo)}`);
          if (piHantaranResponse.ok) {
            piHantaranData = await piHantaranResponse.json();
          }
          
          // Populate form dengan data yang diambil
          setOrderForm({
            ...orderData,
            attachment: null, // Reset attachment karena ini submission baru
            attachment_Name: orderData.attachment_Name || '',
            attachment_path: orderData.attachment_path || '',
            // Jika perlu menambahkan data dari PI Hantaran
            sender: orderData.sender || (piHantaranData ? piHantaranData.client_id : ''),
            phone: orderData.phone || (clientData ? clientData.phone : ''),
            email: orderData.email || (clientData ? clientData.email : ''),
            address: orderData.address || (clientData ? clientData.address : ''),
          });
          
          // Set samples jika tersedia
          if (orderData.samples && Array.isArray(orderData.samples) && orderData.samples.length > 0) {
            setSamples(orderData.samples);
          } else if (orderData.id) {
            // Jika samples tidak termasuk dalam data order, ambil secara terpisah
            try {
              const samplesResponse = await fetch(`/api/samples?orderId=${orderData.id}`);
              if (samplesResponse.ok) {
                const samplesData = await samplesResponse.json();
                setSamples(samplesData);
              } else {
                // Tambahkan minimal satu sample kosong jika tidak ada data
                setSamples([{
                  sampleCode: '',
                  quantity: 0,
                  commodity: '',
                  typeSize: '',
                  parameter: 'Full',
                  regulation: '-',
                  methodOfAnalysis: ''
                }]);
              }
            } catch (samplesError) {
              console.error('Error mengambil samples:', samplesError);
              setSamples([{
                sampleCode: '',
                quantity: 0,
                commodity: '',
                typeSize: '',
                parameter: 'Full',
                regulation: '-',
                methodOfAnalysis: ''
              }]);
            }
          } else {
            // Tambahkan minimal satu sample kosong jika tidak ada data
            setSamples([{
              sampleCode: '',
              quantity: 0,
              commodity: '',
              typeSize: '',
              parameter: 'Full',
              regulation: '-',
              methodOfAnalysis: ''
            }]);
          }
          
        } catch (error) {
          console.error('Error auto-filling form:', error);
          alert(`Gagal mengisi form secara otomatis: ${error.message}`);
          // Tambahkan minimal satu sample kosong
          setSamples([{
            sampleCode: '',
            quantity: 0,
            commodity: '',
            typeSize: '',
            parameter: 'Full',
            regulation: '-',
            methodOfAnalysis: ''
          }]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    autoFillFromUrl();
  }, [searchParams]);

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setOrderForm(prev => ({
        ...prev,
        sender: clientId,
        phone: selectedClient.phone,
        email: selectedClient.email,
        address: selectedClient.address
      }));
    }
  };

  const deleteSample = (index) => {
    const newSamples = samples.filter((_, i) => i !== index);
    setSamples(newSamples);
  };

  const duplicateSample = (index) => {
    const sampleToDuplicate = { ...samples[index] };
    sampleToDuplicate.sampleCode = getNextSampleCode(sampleToDuplicate.sampleCode);
    setSamples([...samples, sampleToDuplicate]);
  };

  const router = useRouter();

  // Handle paste from clipboard functionality
  const handlePasteFromClipboard = async () => {
    try {
      // Get text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText || clipboardText.trim() === '') {
        alert('Tidak ada teks di clipboard');
        return;
      }
  
      setIsLoading(true);
      
      // Fetch order data based on the sample order number
      const response = await fetch(`/api/orders?sampleOrderNo=${encodeURIComponent(clipboardText.trim())}`);
      
      if (!response.ok) {
        throw new Error('Sample order tidak ditemukan');
      }
      
      const orderData = await response.json();
      
      // Fetch client data if needed
      let clientData = null;
      if (orderData.sender) {
        const clientResponse = await fetch(`/api/clients/${encodeURIComponent(orderData.sender)}`);
        if (clientResponse.ok) {
          clientData = await clientResponse.json();
        }
      }
      
      // Fetch PI Hantaran data if needed
      let piHantaranData = null;
      const piHantaranResponse = await fetch(`/api/pi_hantaran?sampleOrderNo=${encodeURIComponent(clipboardText.trim())}`);
      if (piHantaranResponse.ok) {
        piHantaranData = await piHantaranResponse.json();
      }
      
      // Populate the form with fetched data
      setOrderForm({
        ...orderData,
        attachment: null, // Reset attachment since it's a new submission
        attachment_Name: orderData.attachment_Name || '',
        attachment_path: orderData.attachment_path || '',
        // If you need to add data from PI Hantaran, add it here
        sender: orderData.sender || (piHantaranData ? piHantaranData.client_id : ''),
        phone: orderData.phone || (clientData ? clientData.phone : ''),
        email: orderData.email || (clientData ? clientData.email : ''),
        address: orderData.address || (clientData ? clientData.address : ''),
      });
      
      // Set samples
      if (orderData.samples && Array.isArray(orderData.samples) && orderData.samples.length > 0) {
        setSamples(orderData.samples);
      } else if (orderData.id) {
        // Jika samples tidak termasuk dalam data order, ambil secara terpisah
        try {
          const samplesResponse = await fetch(`/api/samples?orderId=${orderData.id}`);
          if (samplesResponse.ok) {
            const samplesData = await samplesResponse.json();
            setSamples(samplesData);
          }
        } catch (samplesError) {
          console.error('Error mengambil samples:', samplesError);
          // Tambahkan minimal satu sample kosong jika tidak ada data
          setSamples([{
            sampleCode: '',
            quantity: 0,
            commodity: '',
            typeSize: '',
            parameter: 'Full',
            regulation: '-',
            methodOfAnalysis: ''
          }]);
        }
      }
      
      // Jika tidak ada samples, tambahkan sample kosong
      if (!orderData.samples || !Array.isArray(orderData.samples) || orderData.samples.length === 0) {
        setSamples([{
          sampleCode: '',
          quantity: 0,
          commodity: '',
          typeSize: '',
          parameter: 'Full',
          regulation: '-',
          methodOfAnalysis: ''
        }]);
      }
      
    } catch (error) {
      console.error('Error mengambil data order:', error);
      alert(error.message || 'Gagal mengambil data order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
  
    try {
      if (samples.length === 0) {
        throw new Error('Minimal harus ada 1 sample');
      }
  
      // Hitung total quantity
      const totalQuantity = samples.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);
      
      // Buat data order
      const orderData = {
        ...orderForm,
        samples: samples,
        totalQty: totalQuantity
      };
  
      let response;
      
      if (orderForm.attachment) {
        // Buat FormData untuk upload file
        const formData = new FormData();
        formData.append("orderData", JSON.stringify(orderData));
        formData.append("attachment", orderForm.attachment);
  
        response = await fetch("/api/submit-rs2", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/submit-rs2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat submit order');
      }
  
      const result = await response.json();
      alert('Order berhasil disubmit!');
      router.push('/dashboard/adopsi/rs2');
  
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">RS2 Sample Order Form</h2>
      </div>
      
      <div className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Order Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Order No
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="sampleOrderNo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={orderForm.sampleOrderNo}
                  onChange={handleInputChange}
                  placeholder="Enter or paste sample order no"
                  required
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md border border-l-0 border-gray-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Paste'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.sender || ""}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.phone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={orderForm.address}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
              />
              {orderForm.attachment_Name && (
                <span className="mt-1 sm:mt-0 text-sm text-gray-600">
                  Selected: {orderForm.attachment_Name}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Max size: 250MB. Supported formats: PDF, JPG, PNG, CSV, XLS, XLSX
            </p>
          </div>

          {/* Samples Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white py-2">
              <h3 className="text-lg font-medium text-gray-800">Samples</h3>
              <button
                type="button"
                onClick={addSample}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                Add Sample
              </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              {/* Mobile view for samples */}
              <div className="block sm:hidden">
                {samples.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                  </div>
                ) : (
                  <div className="space-y-6 p-4">
                    {samples.map((sample, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-3 bg-gray-50">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="font-medium">Sample #{index + 1}</div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => deleteSample(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateSample(index)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Duplicate"
                            >
                              Duplicate
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sample Code</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.sampleCode}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].sampleCode = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.quantity}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].quantity = parseInt(e.target.value) || 0;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Commodity</label>
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.commodity}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].commodity = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select Commodity</option>
                              {COMMODITY_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type/Size</label>
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.typeSize}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].typeSize = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select Type/Size</option>
                              {TYPE_SIZE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Parameter</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.parameter}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].parameter = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Regulation</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.regulation}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].regulation = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Method of Analysis</label>
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.methodOfAnalysis}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].methodOfAnalysis = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select Method</option>
                              {METHOD_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Desktop view for samples */}
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Actions</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sample Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Commodity</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type/Size</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Parameter</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Regulation</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Method</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {samples.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-3 py-4 text-center text-sm text-gray-500">
                        </td>
                      </tr>
                    ) : (
                      samples.map((sample, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => deleteSample(index)}
                                className="p-1 text-xs text-red-600 hover:bg-red-100 rounded"
                                title="Delete"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateSample(index)}
                                className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                                title="Duplicate"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.sampleCode}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].sampleCode = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.quantity}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].quantity = parseInt(e.target.value) || 0;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.commodity}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].commodity = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select</option>
                              {COMMODITY_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.typeSize}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].typeSize = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select</option>
                              {TYPE_SIZE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.parameter}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].parameter = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.regulation}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].regulation = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <select
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={sample.methodOfAnalysis}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].methodOfAnalysis = e.target.value;
                                setSamples(newSamples);
                              }}
                              required
                            >
                              <option value="">Select</option>
                              {METHOD_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Error message display */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {submitError}
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIC
              </label>
              <input
                type="text"
                name="pic"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.pic}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIC Phone
              </label>
              <input
                type="tel"
                name="picPhone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.picPhone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={orderForm.notes}
              onChange={handleInputChange}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
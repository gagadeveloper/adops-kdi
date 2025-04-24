'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditOrder() {
  const router = useRouter();
  const { id } = useParams();

  const [order, setOrder] = useState({
    sample_order_no: '',
    project: '',
    sender: '',
    phone: '',
    email: '',
    address: '',
    total_qty: 0,
    notes: '',
    pic: '',
    pic_phone: '',
    signed: false,
    date: '',
    attachment: null,
    attachmentName: '',
    attachmentUrl: '',
    attachment_path:  '',
  });

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options
  const COMMODITY_OPTIONS = ['Nickel Ore', 'Ferronickel','-'];
  const TYPE_SIZE_OPTIONS = ['Pulp', 'Gross', 'Limestone','-'];
  const METHOD_OPTIONS = [
    { value: "Press Pellet", label: "Press Pellet" },
    { value: "Fushion Bead", label: "Fushion Bead" },
    { value: "MC Analysis", label: "MC Analysis" }
  ];

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

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) throw new Error('Gagal mengambil data order');
        const data = await response.json();
  
        console.log('Fetched order data:', data);
  
        // Create a proper attachment URL that points to your actual endpoint
        const attachmentUrl = data.attachment_path 
          ? `/api/attachments/${id}` // Use your existing endpoint
          : '';

        setOrder({
          sample_order_no: data.sample_order_no || '',
          project: data.project || '',
          sender: data.sender || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          total_qty: data.total_qty || 0,
          notes: data.notes || '',
          pic: data.pic || '',
          pic_phone: data.pic_phone || '',
          signed: data.signed || false,
          date: data.date || '',
          attachment: null,
          attachmentName: data.attachment_name || '',
          attachmentUrl: attachmentUrl,
          attachment_path: data.attachment_path || '',
        });
        
        // Ensure each sample has all required fields
        const formattedSamples = (data.samples || []).map(sample => ({
          id: sample.id || null,
          sample_code: sample.sample_code || '',
          quantity: sample.quantity || 1,
          commodity: sample.commodity || '',
          type_size: sample.type_size || '',
          parameter: sample.parameter || 'Full',
          regulation: sample.regulation || '',
          method_of_analysis: sample.method_of_analysis || ''
        }));

        console.log('Formatted samples:', formattedSamples); // Tambahkan logging
        
        setSamples(formattedSamples);
      } catch (error) {
        console.error('Error:', error.message);
        setSubmitError('Gagal mengambil data order. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Gagal mengambil data klien');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setSubmitError('Gagal mengambil data klien. Silakan coba lagi.');
      }
    };

    if (id) fetchOrder();
    fetchClients();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrder({ 
      ...order, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleClientChange = (clientId) => {
    if (!clientId) {
      setOrder(prev => ({
        ...prev,
        sender: '',
        phone: '',
        email: '',
        address: ''
      }));
      return;
    }
    
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setOrder(prev => ({
        ...prev,
        sender: clientId,
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
        address: selectedClient.address || ''
      }));
    }
  };

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
  
    // Set the file object as attachment_path
    setOrder(prev => ({
      ...prev,
      attachment_path: file,
      attachmentName: file.name,
    }));
  };

  const removeAttachment = () => {
    if (confirm('Apakah Anda yakin ingin menghapus lampiran ini?')) {
      setOrder(prev => ({
        ...prev,
        attachment_path: null,
        attachmentName: '',
        attachmentUrl: '',
      }));
    }
  };

  const handleSampleChange = (index, field, value) => {
    const newSamples = [...samples];
    newSamples[index][field] = value;
    setSamples(newSamples);
  };

  const handleMethodOfAnalysisChange = (index, method) => {
    const sample = samples[index];
    
    // Handle empty or undefined method_of_analysis
    const currentMethodsString = sample.method_of_analysis || '';
    
    // Split by comma and normalize each value by trimming whitespace
    const currentMethods = currentMethodsString
      .split(',')
      .map(m => m.trim())
      .filter(m => m); // Remove empty strings
    
    // Check if method is already in the array
    const isMethodSelected = currentMethods.some(m => 
      m.toLowerCase() === method.toLowerCase()
    );
    
    // Toggle the method
    const newMethods = isMethodSelected
      ? currentMethods.filter(m => m.toLowerCase() !== method.toLowerCase())
      : [...currentMethods, method];
    
    // Update the sample
    const newSamples = [...samples];
    newSamples[index].method_of_analysis = newMethods.join(', ');
    setSamples(newSamples);
  };

  const addSample = () => {
    setSamples([...samples, {
      sample_code: '',
      quantity: 1,
      commodity: '',
      type_size: '',
      parameter: 'Full',
      regulation: '',
      method_of_analysis: ''
    }]);
  };

  // Function to get next sample code
  const getNextSampleCode = (currentCode) => {
    if (!currentCode) return '';
    
    // Check if the code ends with a number
    const numberMatch = currentCode.match(/(\d+)$/);
    if (numberMatch) {
      const base = currentCode.slice(0, -numberMatch[0].length);
      const nextNumber = parseInt(numberMatch[0]) + 1;
      return `${base}${String(nextNumber).padStart(numberMatch[0].length, '0')}`;
    }
    
    // Check if the code ends with a letter
    const letterMatch = currentCode.match(/([A-Za-z])$/);
    if (letterMatch) {
      const base = currentCode.slice(0, -1);
      const nextLetter = String.fromCharCode(letterMatch[0].charCodeAt(0) + 1);
      return `${base}${nextLetter}`;
    }
    
    return `${currentCode}-1`;
  };

  const removeSample = (index) => {
    if (confirm('Apakah Anda yakin ingin menghapus sample ini?')) {
      setSamples(samples.filter((_, i) => i !== index));
    }
  };

  const duplicateSample = (index) => {
    const sampleToDuplicate = { ...samples[index] };
    // Remove the id to ensure it's treated as new
    delete sampleToDuplicate.id;
    sampleToDuplicate.sample_code = getNextSampleCode(sampleToDuplicate.sample_code);
    setSamples([...samples, sampleToDuplicate]);
  };

  // Calculate total quantity of samples
  const calculateTotalQuantity = () => {
    return samples.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
  
    try {
      if (samples.length === 0) {
        throw new Error('Minimal harus ada 1 sample');
      }
  
      // Calculate total quantity
      const totalQuantity = calculateTotalQuantity();
      
      // Prepare order data (without attachment)
      const orderData = {
        ...order,
        samples: samples,
        total_qty: totalQuantity,
      };
  
      // If there's a new file to upload
      if (order.attachment_path instanceof File) {
        const formData = new FormData();
        
        // Remove properties not needed for upload
        const { attachment, attachment_path, attachmentUrl, ...orderDataWithoutFile } = orderData;
        
        try {
          const orderDataJSON = JSON.stringify(orderDataWithoutFile);
          formData.append("orderData", orderDataJSON);
        } catch (error) {
          console.error("Error stringify orderData:", error);
          throw new Error(`Error memformat data: ${error.message}`);
        }
        
        // Use the field name expected by your backend
        formData.append("attachment", order.attachment_path);
        
        console.log('Submitting form data with attachment:', {
          fileSize: order.attachment_path.size,
          fileName: order.attachment_path.name,
          fileType: order.attachment_path.type
        });
        
        const response = await fetch(`/api/orders/${id}`, {
          method: "PUT",
          body: formData,
        });
        
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || 'Gagal memperbarui order dengan attachment');
        }
        
        alert('Order dengan attachment berhasil diperbarui');
        router.push('/dashboard/manage-adopsi');
      } else {
        // No new file - send as regular JSON
        const { attachment, attachment_path, ...orderDataToSend } = orderData;
        
        // Keep the existing attachment_path if there is one
        if (typeof order.attachment_path === 'string' && order.attachment_path) {
          orderDataToSend.attachment_path = order.attachment_path;
        }
        
        // Keep the existing attachment name if there is one
        if (order.attachmentName) {
          orderDataToSend.attachment_name = order.attachmentName;
        }
        
        const response = await fetch(`/api/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderDataToSend),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal memperbarui order');
        }
  
        alert('Order berhasil diperbarui');
        router.push('/dashboard/manage-adopsi');
      }
    } catch (error) {
      console.error('Error:', error.message);
      setSubmitError(error.message || 'Gagal memperbarui order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <div className="animate-pulse text-center">
        <p className='text-center mt-6 text-gray-600'>Memuat data...</p>
        <p className='text-sm text-gray-400'>Harap tunggu sebentar</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-semibold text-gray-800">Edit RS1 Sample Order</h2>
        <p className="text-sm text-gray-600">Sample Order No: {order.sample_order_no}</p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium text-gray-800 mb-2">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <input
                    type="text"
                    name="project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    value={order.project || 'Retail - Survey Produk Tambang Mineral & Batuan'}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Order No
                  </label>
                  <input
                    type="text"
                    name="sample_order_no"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    value={order.sample_order_no || ''}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium text-gray-800 mb-2">Informasi Pengirim</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender
                  </label>
                  <select
                    name="sender"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={order.sender || ""}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    value={order.phone || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    value={order.email || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    rows="2"
                    value={order.address || ''}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Attachment display section */}
            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium text-gray-800 mb-2">Lampiran</h3>
              <div className="flex flex-col">
                <div className="flex items-start space-x-2 mb-2">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
                  />
                  {/* Show remove button if there's an attachment */}
                  {(order.attachmentUrl || order.attachment_path instanceof File) && (
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Hapus Lampiran"
                    >
                      X
                    </button>
                  )}
                </div>

                {/* Display existing attachment info */}
                {order.attachmentUrl && !(order.attachment_path instanceof File) && (
                  <div className="flex flex-col p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                    <span className="font-medium">
                      File saat ini: {order.attachmentName || 'Lampiran'}
                    </span>
                    <a 
                      href={order.attachmentUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-1"
                    >
                      Lihat Lampiran
                    </a>
                  </div>
                )}
                
                {/* Display new file being uploaded */}
                {order.attachment_path instanceof File && (
                  <div className="flex flex-col p-2 bg-green-50 rounded border border-green-100 text-sm">
                    <span className="font-medium">
                      File baru: {order.attachment_path.name}
                    </span>
                    <span className="text-gray-600 text-xs">
                      (File akan diupload setelah menyimpan perubahan)
                    </span>
                  </div>
                )}
                
                <p className="mt-1 text-sm text-gray-500">
                  Max size: 250MB. Supported formats: PDF, JPG, PNG, CSV, XLS, XLSX
                </p>
              </div>
            </div>
          </div>

          {/* Samples Section */}
          <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-4 overflow-x-auto">
              <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm sticky top-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-800">Samples</h3>
                  <span className="text-sm text-gray-500">Total: {samples.length} item(s), {calculateTotalQuantity()} total quantity</span>
                </div>
                <button
                  type="button"
                  onClick={addSample}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Sample
                </button>
              </div>

              <div className="block sm:hidden">
                {samples.map((sample, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3 bg-gray-50 mb-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="font-medium">Sample #{index + 1}</div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => removeSample(index)}
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
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Sample Code */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sample Code</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.sample_code || ''}
                          onChange={(e) => handleSampleChange(index, 'sample_code', e.target.value)}
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.quantity || 0}
                          onChange={(e) => handleSampleChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          required
                        />
                      </div>

                      {/* Commodity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Commodity</label>
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.commodity || ''}
                          onChange={(e) => handleSampleChange(index, 'commodity', e.target.value)}
                          required
                        >
                          <option value="">Select Commodity</option>
                          {COMMODITY_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      {/* Type/Size */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type/Size</label>
                        <select
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.type_size || ''}
                          onChange={(e) => handleSampleChange(index, 'type_size', e.target.value)}
                          required
                        >
                          <option value="">Select Type/Size</option>
                          {TYPE_SIZE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      {/* Parameter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Parameter</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.parameter || 'Full'}
                          onChange={(e) => handleSampleChange(index, 'parameter', e.target.value)}
                          required
                        />
                      </div>

                      {/* Regulation */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Regulation</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={sample.regulation || ''}
                          onChange={(e) => handleSampleChange(index, 'regulation', e.target.value)}
                          required
                        />
                      </div>

                      {/* Method of Analysis */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Method of Analysis</label>
                        <div className="space-y-1">
                          {METHOD_OPTIONS.map((method) => (
                            <label 
                              key={method.value} 
                              className="inline-flex items-center cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                value={method.value}
                                checked={
                                  sample.method_of_analysis 
                                    ? sample.method_of_analysis
                                        .split(',')
                                        .map(m => m.trim())
                                        .some(m => m.toLowerCase() === method.value.toLowerCase())
                                    : false
                                }
                                onChange={() => handleMethodOfAnalysisChange(index, method.value)}
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {method.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop view for samples */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Actions</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sample Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">Quantity</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Commodity</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type/Size</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Parameter</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Regulation</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Method of Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {samples.map((sample, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => removeSample(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete"
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateSample(index)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Duplicate"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.sample_code || ''}
                            onChange={(e) => handleSampleChange(index, 'sample_code', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.quantity || 0}
                            min="1"
                            onChange={(e) => handleSampleChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.commodity || ''}
                            onChange={(e) => handleSampleChange(index, 'commodity', e.target.value)}
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
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.type_size || ''}
                            onChange={(e) => handleSampleChange(index, 'type_size', e.target.value)}
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
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.parameter || 'Full'}
                            onChange={(e) => handleSampleChange(index, 'parameter', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            value={sample.regulation || ''}
                            onChange={(e) => handleSampleChange(index, 'regulation', e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="space-y-1">
                            {METHOD_OPTIONS.map((method) => (
                              <label 
                                key={method.value} 
                                className="inline-flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  value={method.value}
                                  checked={
                                    sample.method_of_analysis 
                                      ? sample.method_of_analysis.split(', ').includes(method.value)
                                      : false
                                  }
                                  onChange={() => handleMethodOfAnalysisChange(index, method.value)}
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {method.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Error message display */}
          {submitError && (
            <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{submitError}</p>
            </div>
          )}

          {/* Additional Information */}
          <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-2">Informasi Tambahan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIC
                </label>
                <input
                  type="text"
                  name="pic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={order.pic || ''}
                  onChange={handleChange}
                  required
                  placeholder="Nama PIC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIC Phone
                </label>
                <input
                  type="tel"
                  name="pic_phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={order.pic_phone || ''}
                  onChange={handleChange}
                  required
                  placeholder="Nomor telepon PIC"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={order.notes || ''}
                  onChange={handleChange}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/manage-adopsi')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
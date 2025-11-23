'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function RS2Form() {
  const [loading, setLoading] = useState(false);
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
    clientOrderNo: '', // Will be auto-generated
    holdStorage: {
      days7: false,
      month1: false,
      customMonths: 0
    }
  });

  const [samples, setSamples] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown options
  const COMMODITY_OPTIONS = ['Nickel Ore', 'Ferronickel'];
  const TYPE_SIZE_OPTIONS = ['Pulp', 'Gross', 'Limestone'];
  
  // Updated method options with labels and values
  const METHOD_OPTIONS = [
    { label: 'Press Pellet', value: 'Press Pellet', isAddOn: false },
    { label: 'Fusion Bead', value: 'Fusion Bead', isAddOn: false },
    { label: 'MC Analysis', value: 'MC Analysis', isAddOn: true }
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

  // Function to update sample methods with multiple selections
  const updateSampleMethods = (index, methodValue, isChecked) => {
    const newSamples = [...samples];
    const currentMethods = newSamples[index].methodOfAnalysis 
      ? newSamples[index].methodOfAnalysis.split(', ').filter(m => m !== '')
      : [];
    
    if (isChecked && !currentMethods.includes(methodValue)) {
      currentMethods.push(methodValue);
    } else if (!isChecked) {
      const methodIndex = currentMethods.indexOf(methodValue);
      if (methodIndex !== -1) {
        currentMethods.splice(methodIndex, 1);
      }
    }
    
    newSamples[index].methodOfAnalysis = currentMethods.join(', ');
    setSamples(newSamples);
    
    // Update total quantity
    calculateTotalQuantity();
  };

  // Calculate and update total quantity
  const calculateTotalQuantity = () => {
    const totalQty = samples.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);
    setOrderForm(prev => ({
      ...prev,
      totalQty: totalQty
    }));
  };

  useEffect(() => {
    // Update total quantity whenever samples change
    calculateTotalQuantity();
  }, [samples]);

  useEffect(() => {
    const autoFillFromUrl = async () => {
      const urlSampleOrderNo = searchParams.get('sampleOrderNo');
      
      if (urlSampleOrderNo) {
        try {
          await fetchOrderDataBySampleOrderNo(urlSampleOrderNo);
        } catch (error) {
          console.error('Error auto-filling form:', error);
          alert(`Gagal mengisi form secara otomatis: ${error.message}`);
          // Add at least one empty sample
          setSamples([{
            sampleCode: '',
            quantity: 0,
            commodity: '',
            typeSize: '',
            parameter: 'Full',
            regulation: '-',
            methodOfAnalysis: ''
          }]);
          // Generate client order number
          generateClientOrderNo();
        }
      } else {
        // Initialize with one empty sample if no URL parameter
        setSamples([{
          sampleCode: '',
          quantity: 0,
          commodity: '',
          typeSize: '',
          parameter: 'Full',
          regulation: '-',
          methodOfAnalysis: ''
        }]);
        // Generate client order number
        generateClientOrderNo();
      }
    };
    
    autoFillFromUrl();
  }, [searchParams]);

  // Fetch clients data and generate client order number
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
    
    // Generate default client order number
    generateClientOrderNo();
  }, []);
  
  // Function to generate client order number based on format
  const generateClientOrderNo = () => {
    const companyCode = "23"; // Static company code
    
    // Get current date for month/year
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = String(currentDate.getFullYear()).slice(-2); // Get last 2 digits of year
    const dateCode = `${month}${year}`;
    
    // For sequence number, we'd ideally fetch the last one from the database
    // For now, we'll use a simple implementation
    const sequenceNumber = "0001"; // This should be dynamic in production
    
    // Fixed code A instead of random character
    const fixedCode = "A";
    
    const generatedOrderNo = `${companyCode}${dateCode}${sequenceNumber}${fixedCode}`;
    
    setOrderForm(prev => ({
      ...prev,
      clientOrderNo: generatedOrderNo
    }));
    
    return generatedOrderNo; // Return the generated value for use elsewhere
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setOrderForm(prev => ({
        ...prev,
        sender: clientId,
        phone: selectedClient.phone || prev.phone,
        email: selectedClient.email || prev.email,
        address: selectedClient.address || prev.address
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

  // Updated function to fetch RS1 order data by sample order number
  const fetchOrderDataBySampleOrderNo = async (sampleOrderNo) => {
    setIsLoading(true);
    try {
        console.log('Fetching order data for:', sampleOrderNo);
        
        const orderResponse = await fetch(`/api/orders?sampleOrderNo=${encodeURIComponent(sampleOrderNo.trim())}`);
        console.log('Order response status:', orderResponse.status);
        
        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Error response:', errorText);
            throw new Error('Sample order tidak ditemukan di database RS1');
        }
        
        const orderData = await orderResponse.json();
        console.log('Order data received:', orderData)
      
      if (!orderData || !orderData.id) {
        throw new Error('Data order tidak valid atau tidak lengkap');
      }
      
      // 2. Fetch samples data for this order
      const samplesUrl = `/api/samples?orderId=${orderData.id}`;
      console.log('Fetching samples from URL:', samplesUrl);
      
      const samplesResponse = await fetch(samplesUrl);
      console.log('Samples response status:', samplesResponse.status);
      
      let samplesData = [];
      
      if (samplesResponse.ok) {
        samplesData = await samplesResponse.json();
        console.log('Samples data received:', samplesData);
      } else {
        console.warn('Failed to fetch samples data:', await samplesResponse.text());
      }
      
      // 3. Fetch client data if needed
      let clientData = null;
      if (orderData.sender) {
        const clientUrl = `/api/clients/${encodeURIComponent(orderData.sender)}`;
        console.log('Fetching client from URL:', clientUrl);
        
        const clientResponse = await fetch(clientUrl);
        console.log('Client response status:', clientResponse.status);
        
        if (clientResponse.ok) {
          clientData = await clientResponse.json();
          console.log('Client data received:', clientData);
        } else {
          console.warn('Failed to fetch client data:', await clientResponse.text());
        }
      }
      
      // 4. Fetch attachment data from RS1
      let attachmentData = null;
      if (orderData.attachment_path) {
        try {
          const attachmentUrl = `/api/attachments/${encodeURIComponent(orderData.id)}`;
          console.log('Fetching attachment info from URL:', attachmentUrl);
          
          const attachmentResponse = await fetch(attachmentUrl);
          console.log('Attachment response status:', attachmentResponse.status);
          
          if (attachmentResponse.ok) {
            attachmentData = await attachmentResponse.json();
            console.log('Attachment data received:', attachmentData);
          }
        } catch (attachmentError) {
          console.warn('Failed to fetch attachment:', attachmentError);
        }
      }
      
      // Generate a client order number
      const clientOrderNo = generateClientOrderNo();
      
      // Calculate total quantity from samples
      const totalQty = samplesData.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);
      
      // 5. Map RS1 order data to RS2 form format
      setOrderForm({
          id: '', // This will be empty since we're creating a new RS2 record
          sampleOrderNo: orderData.sample_order_no || '',
          sender: orderData.sender || '',
          phone: orderData.phone || (clientData ? clientData.phone : ''),
          email: orderData.email || (clientData ? clientData.email : ''),
          address: orderData.address || (clientData ? clientData.address : ''),
          totalQty: totalQty,
          attachment: null, // We can't set the File object directly, but we can set the metadata
          attachment_Name: attachmentData ? attachmentData.filename : orderData.attachment_Name || '',
          attachment_path: orderData.attachment_path || '',
          notes: orderData.notes || '',
          pic: orderData.pic || '',
          picPhone: orderData.pic_phone || '',
          signed: false,
          date: new Date(),
          clientOrderNo: clientOrderNo,
          holdStorage: {
            days7: orderData.hold_7_days_storage || false,
            month1: orderData.hold_1_month_storage || false,
            customMonths: orderData.hold_custom_months_storage || 0
          }
      });
      
      // 6. Map RS1 samples data to RS2 samples format
      if (samplesData && samplesData.length > 0) {
        const mappedSamples = samplesData.map(sample => ({
          sampleCode: sample.sample_code || '',
          quantity: sample.quantity || 0,
          commodity: sample.commodity || '',
          typeSize: sample.type_size || '',
          parameter: sample.parameter || 'Full',
          regulation: sample.regulation || '-',
          methodOfAnalysis: sample.method_of_analysis || ''
        }));
        setSamples(mappedSamples);
        console.log('Samples set successfully:', mappedSamples);
      } else {
        // Add at least one empty sample if no samples data
        setSamples([{
          sampleCode: '',
          quantity: 0,
          commodity: '',
          typeSize: '',
          parameter: 'Full',
          regulation: '-',
          methodOfAnalysis: ''
        }]);
        console.log('No samples data, set default empty sample');
      }
      
    } catch (error) {
      console.error('Error in fetchOrderDataBySampleOrderNo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle paste from clipboard functionality
  const handlePasteFromClipboard = async () => {
    try {
      // Get text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText || clipboardText.trim() === '') {
        alert('Tidak ada teks di clipboard');
        return;
      }
      
      console.log("Clipboard text:", clipboardText.trim());
      
      // Update the sample order number field
      setOrderForm(prev => ({
        ...prev,
        sampleOrderNo: clipboardText.trim()
      }));
      
      console.log("Fetching order data for:", clipboardText.trim());
      
      try {
        // Attempt to fetch data
        await fetchOrderDataBySampleOrderNo(clipboardText.trim());
      } catch (error) {
        console.error('Detailed error while fetching order data:', error);
        alert(`Gagal mengambil data order: ${error.message}`);
        
        // Generate new client order number if fetch fails
        generateClientOrderNo();
      }
      
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      alert('Gagal mengakses clipboard. Pastikan Anda memberikan izin clipboard.');
      
      // Generate new client order number if clipboard access fails
      generateClientOrderNo();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('holdStorage.')) {
      const storageField = name.split('.')[1];
      setOrderForm(prev => ({
        ...prev,
        holdStorage: {
          ...prev.holdStorage,
          [storageField]: value
        }
      }));
    } else {
      setOrderForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.startsWith('holdStorage.')) {
      const storageField = name.split('.')[1];
      setOrderForm(prev => ({
        ...prev,
        holdStorage: {
          ...prev.holdStorage,
          [storageField]: checked
        }
      }));
    } else {
      setOrderForm(prev => ({ ...prev, [name]: checked }));
    }
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
      const totalQuantity = samples.reduce((total, sample) => total + (parseInt(sample.quantity) || 0), 0);
      
      // Prepare order data for orders2 table
      const orderData = {
        sample_order_no: orderForm.sampleOrderNo,
        sender: orderForm.sender,
        phone: orderForm.phone,
        email: orderForm.email,
        address: orderForm.address,
        total_qty: totalQuantity,
        notes: orderForm.notes,
        pic: orderForm.pic,
        pic_phone: orderForm.picPhone,
        client_order_no: orderForm.clientOrderNo,
        hold_7_days_storage: orderForm.holdStorage.days7,
        hold_1_month_storage: orderForm.holdStorage.month1,
        hold_custom_months_storage: orderForm.holdStorage.customMonths
      };
      
      // Prepare samples data for samples2 table
      const samplesData = samples.map(sample => ({
        sample_code: sample.sampleCode,
        quantity: sample.quantity,
        commodity: sample.commodity,
        type_size: sample.typeSize,
        parameter: sample.parameter,
        regulation: sample.regulation,
        method_of_analysis: sample.methodOfAnalysis
      }));
      
      // Combine data
      const submitData = {
        order: orderData,
        samples: samplesData,
        original_attachment_path: orderForm.attachment_path // Include original attachment path for reference
      };
  
      let response;
      
      if (orderForm.attachment) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("data", JSON.stringify(submitData));
        formData.append("attachment", orderForm.attachment);
  
        response = await fetch("/api/submit-rs2", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/submit-rs2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat submit order');
      }
  
      const result = await response.json();
      alert('Order RS2 berhasil disubmit!');
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
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-4 rounded-md shadow-md flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading data...</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Order Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Order No <span className="text-red-500">*</span>
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
              <p className="mt-1 text-xs text-gray-500">
                Paste nomor dari RS1 untuk mengisi otomatis
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Order No
              </label>
              <input
                type="text"
                name="clientOrderNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.clientOrderNo}
                onChange={handleInputChange}
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: Company (23) + Date (MMYY) + Sequence (0001) + Code (A)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender <span className="text-red-500">*</span>
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
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Quantity
              </label>
              <input
                type="number"
                name="totalQty"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={orderForm.totalQty}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={orderForm.address}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {/* Storage options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="storage7days"
                name="holdStorage.days7"
                checked={orderForm.holdStorage.days7}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="storage7days" className="ml-2 block text-sm text-gray-700">
                Hold 7 Days Storage
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="storage1month"
                name="holdStorage.month1"
                checked={orderForm.holdStorage.month1}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="storage1month" className="ml-2 block text-sm text-gray-700">
                Hold 1 Month Storage
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="storageCustomMonths" className="block text-sm text-gray-700">
                Hold Custom Months:
              </label>
              <input
                type="number"
                id="storageCustomMonths"
                name="holdStorage.customMonths"
                value={orderForm.holdStorage.customMonths}
                onChange={handleInputChange}
                min="0"
                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            {orderForm.attachment_path && (
              <p className="mt-1 text-sm text-blue-600">
                Original attachment from RS1 will be used unless a new file is selected
              </p>
            )}
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
                    No samples added. Click Add Sample to add one.
                  </div>
                ) : (
                  <div className="space-y-6 p-4">
                    {samples.map((sample, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
  <div className="flex justify-between items-center">
    <h4 className="font-medium text-gray-700">Sample #{index + 1}</h4>
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => duplicateSample(index)}
        className="p-1 text-blue-600 hover:text-blue-800"
        title="Duplicate"
      >
        <span>Copy</span>
      </button>
      <button
        type="button"
        onClick={() => deleteSample(index)}
        className="p-1 text-red-600 hover:text-red-800"
        title="Delete"
      >
        <span>Delete</span>
      </button>
    </div>
  </div>
  
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium text-gray-700">Sample Code</label>
      <input
        type="text"
        value={sample.sampleCode || ''}
        onChange={(e) => {
          const newSamples = [...samples];
          newSamples[index].sampleCode = e.target.value;
          setSamples(newSamples);
        }}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Quantity</label>
      <input
        type="number"
        value={sample.quantity || 0}
        onChange={(e) => {
          const newSamples = [...samples];
          newSamples[index].quantity = parseInt(e.target.value) || 0;
          setSamples(newSamples);
          calculateTotalQuantity();
        }}
        min="0"
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Commodity</label>
      <select
        value={sample.commodity || ''}
        onChange={(e) => {
          const newSamples = [...samples];
          newSamples[index].commodity = e.target.value;
          setSamples(newSamples);
        }}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Commodity</option>
        {COMMODITY_OPTIONS.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Type/Size</label>
      <select
        value={sample.typeSize || ''}
        onChange={(e) => {
          const newSamples = [...samples];
          newSamples[index].typeSize = e.target.value;
          setSamples(newSamples);
        }}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Type/Size</option>
        {TYPE_SIZE_OPTIONS.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Parameter</label>
      <select
        value={sample.parameter || 'Full'}
        onChange={(e) => {
          const newSamples = [...samples];
          newSamples[index].parameter = e.target.value;
          setSamples(newSamples);
        }}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="Full">Full</option>
        <option value="Partial">Partial</option>
      </select>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700">Method of Analysis</label>
      <div className="mt-1 space-y-2">
        {METHOD_OPTIONS.map(option => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`method-${index}-${option.value}`}
              checked={sample.methodOfAnalysis.includes(option.value)}
              onChange={(e) => updateSampleMethods(index, option.value, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`method-${index}-${option.value}`} className="ml-2 block text-sm text-gray-700">
              {option.label} {option.isAddOn && <span className="text-xs text-gray-500">(Add-on)</span>}
            </label>
          </div>
        ))}
      </div>
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
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type/Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {samples.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                          No samples added. Click Add Sample to add one.
                        </td>
                      </tr>
                    ) : (
                      samples.map((sample, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              value={sample.sampleCode || ''}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].sampleCode = e.target.value;
                                setSamples(newSamples);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={sample.quantity || 0}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].quantity = parseInt(e.target.value) || 0;
                                setSamples(newSamples);
                                calculateTotalQuantity();
                              }}
                              min="0"
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={sample.commodity || ''}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].commodity = e.target.value;
                                setSamples(newSamples);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              required
                            >
                              <option value="">Select</option>
                              {COMMODITY_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={sample.typeSize || ''}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].typeSize = e.target.value;
                                setSamples(newSamples);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              required
                            >
                              <option value="">Select</option>
                              {TYPE_SIZE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={sample.parameter || 'Full'}
                              onChange={(e) => {
                                const newSamples = [...samples];
                                newSamples[index].parameter = e.target.value;
                                setSamples(newSamples);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="Full">Full</option>
                              <option value="Partial">Partial</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col space-y-1">
                              {METHOD_OPTIONS.map(option => (
                                <div key={option.value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`method-table-${index}-${option.value}`}
                                    checked={sample.methodOfAnalysis.includes(option.value)}
                                    onChange={(e) => updateSampleMethods(index, option.value, e.target.checked)}
                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`method-table-${index}-${option.value}`} className="ml-1 block text-xs text-gray-700">
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => duplicateSample(index)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Duplicate"
                              >
                                <span>Copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSample(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.notes}
                onChange={handleInputChange}
                placeholder="Additional information or special requests"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIC Name <span className="text-red-500">*</span>
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
                  PIC Phone <span className="text-red-500">*</span>
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
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </div>
            {submitError && (
              <div className="text-sm text-red-600 mr-4">
                Error: {submitError}
              </div>
            )}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/adopsi/rs2')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
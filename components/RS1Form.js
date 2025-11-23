'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Select from "react-select";

export default function RS1Form() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
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
    signed: null,
    signedPhoto: null,
    date: new Date(),
  });

  const [samples, setSamples] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Ref for file input
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Existing code remains the same...

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    // Validate file type and size
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only JPEG, PNG, and JPG files are allowed');
      return;
    }
  
    if (file.size > MAX_FILE_SIZE) {
      alert('File size should be less than 10MB');
      return;
    }
  
    // Create URL for preview and set file
    const reader = new FileReader();
    reader.onloadend = () => {
      setOrderForm(prev => ({
        ...prev,
        signedPhoto: file,
        signed: reader.result // Base64 representation for preview
      }));
    };
    reader.readAsDataURL(file);
  };

  // Add new function to handle camera capture
  const handleCameraCapture = () => {
    // Check if the browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access. Please use file upload instead.');
      photoInputRef.current.click();
      return;
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    try {
      const videoElement = document.getElementById('camera-stream');
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create file from blob
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          
          // Create preview URL
          const reader = new FileReader();
          reader.onloadend = () => {
            setOrderForm(prev => ({
              ...prev,
              signedPhoto: file,
              signed: reader.result
            }));
          };
          reader.readAsDataURL(file);
        }
        
        // Clean up - stop camera and hide camera UI
        stopCamera();
        
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo. Please try again or use file upload');
      stopCamera();
    }
  };
  
  const stopCamera = () => {
    const videoElement = document.getElementById('camera-stream');
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    setShowCamera(false);
  };

  const openPhotoSource = () => {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, show a confirm dialog with options
      if (confirm('How would you like to add a photo?\n\nPress OK for Camera or Cancel for Gallery')) {
        handleCameraCapture();
      } else {
        photoInputRef.current.click();
      }
    } else {
      // On desktop, prompt with a more detailed dialog
      const userChoice = window.confirm('Select photo source:\nPress OK to take a photo with Camera\nPress Cancel to choose from Files');
      
      if (userChoice) {
        handleCameraCapture();
      } else {
        photoInputRef.current.click();
      }
    }
  };

  // Add this somewhere in your component to initialize the camera when showCamera becomes true
  useEffect(() => {
    if (showCamera) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, // Use back camera on mobile devices if available
            audio: false 
          });
          
          const videoElement = document.getElementById('camera-stream');
          if (videoElement) {
            videoElement.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          alert('Could not access the camera. Please check permissions or use file upload instead.');
          setShowCamera(false);
        }
      };
      
      startCamera();
      
      // Cleanup function
      return () => {
        stopCamera();
      };
    }
  }, [showCamera]);

  const clearSignedPhoto = () => {
    setOrderForm(prev => ({
      ...prev,
      signedPhoto: null,
      signed: null
    }));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Dropdown options
  const COMMODITY_OPTIONS = ['Nickel Ore', 'Ferronickel','-'];
  const TYPE_SIZE_OPTIONS = ['Pulp', 'Gross', 'Limestone','-'];
  const METHOD_OPTIONS = [
    { value: "Press Pellet", label: "Press Pellet", allowsMCAnalysis: true },
    { value: "Fushion Bead", label: "Fushion Bead", allowsMCAnalysis: true },
    { value: "MC Analysis", label: "MC Analysis", isAddOn: true }
  ];
  
  // Di dalam komponen, tambahkan fungsi untuk mengupdate methods
  const updateSampleMethods = (index, selectedMethod, isChecked) => {
    const newSamples = [...samples];
    const currentSample = newSamples[index];
  
    // Parse existing methods
    const currentMethods = currentSample.methodOfAnalysis 
      ? currentSample.methodOfAnalysis.split(', ').filter(m => m)
      : [];
  
    if (selectedMethod === 'MC Analysis') {
      // For MC Analysis, update the mc_analysis flag
      newSamples[index] = {
        ...currentSample,
        mc_analysis: isChecked
      };
      
      // Also update the methodOfAnalysis string to include/exclude MC Analysis
      if (isChecked) {
        // Add MC Analysis if it's not already there
        if (!currentMethods.includes(selectedMethod)) {
          newSamples[index].methodOfAnalysis = [...currentMethods, selectedMethod].join(', ');
        }
      } else {
        // Remove MC Analysis
        newSamples[index].methodOfAnalysis = currentMethods.filter(m => m !== selectedMethod).join(', ');
      }
    } else {
      // For Press Pellet or Fusion Bead, just update the methodOfAnalysis string
      let updatedMethods;
      if (isChecked) {
        // Add method if it's not already there
        updatedMethods = [...currentMethods];
        if (!updatedMethods.includes(selectedMethod)) {
          updatedMethods.push(selectedMethod);
        }
      } else {
        // Remove method
        updatedMethods = currentMethods.filter(m => m !== selectedMethod);
      }
      
      newSamples[index] = {
        ...currentSample,
        methodOfAnalysis: updatedMethods.join(', ')
      };
    }
  
    setSamples(newSamples);
  };

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
      methodOfAnalysis: '', // Pastikan diinisialisasi sebagai string kosong
    }]);
  };

  // Generate sample order number
  useEffect(() => {
    const generateOrderNumber = () => {
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      
      return `SMPL${year}${month}${day}-${sequence}`;
    };

    setOrderForm(prev => ({
      ...prev,
      sampleOrderNo: generateOrderNumber()
    }));
  }, []);

  // Fetch clients data and format for react-select
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data);
        
        // Format client data for react-select
        const options = data.map(client => ({
          value: client.id,
          label: client.name,
          data: client
        }));
        
        setClientOptions(options);
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

  const handleClientChange = (selectedOption) => {
    if (selectedOption) {
      const clientData = selectedOption.data;
      setOrderForm(prev => ({
        ...prev,
        sender: clientData.id,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address
      }));
    } else {
      // Reset fields if no client is selected
      setOrderForm(prev => ({
        ...prev,
        sender: '',
        phone: '',
        email: '',
        address: ''
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
  
        response = await fetch("/api/submit-rs1", {
          method: "POST",
          body: formData,
        });
      } else {
        // Jika tidak ada attachment, kirim sebagai JSON
        response = await fetch("/api/submit-rs1", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(orderData),
        });
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat submit order');
      }
  
      const result = await response.json();
      alert('Order berhasil disubmit!');
      router.push('/dashboard/adopsi/rs1');
  
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      border: '1px solid rgb(209, 213, 219)',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid rgb(209, 213, 219)',
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">RS1 Sample Order Form</h2>
      </div>
      
      <div className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Order Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Order No
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={orderForm.sampleOrderNo}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender
              </label>
              <Select
                options={clientOptions}
                styles={customSelectStyles}
                placeholder="Search or select client..."
                isClearable
                onChange={handleClientChange}
                className="basic-single"
                classNamePrefix="select"
                noOptionsMessage={() => "No clients found"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={orderForm.phone}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={orderForm.email}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              rows="2"
              value={orderForm.address}
              readOnly
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
                                  sample.methodOfAnalysis 
                                    ? sample.methodOfAnalysis.split(', ').includes(method.value)
                                    : false
                                }
                                onChange={(e) => {
                                  const newSamples = [...samples];
                                  updateSampleMethods(index, method.value, e.target.checked);
                                }}
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {method.label} {method.isAddOn ? '(+)' : ''}
                              </span>
                            </label>
                          ))}
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
                        <td colSpan="8" className="px-3 py-2 text-center text-gray-500">
                          No samples added
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
                                    sample.methodOfAnalysis 
                                      ? sample.methodOfAnalysis.split(', ').includes(method.value)
                                      : false
                                  }
                                  onChange={(e) => {
                                    updateSampleMethods(index, method.value, e.target.checked);
                                  }}
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {method.label} {method.isAddOn ? '(+)' : ''}
                                </span>
                              </label>
                            ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.pic}
                onChange={(e) => setOrderForm({...orderForm, pic: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIC Phone
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={orderForm.picPhone}
                onChange={(e) => setOrderForm({...orderForm, picPhone: e.target.value})}
                required
              />
            </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signed Photo
                </label>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={openPhotoSource}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {orderForm.signed ? 'Replace Photo' : 'Add Photo'}
                  </button>
                  
                  {orderForm.signed && (
                    <button
                      type="button"
                      onClick={clearSignedPhoto}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                {orderForm.signed && (
                  <div className="mt-2">
                    <img 
                      src={orderForm.signed} 
                      alt="Signed" 
                      className="h-32 w-auto max-w-xs object-contain rounded-md border border-gray-300"
                    />
                  </div>
                )}
              </div>
              
              {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col justify-center items-center">
                  <div className="bg-white p-4 rounded-lg w-full max-w-md">
                    <h3 className="text-lg font-medium mb-2">Camera</h3>
                    <div className="relative bg-black aspect-video mb-4 rounded overflow-hidden">
                      <video 
                        id="camera-stream" 
                        autoPlay 
                        playsInline
                        className="w-full h-full object-cover"
                      ></video>
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                      >
                        Capture
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={orderForm.notes}
              onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
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
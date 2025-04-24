//app/components/TrackingStep2
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, Save, X, Camera, PackageCheck } from 'lucide-react';

export default function Step2({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [formData, setFormData] = useState({
    receiver_name: '',
    received_quantity: '',
    received_photo_url: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  
  // Ensure the ID is properly extracted and converted to the expected format
  const id = params?.id ? params.id : null;
  
  // Debug log to check the ID value
  console.log("Sample ID from params:", id);
  
  // Fetch existing sample data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch sample data first
        const samplesResponse = await fetch(`/api/tracking-samples/${id}`);
        if (!samplesResponse.ok) {
          if (samplesResponse.status === 404) {
            throw new Error('Sample dengan ID tersebut tidak ditemukan');
          }
          throw new Error('Failed to fetch sample data');
        }
        const sampleData = await samplesResponse.json();
        console.log("Retrieved sample data:", sampleData);
        setSampleData(sampleData);
        
        // Fetch current user data
        const userResponse = await fetch('/api/users');
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        console.log("Retrieved user data:", userData);
        
        // Set form data with user and sample information
        setFormData({
          receiver_name: userData.name || '', // This should now get the user's name
          received_quantity: sampleData.quantity || '',
          received_photo_url: null
        });
        
        // If sample has already been received, show the existing photo
        if (sampleData.received_photo_url) {
          setPreviewUrl(sampleData.received_photo_url);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Gagal mengambil data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
  
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData(prev => ({ ...prev, received_photo_url: file }));
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, received_photo_url: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate that ID exists
    if (!id) {
      setError('ID sample tidak ditemukan');
      return;
    }
    
    setSubmitting(true);

    try {
      // Validate the received quantity
      if (!formData.received_quantity) {
        throw new Error('Jumlah sample yang diterima harus diisi');
      }

      // Validate the photo
      if (!formData.received_photo_url && !previewUrl) {
        throw new Error('Foto sample yang diterima harus diunggah');
      }

      // Create FormData object for file upload
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'received_photo_url' || (key === 'received_photo_url' && formData[key])) {
          data.append(key, formData[key]);
        }
      });

      // Add current date as received_date
      data.append('received_date', new Date().toISOString());
      
      // Log what we're sending and where for debugging
      console.log(`Sending PUT request to /api/tracking-samples/step2/${id}`);
      
      // Send data to API
      const response = await fetch(`/api/tracking-samples/step2/${id}`, {
        method: 'PUT',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan data');
      }

      // Redirect back to dashboard after successful submission
      router.push('/dashboard/adopsi/tracking-samples');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-md shadow-md">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              Konfirmasi Penerimaan Sample
            </h1>
          </div>
          <div>
            <PackageCheck className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium text-red-700">{error}</p>
            <button 
              onClick={() => router.push('/dashboard/adopsi/tracking-samples')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Kembali ke daftar sample
            </button>
          </div>
        )}

        {sampleData && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
            <h2 className="font-medium text-blue-700">Informasi Sample</h2>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="text-gray-600">Kode Sample:</p>
                <p className="font-semibold">{sampleData.sample_code || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Pengirim:</p>
                <p className="font-semibold">{sampleData.sender_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Jumlah Dikirim:</p>
                <p className="font-semibold">{sampleData.quantity || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Barcode Segel:</p>
                <p className="font-semibold">{sampleData.barcode_seal || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {sampleData && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="receiver_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penerima
                </label>
                <input
                  type="text"
                  id="receiver_name"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama penerima sample"
                />
              </div>

              <div>
                <label htmlFor="received_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Sample Diterima
                </label>
                <input
                  type="number"
                  id="received_quantity"
                  name="received_quantity"
                  value={formData.received_quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Verifikasi jumlah sample yang diterima"
                />
                {sampleData && formData.received_quantity && 
                  parseInt(formData.received_quantity) !== parseInt(sampleData.quantity) && (
                  <p className="mt-1 text-sm text-orange-500">
                    Jumlah yang diterima berbeda dengan jumlah yang dikirim ({sampleData.quantity})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Sample yang Diterima
                </label>
                
                {!previewUrl ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>Upload foto</span>
                          <input id="file-upload" name="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 relative">
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover rounded-md" />
                      <button 
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Foto harus menunjukkan kondisi sample saat diterima dengan jelas
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Konfirmasi Penerimaan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
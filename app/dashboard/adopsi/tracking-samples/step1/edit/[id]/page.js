'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, Loader2, Save, X
} from 'lucide-react';

export default function EditStep1Page({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sender_name: '',
    sample_code: '',
    quantity: '',
    barcode_seal: '',
    driver_name: '',
    plate_number: '',
    photo_url: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSampleData = async () => {
      try {
        const response = await fetch(`/api/tracking-samples/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sample data');
        }
        
        const data = await response.json();
        
        setFormData({
          sender_name: data.sender_name || '',
          sample_code: data.sample_code || '',
          quantity: data.quantity?.toString() || '',
          barcode_seal: data.barcode_seal || '',
          driver_name: data.driver_name || '',
          plate_number: data.plate_number || '',
          photo_url: data.photo_url || null
        });
        
        if (data.photo_url) {
          setPreviewUrl(data.photo_url);
        }
        
      } catch (error) {
        console.error('Error fetching sample:', error);
        setError('Gagal memuat data sample');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSampleData();
    } else {
      setLoading(false);
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
      setFormData(prev => ({ ...prev, photo_url: file }));
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, photo_url: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Create FormData object for file upload
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'photo_url' || (key === 'photo_url' && formData[key] && typeof formData[key] !== 'string')) {
          data.append(key, formData[key]);
        }
      });
      
      // Send data to API
      const url = `/api/tracking-samples/step1/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan data');
      }

      // Redirect back to dashboard after successful submission
      router.push('/dashboard/tracking-samples');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
              Edit Pengiriman Sample
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="sender_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pengirim
                </label>
                <input
                  type="text"
                  id="sender_name"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sample_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Sample
                </label>
                <input
                  type="text"
                  id="sample_code"
                  name="sample_code"
                  value={formData.sample_code}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Sample
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="barcode_seal" className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Segel
                </label>
                <input
                  type="text"
                  id="barcode_seal"
                  name="barcode_seal"
                  value={formData.barcode_seal}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Driver
                </label>
                <input
                  type="text"
                  id="driver_name"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Plat Nomor
                </label>
                <input
                  type="text"
                  id="plate_number"
                  name="plate_number"
                  value={formData.plate_number}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Sample
                </label>
                
                {!previewUrl ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                          <span>Upload file</span>
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
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
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
              </div>
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
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
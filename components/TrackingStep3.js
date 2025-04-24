//app/components/TrackingStep3
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, Save, FlaskConical, CalendarIcon, CheckCircle
} from 'lucide-react';

export default function Step3({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [formData, setFormData] = useState({
    preparation_status: 'in_progress',
    preparation_notes: '',
    prepared_by: ''
  });
  const [error, setError] = useState('');
  
  // Get the sample ID from params
  const id = params?.id ? params.id : null;
  
  // Debug log to check the ID value
  console.log("Sample ID from params:", id);
  
  // Fetch existing sample data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch sample data
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
        
        // Pre-populate form data with existing preparation info if available
        setFormData({
          preparation_status: sampleData.preparation_status || 'in_progress',
          preparation_notes: sampleData.preparation_notes || '',
          prepared_by: userData.name || ''
        });
        
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
      // Validate form data
      if (!formData.preparation_status) {
        throw new Error('Status preparasi harus dipilih');
      }

      // Create request data
      const requestData = {
        ...formData,
        preparation_started_date: sampleData.preparation_started_date || new Date().toISOString()
      };
      
      // If status is completed, add completion date
      if (formData.preparation_status === 'completed') {
        requestData.preparation_completed_date = new Date().toISOString();
      }
      
      console.log(`Sending PUT request to /api/tracking-samples/step3/${id}`);
      console.log("Request data:", requestData);
      
      // Send data to API
      const response = await fetch(`/api/tracking-samples/step3/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
              Update Preparasi Sample
            </h1>
          </div>
          <div>
            <FlaskConical className="w-6 h-6 text-blue-500" />
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <p className="text-gray-600">Kode Sample:</p>
                <p className="font-semibold">{sampleData.sample_code || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Pengirim:</p>
                <p className="font-semibold">{sampleData.sender_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Jumlah Diterima:</p>
                <p className="font-semibold">{sampleData.received_quantity || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Penerima:</p>
                <p className="font-semibold">{sampleData.receiver_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tanggal Diterima:</p>
                <p className="font-semibold">{sampleData.received_date ? new Date(sampleData.received_date).toLocaleDateString('id-ID') : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {sampleData && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="preparation_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Preparasi
                </label>
                <select
                  id="preparation_status"
                  name="preparation_status"
                  value={formData.preparation_status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in_progress">Sedang Diproses</option>
                  <option value="completed">Selesai</option>
                  <option value="on_hold">Ditunda</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
                
                {formData.preparation_status === 'on_hold' && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Harap cantumkan alasan penundaan dalam catatan preparasi
                  </p>
                )}
                
                {formData.preparation_status === 'cancelled' && (
                  <p className="mt-1 text-sm text-red-600">
                    Harap cantumkan alasan pembatalan dalam catatan preparasi
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="preparation_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Preparasi
                </label>
                <textarea
                  id="preparation_notes"
                  name="preparation_notes"
                  value={formData.preparation_notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Catatan tentang proses preparasi sample"
                ></textarea>
              </div>

              <div>
                <label htmlFor="prepared_by" className="block text-sm font-medium text-gray-700 mb-1">
                  Dipreparasi Oleh
                </label>
                <input
                  type="text"
                  id="prepared_by"
                  name="prepared_by"
                  value={formData.prepared_by}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {sampleData.preparation_started_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>
                    Preparasi dimulai pada: {new Date(sampleData.preparation_started_date).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {sampleData.preparation_completed_date && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>
                    Preparasi selesai pada: {new Date(sampleData.preparation_completed_date).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
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
                    <span>
                      {formData.preparation_status === 'completed' ? 'Selesaikan Preparasi' : 'Update Status'}
                    </span>
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
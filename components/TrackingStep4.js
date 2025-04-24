//app/components/TrackingStep4
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, Save, FileCheck, CalendarIcon, CheckCircle
} from 'lucide-react';

export default function Step4({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [formData, setFormData] = useState({
    analysis_status: 'in_progress',
    analysis_notes: '',
    analyzed_by: ''
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
        
        // Pre-populate form data with existing analysis info if available
        setFormData({
          analysis_status: sampleData.analysis_status || 'in_progress',
          analysis_notes: sampleData.analysis_notes || '',
          analyzed_by: userData.name || ''
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
      if (!formData.analysis_status) {
        throw new Error('Status analisis harus dipilih');
      }

      // Create request data
      const requestData = {
        ...formData,
        analysis_started_date: sampleData.analysis_started_date || new Date().toISOString()
      };
      
      // If status is completed, add completion date
      if (formData.analysis_status === 'completed') {
        requestData.analysis_completed_date = new Date().toISOString();
      }
      
      console.log(`Sending PUT request to /api/tracking-samples/step4/${id}`);
      console.log("Request data:", requestData);
      
      // Send data to API
      const response = await fetch(`/api/tracking-samples/step4/${id}`, {
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
              Update Analisis Sample
            </h1>
          </div>
          <div>
            <FileCheck className="w-6 h-6 text-blue-500" />
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
                <p className="text-gray-600">Jumlah Sample:</p>
                <p className="font-semibold">{sampleData.received_quantity || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Status Preparasi:</p>
                <p className="font-semibold">
                  {sampleData.preparation_status === 'completed' ? 'Selesai' : 
                   sampleData.preparation_status === 'in_progress' ? 'Sedang Diproses' :
                   sampleData.preparation_status === 'on_hold' ? 'Ditunda' :
                   sampleData.preparation_status === 'cancelled' ? 'Dibatalkan' : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Dipreparasi Oleh:</p>
                <p className="font-semibold">{sampleData.prepared_by || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {sampleData && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="analysis_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Analisis
                </label>
                <select
                  id="analysis_status"
                  name="analysis_status"
                  value={formData.analysis_status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in_progress">Sedang Dianalisis</option>
                  <option value="completed">Selesai</option>
                  <option value="pending_validation">Menunggu Validasi</option>
                  <option value="needs_reanalysis">Perlu Analisis Ulang</option>
                </select>
              </div>

              <div>
                <label htmlFor="analysis_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Analisis
                </label>
                <textarea
                  id="analysis_notes"
                  name="analysis_notes"
                  value={formData.analysis_notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Catatan tentang proses dan hasil analisis"
                ></textarea>
              </div>

              <div>
                <label htmlFor="analyzed_by" className="block text-sm font-medium text-gray-700 mb-1">
                  Dianalisis Oleh
                </label>
                <input
                  type="text"
                  id="analyzed_by"
                  name="analyzed_by"
                  value={formData.analyzed_by}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {sampleData.analysis_started_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>
                    Analisis dimulai pada: {new Date(sampleData.analysis_started_date).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {sampleData.analysis_completed_date && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>
                    Analisis selesai pada: {new Date(sampleData.analysis_completed_date).toLocaleString('id-ID')}
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
                      {formData.analysis_status === 'completed' ? 'Selesaikan Analisis' : 'Update Status'}
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
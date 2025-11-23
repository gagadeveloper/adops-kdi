//app/components/TrackingStep5
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, Save, ClipboardCheck, CalendarIcon, 
  CheckCircle, Upload, FileText, XCircle
} from 'lucide-react';

export default function Step5({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [formData, setFormData] = useState({
    roa_status: 'in_progress',
    roa_document_url: '',
    roa_created_by: ''
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
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
        
        // Pre-populate form data with existing ROA info if available
        setFormData({
          roa_status: sampleData.roa_status || 'in_progress',
          roa_document_url: sampleData.roa_document_url || '',
          roa_created_by: userData.name || ''
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

  const handleFileChange = (e) => {
    setFileError('');
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Validate file type - allow PDF, DOC, DOCX
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError('Format file tidak valid. Gunakan PDF, DOC, atau DOCX.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const uploadFile = async () => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        // DO NOT set Content-Type header manually
        // The browser will set it correctly with boundary for FormData
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Replace the existing handleSubmit function with this one
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
      if (!formData.roa_status) {
        throw new Error('Status ROA harus dipilih');
      }

      // Create a FormData object for the request
      const requestFormData = new FormData();
      
      // Add the form field values
      requestFormData.append('roa_status', formData.roa_status);
      requestFormData.append('roa_created_by', formData.roa_created_by);
      
      // Handle dates
      if (sampleData.roa_created_date) {
        requestFormData.append('roa_created_date', sampleData.roa_created_date);
      } else {
        requestFormData.append('roa_created_date', new Date().toISOString());
      }
      
      // If status is issued, add issued date
      if (formData.roa_status === 'issued') {
        requestFormData.append('roa_issued_date', new Date().toISOString());
      }
      
      // Add the file if present
      if (file) {
        requestFormData.append('roa_document_file', file);
      }
      
      console.log(`Sending PUT request to /api/tracking-samples/step5/${id}`);
      
      // Send data to API with FormData
      const response = await fetch(`/api/tracking-samples/step5/${id}`, {
        method: 'PUT',
        // Don't set Content-Type header when using FormData
        // The browser will automatically set the correct boundary
        body: requestFormData,
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
              Kelola ROA (Report of Analysis)
            </h1>
          </div>
          <div>
            <ClipboardCheck className="w-6 h-6 text-blue-500" />
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
                <p className="text-gray-600">Status Analisis:</p>
                <p className="font-semibold">
                  {sampleData.analysis_status === 'completed' ? 'Selesai' : 
                   sampleData.analysis_status === 'in_progress' ? 'Sedang Diproses' :
                   sampleData.analysis_status === 'pending_validation' ? 'Menunggu Validasi' :
                   sampleData.analysis_status === 'needs_reanalysis' ? 'Perlu Analisis Ulang' : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Dianalisis Oleh:</p>
                <p className="font-semibold">{sampleData.analyzed_by || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {sampleData && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="roa_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status ROA
                </label>
                <select
                  id="roa_status"
                  name="roa_status"
                  value={formData.roa_status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in_progress">Sedang Diproses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Dalam Review</option>
                  <option value="issued">Diterbitkan</option>
                  <option value="on_hold">Ditunda</option>
                </select>
              </div>

              <div>
                <label htmlFor="roa_file" className="block text-sm font-medium text-gray-700 mb-1">
                  Unggah Dokumen ROA
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    id="roa_file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="flex items-center space-x-2">
                    <label 
                      htmlFor="roa_file" 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{file ? 'Ganti File' : 'Pilih File'}</span>
                    </label>
                    {file && <span className="text-sm text-blue-600">{file.name}</span>}
                    {formData.roa_document_url && !file && (
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-500" />
                        <a
                          href={formData.roa_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Lihat Dokumen
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
              </div>

              <div>
                <label htmlFor="roa_created_by" className="block text-sm font-medium text-gray-700 mb-1">
                  Dibuat Oleh
                </label>
                <input
                  type="text"
                  id="roa_created_by"
                  name="roa_created_by"
                  value={formData.roa_created_by}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {sampleData.roa_created_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>
                    Pembuatan ROA dimulai pada: {new Date(sampleData.roa_created_date).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {sampleData.roa_issued_date && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>
                    ROA diterbitkan pada: {new Date(sampleData.roa_issued_date).toLocaleString('id-ID')}
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
                      {formData.roa_status === 'issued' ? 'Terbitkan ROA' : 'Update Status'}
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
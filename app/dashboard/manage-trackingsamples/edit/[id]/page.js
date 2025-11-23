'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditTrackingSample({ params }) {
  const { id } = params;
  const router = useRouter();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    sample_code: '',
    sender_name: '',
    sample_type: '',
    quantity: '',
    sent_date: '',
    received_date: '',
    preparation_completed_date: '',
    analysis_completed_date: '',
    roa_issued_date: '',
    coa_issued_date: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSample = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/tracking-samples/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sample');
        }
        
        const sampleData = await response.json();
        setSample(sampleData);
        
        // Initialize form data with sample data
        setFormData({
          sample_code: sampleData.sample_code || '',
          sender_name: sampleData.sender_name || '',
          sample_type: sampleData.sample_type || '',
          quantity: sampleData.quantity || '',
          sent_date: formatDateForInput(sampleData.sent_date),
          received_date: formatDateForInput(sampleData.received_date),
          preparation_completed_date: formatDateForInput(sampleData.preparation_completed_date),
          analysis_completed_date: formatDateForInput(sampleData.analysis_completed_date),
          roa_issued_date: formatDateForInput(sampleData.roa_issued_date),
          coa_issued_date: formatDateForInput(sampleData.coa_issued_date),
          notes: sampleData.notes || ''
        });
        
      } catch (error) {
        console.error('Error fetching sample:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchSample();
    }
  }, [id]);

  // Helper function to format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tracking-samples/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sample');
      }
      
      // Navigate back to samples list on success
      router.push('/dashboard/manage-trackingsamples');
      
    } catch (error) {
      console.error('Error updating sample:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error && !sample) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-md mb-4">
          <p>Error: {error}</p>
        </div>
        <button 
          onClick={handleCancel} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={handleCancel} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Edit Sample: {sample?.sample_code}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-md mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Sample *
              </label>
              <input
                type="text"
                name="sample_code"
                value={formData.sample_code}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pengirim *
              </label>
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Sample
              </label>
              <input
                type="text"
                name="sample_type"
                value={formData.sample_type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kuantitas *
              </label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Tracking Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Kirim
              </label>
              <input
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Terima
              </label>
              <input
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Preparasi Selesai
              </label>
              <input
                type="date"
                name="preparation_completed_date"
                value={formData.preparation_completed_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Analisa Selesai
              </label>
              <input
                type="date"
                name="analysis_completed_date"
                value={formData.analysis_completed_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal ROA Terbit
              </label>
              <input
                type="date"
                name="roa_issued_date"
                value={formData.roa_issued_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal COA Terbit
              </label>
              <input
                type="date"
                name="coa_issued_date"
                value={formData.coa_issued_date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
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
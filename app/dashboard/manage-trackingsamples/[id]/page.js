'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, 
  PackageCheck, Truck, FlaskConical, FileCheck, ClipboardCheck, CheckCircle
} from 'lucide-react';

export default function ViewTrackingSample({ params }) {
  const { id } = params;
  const router = useRouter();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStepStatus = (sample) => {
    if (sample.coa_issued_date) return 6;
    if (sample.roa_issued_date) return 5;
    if (sample.analysis_completed_date) return 4;
    if (sample.preparation_completed_date) return 3;
    if (sample.received_date) return 2;
    if (sample.sent_date) return 1;
    return 0; // Newly created sample
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/dashboard/manage-trackingsamples/edit/${id}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-md mb-4">
          <p>Error: {error || 'Sample not found'}</p>
        </div>
        <button 
          onClick={handleBack} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    );
  }

  const currentStatus = getStepStatus(sample);
  
  const statusText = (statusCode) => {
    switch(statusCode) {
      case 0: return "Baru Dibuat";
      case 1: return "Dikirim";
      case 2: return "Diterima";
      case 3: return "Preparasi Selesai";
      case 4: return "Analisa Selesai";
      case 5: return "ROA Terbit";
      case 6: return "COA Terbit";
      default: return "Unknown";
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={handleBack} 
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Detail Sample: {sample.sample_code}</h1>
        </div>
        
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
        >
          <Edit size={16} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sample Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Status Sample</h2>
          <div className="flex items-center mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentStatus === 6 ? 'bg-green-100 text-green-800' :
              currentStatus >= 4 ? 'bg-blue-100 text-blue-800' :
              currentStatus >= 2 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusText(currentStatus)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className={`flex items-start ${currentStatus >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <Truck className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">Dikirim</p>
                <p className="text-sm text-gray-600">{formatDate(sample.sent_date)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${currentStatus >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <PackageCheck className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">Diterima</p>
                <p className="text-sm text-gray-600">{formatDate(sample.received_date)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${currentStatus >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <FlaskConical className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">Preparasi Selesai</p>
                <p className="text-sm text-gray-600">{formatDate(sample.preparation_completed_date)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${currentStatus >= 4 ? 'text-green-600' : 'text-gray-400'}`}>
              <FileCheck className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">Analisa Selesai</p>
                <p className="text-sm text-gray-600">{formatDate(sample.analysis_completed_date)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${currentStatus >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
              <ClipboardCheck className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">ROA Terbit</p>
                <p className="text-sm text-gray-600">{formatDate(sample.roa_issued_date)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${currentStatus >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="w-5 h-5 mr-3 mt-0.5" />
              <div>
                <p className="font-medium">COA Terbit</p>
                <p className="text-sm text-gray-600">{formatDate(sample.coa_issued_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Details Card */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Informasi Sample</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Kode Sample</p>
              <p className="font-medium">{sample.sample_code || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Pengirim</p>
              <p className="font-medium">{sample.sender_name || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Jenis Sample</p>
              <p className="font-medium">{sample.sample_type || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Kuantitas</p>
              <p className="font-medium">{sample.quantity || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Tanggal Dibuat</p>
              <p className="font-medium">{formatDate(sample.created_at)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Terakhir Diupdate</p>
              <p className="font-medium">{formatDate(sample.updated_at)}</p>
            </div>
          </div>
          
          {sample.notes && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-1">Catatan</p>
              <p>{sample.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
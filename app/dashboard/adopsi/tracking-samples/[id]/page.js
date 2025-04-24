'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Truck, PackageCheck, FlaskConical, FileCheck, 
  ClipboardCheck, CheckCircle, Download, Calendar, User, Package, 
  Info, FileText, CheckSquare, Clock, Eye
} from 'lucide-react';

export default function SampleDetailView() {
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchSampleDetails = async () => {
      setLoading(true);
      try {
        // Use the sample ID from the route params
        const sampleId = params.id;
        
        // Fetch sample details from the API
        const response = await fetch(`/api/tracking-samples/${sampleId}`);
        if (!response.ok) throw new Error('Failed to fetch sample details');
        
        const data = await response.json();
        setSample(data);
      } catch (err) {
        console.error('Error fetching sample details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSampleDetails();
  }, [params.id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '-';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate difference in milliseconds
    const diffTime = Math.abs(end - start);
    
    // Convert to days
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate remaining hours
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} hari ${diffHours} jam`;
    } else {
      return `${diffHours} jam`;
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleViewCOA = () => {
    if (sample?.coa_document_url) {
      // Open COA document in a new tab
      window.open(`/api/documents/coa/${sample.id}`, '_blank');
    }
  };

  const handleViewROA = () => {
    if (sample?.roa_document_url) {
      // Open ROA document in a new tab
      window.open(`/api/documents/roa/${sample.id}`, '_blank');
    }
  };

  const getStepStatus = (sample) => {
    if (!sample) return 0;
    if (sample.coa_issued_date) return 6;
    if (sample.roa_issued_date) return 5;
    if (sample.analysis_completed_date) return 4;
    if (sample.preparation_completed_date) return 3;
    if (sample.received_date) return 2;
    if (sample.sent_date) return 1;
    return 0;
  };

  const currentStatus = sample ? getStepStatus(sample) : 0;

  const getStatusText = (status) => {
    switch(status) {
      case 0: return 'Pendaftaran Sample';
      case 1: return 'Sample Dikirim';
      case 2: return 'Sample Diterima';
      case 3: return 'Preparasi Selesai';
      case 4: return 'Analisa Selesai';
      case 5: return 'ROA Terbit';
      case 6: return 'COA Terbit';
      default: return 'Unknown';
    }
  };

  const StepItem = ({ step, title, date, person, notes, completed, startDate, endDate, showDuration }) => (
    <div className={`border-l-4 ${completed ? 'border-green-500' : 'border-gray-300'} pl-4 pb-6`}>
      <div className={`flex items-center mb-2 ${completed ? 'text-green-600' : 'text-gray-500'}`}>
        {step === 1 && <Truck className="w-5 h-5 mr-2" />}
        {step === 2 && <PackageCheck className="w-5 h-5 mr-2" />}
        {step === 3 && <FlaskConical className="w-5 h-5 mr-2" />}
        {step === 4 && <FileCheck className="w-5 h-5 mr-2" />}
        {step === 5 && <ClipboardCheck className="w-5 h-5 mr-2" />}
        {step === 6 && <CheckCircle className="w-5 h-5 mr-2" />}
        <h3 className={`font-semibold ${completed ? 'text-green-600' : 'text-gray-500'}`}>{title}</h3>
      </div>
      
      {completed ? (
        <div className="ml-7 text-sm">
          <p className="flex items-center mb-1">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>{formatDate(date)}</span>
          </p>
          {person && (
            <p className="flex items-center mb-1">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              <span>{person}</span>
            </p>
          )}
          {notes && (
            <p className="flex items-start mb-1">
              <Info className="w-4 h-4 mr-2 mt-1 text-gray-500" />
              <span>{notes}</span>
            </p>
          )}
          {showDuration && startDate && endDate && (
            <p className="flex items-center mb-1 text-blue-600">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span>Durasi: {calculateDuration(startDate, endDate)}</span>
            </p>
          )}
          {step === 5 && (
            <button
              onClick={handleViewROA}
              className="flex items-center mt-2 text-blue-500 hover:text-blue-600"
            >
              <Eye className="w-4 h-4 mr-1" /> Lihat ROA
            </button>
          )}
          {step === 6 && (
            <button
              onClick={handleViewCOA}
              className="flex items-center mt-2 text-blue-500 hover:text-blue-600"
            >
              <Eye className="w-4 h-4 mr-1" /> Lihat COA
            </button>
          )}
        </div>
      ) : (
        <div className="ml-7 text-sm text-gray-400">
          <p>Belum selesai</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-red-600 font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-50 p-4 rounded-md">
          <h2 className="text-yellow-600 font-semibold mb-2">Sample Tidak Ditemukan</h2>
          <p>Data sample yang dicari tidak tersedia.</p>
          <button 
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={handleBackClick}
            className="p-2 mr-4 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Detail Sample</h1>
        </div>
        
        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-sm ${
            currentStatus === 6 ? 'bg-green-100 text-green-800' : 
            currentStatus >= 3 ? 'bg-blue-100 text-blue-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {getStatusText(currentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4 flex items-center text-lg">
            <Package className="w-5 h-5 mr-2 text-blue-500" /> Detail Sample
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Sender</p>
              <p className="font-medium">{sample.sender_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kode Sample</p>
              <p className="font-medium">{sample.sample_code || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jumlah</p>
              <p className="font-medium">{sample.quantity || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lokasi</p>
              <p className="font-medium">{sample.lokasi_site || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4 flex items-center text-lg">
            <User className="w-5 h-5 mr-2 text-blue-500" /> Pengirim
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nama Pengirim</p>
              <p className="font-medium">{sample.sender_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium">{sample.received_quantity || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Received Date</p>
              <p className="font-medium">{formatDate(sample.received_date) || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Received by</p>
              <p className="font-medium">{sample.received_by || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4 flex items-center text-lg">
            <FileText className="w-5 h-5 mr-2 text-blue-500" /> Dokumen & Parameter
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Analyst By</p>
              <p className="font-medium">{sample.analyzed_by || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Parameter Uji</p>
              <p className="font-medium">{sample.analysis_notes || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status ROA</p>
              <p className="font-medium flex items-center">
                {sample.roa_issued_date ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1 text-green-500" /> 
                    Terbit ({formatDate(sample.roa_issued_date)})
                    <button
                      onClick={handleViewROA}
                      className="ml-2 text-blue-500 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  'Belum Terbit'
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status COA</p>
              <p className="font-medium flex items-center">
                {sample.coa_issued_date ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1 text-green-500" /> 
                    Terbit ({formatDate(sample.coa_issued_date)})
                    <button
                      onClick={handleViewCOA}
                      className="ml-2 text-blue-500 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  'Belum Terbit'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-md mb-8">
        <h2 className="font-semibold mb-6 flex items-center text-lg">
          <Calendar className="w-5 h-5 mr-2 text-blue-500" /> Timeline Tracking
        </h2>
        
        <div className="ml-2">
          <StepItem 
            step={1}
            title="Pengiriman Sample" 
            date={sample.sent_date}
            person={sample.sender_name}
            notes={sample.created_at}
            location={!!sample.lokasi_site}
            completed={!!sample.sent_date}
          />
          
          <StepItem 
            step={2}
            title="Penerimaan Sample" 
            date={sample.received_date}
            person={sample.receiver_name}
            notes={sample.updated_at}
            completed={!!sample.received_date}
          />
          
          <StepItem 
            step={3}
            title="Preparasi Sample" 
            date={sample.preparation_completed_date}
            startDate={sample.preparation_started_date || sample.received_date}
            endDate={sample.preparation_completed_date}
            person={sample.preparation_by}
            notes={sample.preparation_notes}
            completed={!!sample.preparation_completed_date}
            showDuration={true}
          />
          
          <StepItem 
            step={4}
            title="Analisa Sample" 
            date={sample.analysis_completed_date}
            startDate={sample.analysis_started_date || sample.preparation_completed_date}
            endDate={sample.analysis_completed_date}
            person={sample.analyzed_by}
            notes={sample.analysis_notes}
            completed={!!sample.analysis_completed_date}
            showDuration={true}
          />
          
          <StepItem 
            step={5}
            title="Penerbitan ROA" 
            date={sample.roa_issued_date}
            person={sample.roa_issued_by}
            notes={sample.updated_at}
            completed={!!sample.roa_issued_date}
          />
          
          <StepItem 
            step={6}
            title="Penerbitan COA" 
            date={sample.coa_issued_date}
            person={sample.coa_issued_by}
            notes={sample.updated_at}
            completed={!!sample.coa_issued_date}
          />
        </div>
      </div>

      {sample.test_results && (
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="font-semibold mb-6 flex items-center text-lg">
            <FileCheck className="w-5 h-5 mr-2 text-blue-500" /> Hasil Analisa
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">Parameter</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3">Hasil</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3">Nilai Acuan</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(sample.test_results) ? (
                  sample.test_results.map((result, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{result.parameter}</td>
                      <td className="p-3">{result.method}</td>
                      <td className="p-3 font-medium">{result.value}</td>
                      <td className="p-3">{result.unit}</td>
                      <td className="p-3">{result.reference_value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-3 text-center text-gray-500">
                      Data hasil analisa tidak tersedia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
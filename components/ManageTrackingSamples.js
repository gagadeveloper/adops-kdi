'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PackageCheck, Truck, FlaskConical, FileCheck, ClipboardCheck, 
  CheckCircle, ArrowRight, Edit, Trash2, Eye, Search, Plus
} from 'lucide-react';

export default function ManageTrackingSamples() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user data first
        const userResponse = await fetch('/api/users');
        if (!userResponse.ok) {
          console.error('User API failed with status:', userResponse.status);
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        
        // Ensure userData is an object (single user), not an array
        const currentUser = Array.isArray(userData) ? userData[0] : userData;
        
        console.log("Current user data:", currentUser);
        setUserData(currentUser);
        
        // Fetch all samples
        console.log("Fetching samples...");
        const samplesResponse = await fetch('/api/tracking-samples');
        if (!samplesResponse.ok) {
          console.error('Samples API failed with status:', samplesResponse.status);
          throw new Error('Failed to fetch samples');
        }
        const samplesData = await samplesResponse.json();
        console.log("Samples data received:", samplesData);
        setSamples(samplesData);
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

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

  const handleViewDetails = (sampleId) => {
    router.push(`/dashboard/manage-trackingsamples/${sampleId}`);
  };

  const handleEditSample = (sampleId) => {
    router.push(`/dashboard/manage-trackingsamples/edit/${sampleId}`);
  };

  const handleDeleteSample = (sample) => {
    setSampleToDelete(sample);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sampleToDelete) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/tracking-samples/${sampleToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sample');
      }
      
      // Remove the deleted sample from the state
      setSamples(samples.filter(sample => sample.id !== sampleToDelete.id));
      
      // Close the modal
      setDeleteModalOpen(false);
      setSampleToDelete(null);
    } catch (error) {
      console.error('Error deleting sample:', error);
      setError(error.message || 'Failed to delete sample');
    }
  };

  // const handleAddSample = () => {
  //   router.push('/dashboard/manage-trackingsamples/create');
  // };

  const filteredSamples = samples.filter(sample => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (sample.sample_code && sample.sample_code.toLowerCase().includes(searchLower)) ||
      (sample.sender_name && sample.sender_name.toLowerCase().includes(searchLower))
    );
  });

  const StepIcon = ({ step, completed }) => {
    const iconProps = { 
      className: `w-5 h-5 ${completed ? 'text-green-500' : 'text-gray-400'}` 
    };
    
    switch(step) {
      case 1: return <Truck {...iconProps} />;
      case 2: return <PackageCheck {...iconProps} />;
      case 3: return <FlaskConical {...iconProps} />;
      case 4: return <FileCheck {...iconProps} />;
      case 5: return <ClipboardCheck {...iconProps} />;
      case 6: return <CheckCircle {...iconProps} />;
      default: return null;
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Tracking Samples</h1>
        
        {/* <button
          onClick={handleAddSample}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Sample
        </button> */}
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-300 text-red-700 p-4 rounded-md">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-md shadow">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan kode sample atau pengirim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">Kode Sample</th>
                  <th className="p-3">Pengirim</th>
                  <th className="p-3">Tanggal Kirim</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSamples.length > 0 ? (
                  filteredSamples.map((sample) => {
                    const currentStatus = getStepStatus(sample);
                    
                    return (
                      <tr key={sample.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{sample.sample_code || '-'}</td>
                        <td className="p-3">{sample.sender_name || '-'}</td>
                        <td className="p-3">{formatDate(sample.sent_date)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            currentStatus === 6 ? 'bg-green-100 text-green-800' :
                            currentStatus >= 4 ? 'bg-blue-100 text-blue-800' :
                            currentStatus >= 2 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusText(currentStatus)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-1">
                            {[1, 2, 3, 4, 5, 6].map((step) => (
                              <div key={step} className="flex items-center">
                                <StepIcon 
                                  step={step} 
                                  completed={currentStatus >= step}
                                />
                                {step < 6 && <ArrowRight className="w-3 h-3 text-gray-300 mx-1" />}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(sample.id)}
                              className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Lihat Detail"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditSample(sample.id)}
                              className="p-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                              title="Edit Sample"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSample(sample)}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Hapus Sample"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data sample'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Konfirmasi Hapus</h3>
            <p className="mb-6">
              Anda yakin ingin menghapus sample dengan kode{" "}
              <span className="font-bold">{sampleToDelete?.sample_code || 'N/A'}</span>?
              <br />
              <span className="text-red-500 text-sm">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSampleToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
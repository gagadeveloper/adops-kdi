import { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Clock, User, Package, Info, FileText, ArrowLeft,
  Truck, PackageCheck, FlaskConical, FileCheck, ClipboardCheck, CheckCircle, 
  Eye, Download, Filter
} from 'lucide-react';

export default function TrackingSamplesCard() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    preparation: 0,
    analysis: 0,
    roa: 0,
    coa: 0
  });

  // Fetch data from API
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tracking-samples');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setSamples(data);
        calculateSummaryData(data);
      } catch (error) {
        console.error('Error fetching sample data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSamples();
  }, []);

  // Calculate summary statistics - counts entries for main card, not quantities
  const calculateSummaryData = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const summary = {
      today: 0,
      weekly: 0,
      monthly: 0,
      preparation: 0,
      analysis: 0,
      roa: 0,
      coa: 0
    };

    data.forEach(sample => {
      const createdDate = new Date(sample.created_at);
      
      // Count by time period using entry count (not quantity)
      if (createdDate >= today) {
        summary.today++;
      }
      if (createdDate >= oneWeekAgo) {
        summary.weekly++;
      }
      if (createdDate >= oneMonthAgo) {
        summary.monthly++;
      }
      
      // Count by status using entry count
      if (sample.preparation_completed_date && !sample.analysis_completed_date) {
        summary.preparation++;
      }
      if (sample.analysis_completed_date && !sample.roa_issued_date) {
        summary.analysis++;
      }
      if (sample.roa_issued_date && !sample.coa_issued_date) {
        summary.roa++;
      }
      if (sample.coa_issued_date) {
        summary.coa++;
      }
    });

    setSummaryData(summary);
  };

  const handleCardClick = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (sample) => {
    if (sample.coa_issued_date) return 'COA Terbit';
    if (sample.roa_issued_date) return 'ROA Terbit';
    if (sample.analysis_completed_date) return 'Analisa Selesai';
    if (sample.preparation_completed_date) return 'Preparasi Selesai';
    if (sample.received_date) return 'Sample Diterima';
    if (sample.sent_date) return 'Sample Dikirim';
    return 'Pendaftaran Sample';
  };

  const getStatusColor = (sample) => {
    if (sample.coa_issued_date) return 'bg-green-100 text-green-800';
    if (sample.roa_issued_date) return 'bg-orange-100 text-orange-800';
    if (sample.analysis_completed_date) return 'bg-yellow-100 text-yellow-800';
    if (sample.preparation_completed_date) return 'bg-blue-100 text-blue-800';
    if (sample.received_date) return 'bg-purple-100 text-purple-800';
    if (sample.sent_date) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  // Filter samples based on the modal type (today, weekly, monthly)
  const getFilteredSamples = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return samples.filter(sample => {
      const createdDate = new Date(sample.created_at);
      if (modalType === 'today') {
        return createdDate >= today;
      } else if (modalType === 'weekly') {
        return createdDate >= oneWeekAgo;
      } else if (modalType === 'monthly') {
        return createdDate >= oneMonthAgo;
      }
      return false;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // Get period text for modal title
  const getPeriodText = () => {
    if (modalType === 'today') {
      return 'Hari Ini';
    } else if (modalType === 'weekly') {
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return `${formatDate(oneWeekAgo)} - ${formatDate(now)}`;
    } else if (modalType === 'monthly') {
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return `${formatDate(oneMonthAgo)} - ${formatDate(now)}`;
    }
    return '';
  };

  // Calculate status counts for the filtered data
  // Status counts are based on number of entries, not quantity
  const getStatusCounts = (filteredSamples) => {
    const counts = {
      pendaftaran: 0,
      dikirim: 0,
      diterima: 0,
      preparasi: 0,
      analisa: 0,
      roa: 0,
      coa: 0
    };

    filteredSamples.forEach(sample => {
      if (sample.coa_issued_date) {
        counts.coa++;
      } else if (sample.roa_issued_date) {
        counts.roa++;
      } else if (sample.analysis_completed_date) {
        counts.analisa++;
      } else if (sample.preparation_completed_date) {
        counts.preparasi++;
      } else if (sample.received_date) {
        counts.diterima++;
      } else if (sample.sent_date) {
        counts.dikirim++;
      } else {
        counts.pendaftaran++;
      }
    });

    return counts;
  };

  // Calculate total quantity for filtered samples
  const getTotalQuantity = (filteredSamples) => {
    return filteredSamples.reduce((total, sample) => total + (sample.quantity || 1), 0);
  };

  // Calculate in-process count (count of samples, not quantity)
  const getInProcessCount = (counts) => {
    return counts.pendaftaran + counts.dikirim + counts.diterima + counts.preparasi + counts.analisa + counts.roa;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Activity className="mr-2" size={20} />
          Tracking Samples
        </h2>
        <div className="text-gray-500 text-sm flex items-center">
          <Calendar className="mr-1" size={16} />
          Last Updated: {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {/* Clickable stat cards */}
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <div 
                onClick={() => handleCardClick('today')}
                className="bg-blue-100 rounded p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="text-blue-800 text-lg font-bold">{summaryData.today}</div>
                <div className="text-blue-600 text-sm">Hari Ini</div>
              </div>
              
              <div 
                onClick={() => handleCardClick('weekly')}
                className="bg-green-100 rounded p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="text-green-800 text-lg font-bold">{summaryData.weekly}</div>
                <div className="text-green-600 text-sm">Minggu Ini</div>
              </div>
              
              <div 
                onClick={() => handleCardClick('monthly')}
                className="bg-purple-100 rounded p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="text-purple-800 text-lg font-bold">{summaryData.monthly}</div>
                <div className="text-purple-600 text-sm">Bulan Ini</div>
              </div>
            </div>
            
            {/* Status cards */}
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 rounded p-3">
                <div className="text-gray-800 text-lg font-bold">{summaryData.preparation}</div>
                <div className="text-gray-600 text-sm">Preparasi</div>
              </div>
              
              <div className="bg-yellow-100 rounded p-3">
                <div className="text-yellow-800 text-lg font-bold">{summaryData.analysis}</div>
                <div className="text-yellow-600 text-sm">Analisa</div>
              </div>
              
              <div className="bg-orange-100 rounded p-3">
                <div className="text-orange-800 text-lg font-bold">{summaryData.roa}</div>
                <div className="text-orange-600 text-sm">ROA</div>
              </div>
              
              <div className="bg-red-100 rounded p-3">
                <div className="text-red-800 text-lg font-bold">{summaryData.coa}</div>
                <div className="text-red-600 text-sm">COA</div>
              </div>
            </div>
          </div>

          {/* Monthly summary section */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-700">Ringkasan Bulanan</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Samples:</span>
                  <span className="font-medium">{summaryData.monthly}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selesai (COA):</span>
                  <span className="font-medium">{summaryData.coa}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dalam Proses:</span>
                  <span className="font-medium">{summaryData.preparation + summaryData.analysis + summaryData.roa}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tingkat Penyelesaian:</span>
                  <span className="font-medium">
                    {samples.length > 0 ? `${Math.round((summaryData.coa / samples.length) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-700">Status Proses</h3>
              <div className="space-y-3">
                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Preparasi
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {samples.length > 0 ? `${Math.round((summaryData.preparation / samples.length) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-3 text-xs flex rounded bg-blue-200">
                    <div style={{ width: `${samples.length > 0 ? (summaryData.preparation / samples.length) * 100 : 0}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                    </div>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                        Analisa
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-yellow-600">
                        {samples.length > 0 ? `${Math.round((summaryData.analysis / samples.length) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-3 text-xs flex rounded bg-yellow-200">
                    <div style={{ width: `${samples.length > 0 ? (summaryData.analysis / samples.length) * 100 : 0}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500">
                    </div>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                        ROA
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-orange-600">
                        {samples.length > 0 ? `${Math.round((summaryData.roa / samples.length) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-3 text-xs flex rounded bg-orange-200">
                    <div style={{ width: `${samples.length > 0 ? (summaryData.roa / samples.length) * 100 : 0}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Weekly/Monthly Modal with Table View */}
      {showModal && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <button 
                  onClick={closeModal}
                  className="p-2 mr-4 bg-white rounded-full shadow hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-semibold">
                  Sample Summary - {modalType === 'today' ? 'Hari Ini' : 
                                   modalType === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                </h3>
              </div>
              
              <div className="text-sm text-gray-500">
                Period: {getPeriodText()}
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-3">Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const filteredSamples = getFilteredSamples();
                  const counts = getStatusCounts(filteredSamples);
                  const totalQuantity = getTotalQuantity(filteredSamples);
                  return (
                    <>
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="text-gray-600 text-xs uppercase">Total Quantity</div>
                        <div className="text-2xl font-bold">{totalQuantity}</div>
                      </div>
                      
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="text-green-600 text-xs uppercase">Completed (COA)</div>
                        <div className="text-2xl font-bold">{counts.coa}</div>
                      </div>
                      
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="text-blue-600 text-xs uppercase">In Process</div>
                        <div className="text-2xl font-bold">
                          {getInProcessCount(counts)}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded p-3 shadow-sm">
                        <div className="text-purple-600 text-xs uppercase">Completion Rate</div>
                        <div className="text-2xl font-bold">
                          {filteredSamples.length > 0 ? `${Math.round((counts.coa / filteredSamples.length) * 100)}%` : '0%'}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Sample Table */}
            <div className="bg-white rounded-lg border mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode Sample
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengirim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Dikirim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredSamples().map((sample, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sample.sample_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sample.sender_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sample.sent_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sample.lokasi_site}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sample.quantity || 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sample)}`}>
                          {getStatusText(sample)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {getFilteredSamples().length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No samples found for this time period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Status Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-3">Status Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {(() => {
                  const counts = getStatusCounts(getFilteredSamples());
                  return (
                    <>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>Pendaftaran:</span>
                          <span className="font-medium">{counts.pendaftaran}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>Dikirim:</span>
                          <span className="font-medium">{counts.dikirim}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>Diterima:</span>
                          <span className="font-medium">{counts.diterima}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>Preparasi:</span>
                          <span className="font-medium">{counts.preparasi}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>Analisa:</span>
                          <span className="font-medium">{counts.analisa}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>ROA:</span>
                          <span className="font-medium">{counts.roa}</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded shadow-sm">
                        <div className="flex justify-between">
                          <span>COA:</span>
                          <span className="font-medium">{counts.coa}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {getFilteredSamples().length} sample entries with {getTotalQuantity(getFilteredSamples())} total quantity
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
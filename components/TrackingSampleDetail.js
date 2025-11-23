import { useState, useEffect } from 'react';
import { Check, Clock, Truck, FlaskConical, FileText, FileCheck, ChevronDown, ChevronRight, CheckCircle, AlertCircle, FileQuestion, Download } from "lucide-react";

export default function TrackingSampleDetail({ sampleId }) {
  const [loading, setLoading] = useState(true);
  const [sample, setSample] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});

  useEffect(() => {
    if (!sampleId) return;
    
    const fetchSample = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tracking-samples/${sampleId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setSample(data);
        
        // Determine active step based on data
        let currentStep = 'sent';
        if (data.coa_issued_date) {
          currentStep = 'coa';
        } else if (data.roa_issued_date) {
          currentStep = 'roa';
        } else if (data.analysis_completed_date) {
          currentStep = 'analysis';
        } else if (data.preparation_completed_date) {
          currentStep = 'preparation';
        } else if (data.received_date) {
          currentStep = 'received';
        }
        
        setActiveStep(currentStep);
        
        // Initialize expanded steps with the active step expanded
        setExpandedSteps({
          sent: currentStep === 'sent',
          received: currentStep === 'received',
          preparation: currentStep === 'preparation',
          analysis: currentStep === 'analysis',
          roa: currentStep === 'roa',
          coa: currentStep === 'coa'
        });
        
      } catch (err) {
        console.error('Failed to fetch sample:', err);
        setError('Gagal memuat data sampel');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSample();
  }, [sampleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileQuestion className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Data tidak ditemukan</h3>
            <div className="mt-2 text-sm text-yellow-700">
              Sampel dengan ID tersebut tidak ditemukan.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define timeline steps
  const timelineSteps = [
    {
      id: 'sent',
      title: 'Pengiriman Sampel',
      icon: <Truck size={20} />,
      complete: !!sample.sent_date,
      inProgress: activeStep === 'sent',
      date: sample.sent_date,
      details: [
        { label: 'Kode Sampel', value: sample.sample_code },
        { label: 'Lokasi', value: sample.lokasi_site || '-' },
        { label: 'Pengirim', value: sample.sender_name },
        { label: 'Jumlah', value: `${sample.quantity} sampel` },
        { label: 'Kode Barcode/Seal', value: sample.barcode_seal || '-' },
        { label: 'Nama Driver', value: sample.driver_name || '-' },
        { label: 'Nomor Plat', value: sample.plate_number || '-' },
        { label: 'Tanggal Kirim', value: sample.sent_date ? new Date(sample.sent_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Dikirim oleh', value: sample.sent_by || '-' }
      ],
      attachments: [
        { label: 'Foto', url: sample.photo_url, type: 'image' },
        { label: 'Dokumen', url: sample.document_url, type: 'document' }
      ]
    },
    {
      id: 'received',
      title: 'Penerimaan Sampel',
      icon: <CheckCircle size={20} />,
      complete: !!sample.received_date,
      inProgress: activeStep === 'received',
      date: sample.received_date,
      details: [
        { label: 'Penerima', value: sample.receiver_name || '-' },
        { label: 'Jumlah Diterima', value: sample.received_quantity ? `${sample.received_quantity} sampel` : '-' },
        { label: 'Tanggal Diterima', value: sample.received_date ? new Date(sample.received_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Diterima oleh', value: sample.received_by || '-' }
      ],
      attachments: [
        { label: 'Foto Penerimaan', url: sample.received_photo_url, type: 'image' }
      ]
    },
    {
      id: 'preparation',
      title: 'Preparasi Sampel',
      icon: <FlaskConical size={20} />,
      complete: !!sample.preparation_completed_date,
      inProgress: activeStep === 'preparation',
      date: sample.preparation_completed_date || sample.preparation_started_date,
      details: [
        { label: 'Status', value: sample.preparation_status || '-' },
        { label: 'Catatan', value: sample.preparation_notes || '-' },
        { label: 'Tanggal Mulai', value: sample.preparation_started_date ? new Date(sample.preparation_started_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Tanggal Selesai', value: sample.preparation_completed_date ? new Date(sample.preparation_completed_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Dipreparasi oleh', value: sample.prepared_by || '-' }
      ],
      attachments: []
    },
    {
      id: 'analysis',
      title: 'Analisis Sampel',
      icon: <FileText size={20} />,
      complete: !!sample.analysis_completed_date,
      inProgress: activeStep === 'analysis',
      date: sample.analysis_completed_date || sample.analysis_started_date,
      details: [
        { label: 'Status', value: sample.analysis_status || '-' },
        { label: 'Catatan', value: sample.analysis_notes || '-' },
        { label: 'Tanggal Mulai', value: sample.analysis_started_date ? new Date(sample.analysis_started_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Tanggal Selesai', value: sample.analysis_completed_date ? new Date(sample.analysis_completed_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Dianalisis oleh', value: sample.analyzed_by || '-' }
      ],
      attachments: []
    },
    {
      id: 'roa',
      title: 'Laporan Hasil Analisis (ROA)',
      icon: <FileText size={20} />,
      complete: !!sample.roa_issued_date,
      inProgress: activeStep === 'roa',
      date: sample.roa_issued_date || sample.roa_created_date,
      details: [
        { label: 'Status', value: sample.roa_status || '-' },
        { label: 'Tanggal Dibuat', value: sample.roa_created_date ? new Date(sample.roa_created_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Tanggal Terbit', value: sample.roa_issued_date ? new Date(sample.roa_issued_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Dibuat oleh', value: sample.roa_created_by || '-' }
      ],
      attachments: [
        { label: 'Dokumen ROA', url: sample.roa_document_url || sample.roa_path, type: 'document' }
      ]
    },
    {
      id: 'coa',
      title: 'Sertifikat Analisis (COA)',
      icon: <FileCheck size={20} />,
      complete: !!sample.coa_issued_date,
      inProgress: activeStep === 'coa',
      date: sample.coa_issued_date || sample.coa_created_date || sample.coa_review_date,
      details: [
        { label: 'Draft COA', value: sample.coa_draft_date ? 'Tersedia' : 'Belum tersedia' },
        { label: 'Tanggal Draft', value: sample.coa_draft_date ? new Date(sample.coa_draft_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Status Review', value: sample.coa_review_status || '-' },
        { label: 'Reviewer', value: sample.coa_reviewer || '-' },
        { label: 'Tanggal Review', value: sample.coa_review_date ? new Date(sample.coa_review_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Tanggal Dibuat', value: sample.coa_created_date ? new Date(sample.coa_created_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Tanggal Terbit', value: sample.coa_issued_date ? new Date(sample.coa_issued_date).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '-' },
        { label: 'Dibuat oleh', value: sample.coa_created_by || '-' }
      ],
      attachments: [
        { label: 'Draft COA', url: sample.coa_draft_url, type: 'document' },
        { label: 'Dokumen COA', url: sample.coa_document_url || sample.coa_path, type: 'document' }
      ]
    }
  ];

  // Get current progress percentage
  const getProgressPercentage = () => {
    const stepsMap = {
      'sent': 16,
      'received': 33,
      'preparation': 50,
      'analysis': 67,
      'roa': 84,
      'coa': 100
    };
    return stepsMap[activeStep] || 0;
  };

  // Format detail date
  const formatDetailDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle step details
  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detail Tracking Sample</h2>
            <p className="mt-1 text-sm text-gray-500">
              Kode: <span className="font-medium">{sample.sample_code}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeStep === 'coa' ? 'Selesai' : 'Dalam Proses'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${getProgressPercentage()}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500 text-right">
            Progress: {getProgressPercentage()}%
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline Proses</h3>
        <div className="space-y-6">
          {timelineSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {index < timelineSteps.length - 1 && (
                <div className={`absolute top-8 left-4 -ml-px h-full w-0.5 ${step.complete ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              )}
              
              <div className="relative flex items-start">
                {/* Icon */}
                <div className={`relative flex items-center justify-center h-8 w-8 rounded-full ${
                  step.complete ? 'bg-blue-500' : step.inProgress ? 'bg-yellow-500' : 'bg-gray-300'
                } text-white z-10`}>
                  {step.complete ? <Check size={16} /> : step.inProgress ? <Clock size={16} /> : step.icon}
                </div>
                
                {/* Content */}
                <div className="ml-4 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {step.title}
                    </div>
                    <button 
                      onClick={() => toggleStep(step.id)}
                      className="ml-2 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {expandedSteps[step.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {step.date ? formatDetailDate(step.date) : 'Belum diproses'}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="mt-1">
                    {step.complete ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check size={12} className="mr-1" /> Selesai
                      </span>
                    ) : step.inProgress ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} className="mr-1" /> Dalam Proses
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Menunggu
                      </span>
                    )}
                  </div>
                  
                  {/* Expanded details */}
                  {expandedSteps[step.id] && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium text-gray-500">{detail.label}:</span>{' '}
                            <span className="text-gray-900">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Attachments */}
                      {step.attachments && step.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Lampiran:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {step.attachments.map((attachment, idx) => (
                              attachment.url ? (
                                <div key={idx} className="flex items-center space-x-2">
                                  <Download size={16} className="text-blue-500" />
                                  <a 
                                    href={attachment.url} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {attachment.label}
                                  </a>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional info */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Dibuat: {formatDetailDate(sample.created_at)}
            </p>
            <p className="text-sm text-gray-500">
              Terakhir diupdate: {formatDetailDate(sample.updated_at)}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500">
              ID: {sample.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
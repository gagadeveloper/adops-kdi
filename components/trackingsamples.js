'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PackageCheck, Truck, FlaskConical, FileCheck, ClipboardCheck, 
  Upload, CheckCircle, ArrowRight
} from 'lucide-react';

export default function TrackingSamplesDashboard() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the current logged-in user data
        const userResponse = await fetch('/api/auth/session');
        if (!userResponse.ok) throw new Error('Failed to fetch user session');
        const sessionData = await userResponse.json();
        
        // Use the session user data or fetch complete user details if needed
        if (sessionData?.user?.id) {
          const userDetailsResponse = await fetch(`/api/users/${sessionData.user.id}`);
          if (userDetailsResponse.ok) {
            const userDetails = await userDetailsResponse.json();
            setUserData(userDetails);
            console.log("Current user data:", userDetails);
            
            // Set default active filter based on user role
            if (userDetails.roleId === 9) { // Inspector
              setActiveFilter('step1');
            }
          }
        } else {
          // Fallback to the current approach if session-based auth isn't implemented
          const usersResponse = await fetch('/api/users');
          if (!usersResponse.ok) throw new Error('Failed to fetch user data');
          const usersData = await usersResponse.json();
          
          // Use the first user as the current user (not ideal, but matches your current implementation)
          const currentUser = Array.isArray(usersData) ? usersData[0] : usersData;
          setUserData(currentUser);
          console.log("Current user data:", currentUser);
          
          // Set default active filter based on user role
          if (currentUser.roleId === 9) { // Inspector
              setActiveFilter('step1');
          }
        }
        
        // Fetch samples
        const samplesResponse = await fetch('/api/tracking-samples');
        if (!samplesResponse.ok) throw new Error('Failed to fetch samples');
        const samplesData = await samplesResponse.json();
        setSamples(samplesData);
        
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  // Determine which steps the current user can access
  const getUserAccessibleSteps = () => {
    if (!userData || !userData.roleId) return [];
    
    // Konversi roleId ke peran yang sesuai berdasarkan tabel Role dari database
    const roleIdToRole = {
      1: 'super admin',
      2: 'admin',
      7: 'staff',
      9: 'inspector',
      13: 'lab_prep',
      14: 'analyst',
      15: 'roa_creator',
      16: 'coa_creator',
      17: 'rom',
      18: 'coa_reviewer'
    };
    
    const role = roleIdToRole[userData.roleId] || '';
    console.log("User role for permission check:", role);
    
    // Map roles to accessible steps
    const roleStepMapping = {
      'inspector': ['step1'],  // Inspector can only access step1
      'adops_receiver': ['step2'],
      'staff': ['step2'],
      'lab_prep': ['step3'],
      'analyst': ['step4'],
      'roa_creator': ['step5'],
      'coa_creator': ['step6'],
      'coa_reviewer': ['step6'],
      'admin': ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'],
      'super admin': ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'],
      'rom': [] // ROM has no direct process steps, only view access
    };
    
    console.log("Role mapped to steps:", roleStepMapping[role] || []);
    return roleStepMapping[role] || [];
  };

  const getStepStatus = (sample) => {
    if (sample.coa_issued_date) return 6;
    if (sample.roa_issued_date) return 5;
    if (sample.analysis_completed_date) return 4;
    if (sample.preparation_completed_date) return 3;
    if (sample.received_date) return 2;
    if (sample.sent_date) return 1;
    return 0; // Newly created sample
  };

  const filterSamplesByStep = (step) => {
    if (step === 'all') return samples;
    
    return samples.filter(sample => {
      const status = getStepStatus(sample);
      
      // Memperbaiki logika filter untuk mencocokkan workflow step dengan benar
      if (step === 'step1') return status === 0 || status === 1; // Samples that need sending info
      if (step === 'step2') return status === 1; // Samples that have been sent but not received
      if (step === 'step3') return status === 2; // Samples that have been received but not prepped
      if (step === 'step4') return status === 3; // Samples that have been prepped but not analyzed
      if (step === 'step5') return status === 4; // Samples that have been analyzed but no ROA
      if (step === 'step6') return status === 5; // Samples with ROA but no COA
      
      return false;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleActionClick = (sampleId, step) => {
    router.push(`/dashboard/adopsi/tracking-samples/${step}/${sampleId}`);
  };

  const handleViewDetails = (sampleId) => {
    router.push(`/dashboard/adopsi/tracking-samples/${sampleId}`);
  };

  const handleAddSample = () => {
    // Only inspectors should add new samples
    router.push('/dashboard/adopsi/tracking-samples/step1');
  };

  const filteredSamples = filterSamplesByStep(activeFilter);
  const accessibleSteps = getUserAccessibleSteps();
  
  // Check if user is an inspector (roleId: 9) or ROM (roleId: 17)
  const isInspector = userData?.roleId === 9;
  const isROM = userData?.roleId === 17;
  
  console.log("User has access to steps:", accessibleSteps);
  console.log("Active filter:", activeFilter);
  console.log("Is user an inspector:", isInspector);
  console.log("Is user ROM:", isROM);
  console.log("Filtered samples count:", filteredSamples.length);

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

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tracking Samples</h1>
        
        {/* Add sample button only for inspectors */}
        {isInspector && (
          <button
            onClick={handleAddSample}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Tambah Sample
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {/* Show All tab for non-inspectors */}
          {!isInspector && (
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded ${
                activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Semua
            </button>
          )}
          
          {/* Only show tabs that the user can access (ROM doesn't see any process tabs) */}
          {!isROM && accessibleSteps.includes('step1') && (
            <button
              onClick={() => setActiveFilter('step1')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step1' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Pengiriman
            </button>
          )}
          
          {!isROM && accessibleSteps.includes('step2') && (
            <button
              onClick={() => setActiveFilter('step2')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step2' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <PackageCheck className="w-4 h-4" /> Penerimaan
            </button>
          )}
          
          {!isROM && accessibleSteps.includes('step3') && (
            <button
              onClick={() => setActiveFilter('step3')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step3' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <FlaskConical className="w-4 h-4" /> Preparasi
            </button>
          )}
          
          {!isROM && accessibleSteps.includes('step4') && (
            <button
              onClick={() => setActiveFilter('step4')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step4' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Analisa
            </button>
          )}
          
          {!isROM && accessibleSteps.includes('step5') && (
            <button
              onClick={() => setActiveFilter('step5')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step5' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> ROA
            </button>
          )}
          
          {!isROM && accessibleSteps.includes('step6') && (
            <button
              onClick={() => setActiveFilter('step6')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeFilter === 'step6' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> COA
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-md overflow-hidden">
        {loading ? (
          <p className="p-4 text-center">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">Kode Sample</th>
                  <th className="p-3">Pengirim</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Tanggal Kirim</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSamples.length > 0 ? (
                  filteredSamples.map((sample) => {
                    const currentStatus = getStepStatus(sample);
                    
                    return (
                      <tr key={sample.id} className="border-t">
                        <td className="p-3">{sample.sample_code || '-'}</td>
                        <td className="p-3">{sample.sender_name || '-'}</td>
                        <td className="p-3">{sample.lokasi_site || '-'}</td>
                        <td className="p-3">{sample.quantity || '-'}</td>
                        <td className="p-3">{formatDate(sample.sent_date)}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
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
                        <td className="p-3 text-right">
                          {/* For ROM users, always show View Detail button */}
                          {isROM ? (
                            <button
                              onClick={() => handleViewDetails(sample.id)}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Lihat Detail
                            </button>
                          ) : (
                            /* For other users, show appropriate action buttons based on role and sample status */
                            (() => {
                              // Step 1: Inspector can update sending info for new samples
                              if (currentStatus === 0 && accessibleSteps.includes('step1')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step1')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Update Pengiriman
                                  </button>
                                );
                              }
                              
                              // Step 2: Staff can confirm receipt for sent samples
                              if (currentStatus === 1 && accessibleSteps.includes('step2')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step2')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Konfirmasi Penerimaan
                                  </button>
                                );
                              }
                              
                              // Step 3: Lab prep can update preparation status
                              if (currentStatus === 2 && accessibleSteps.includes('step3')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step3')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Update Preparasi
                                  </button>
                                );
                              }
                              
                              // Step 4: Analyst can update analysis status
                              if (currentStatus === 3 && accessibleSteps.includes('step4')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step4')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Update Analisa
                                  </button>
                                );
                              }
                              
                              // Step 5: ROA creator can manage ROA
                              if (currentStatus === 4 && accessibleSteps.includes('step5')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step5')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Proses ROA
                                  </button>
                                );
                              }
                              
                              // Step 6: COA creator/reviewer can manage COA
                              if (currentStatus === 5 && accessibleSteps.includes('step6')) {
                                return (
                                  <button
                                    onClick={() => handleActionClick(sample.id, 'step6')}
                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Proses COA
                                  </button>
                                );
                              }
                              
                              // View details for completed or inaccessible samples
                              return (
                                <button
                                  onClick={() => handleViewDetails(sample.id)}
                                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Lihat Detail
                                </button>
                              );
                            })()
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
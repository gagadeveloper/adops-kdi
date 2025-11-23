'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, Save, CheckCircle, CalendarIcon, 
  Upload, FileText, XCircle, Edit, Clock, AlertCircle,
  Lock, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react';

export default function Step6({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    coa_review_status: 'pending',
    coa_reviewer: '',
    coa_created_by: '',
    coa_draft_url: '',
    coa_document_url: '',
    coa_review_comment: ''
  });
  const [draftFile, setDraftFile] = useState(null);
  const [finalFile, setFinalFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('draft'); // draft, review, final
  
  // Get the sample ID from params
  const id = params?.id ? params.id : null;
  
  // Debug log to check the ID value
  console.log("Sample ID from params:", id);
  
  // Fetch existing sample data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID sample tidak ditemukan');
        setLoading(false);
        return;
      }

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
        
        // Fetch current user data - trying multiple methods for robustness
        try {
          const userResponse = await fetch('/api/auth/session');
          if (userResponse.ok) {
            const sessionData = await userResponse.json();
            
            let currentUser = null;
            
            // If we have session user data, fetch complete user details
            if (sessionData?.user?.id) {
              const userDetailsResponse = await fetch(`/api/users/${sessionData.user.id}`);
              if (userDetailsResponse.ok) {
                currentUser = await userDetailsResponse.json();
              }
            } 
            
            if (!currentUser) {
              // Fallback to generic user fetch if session approach fails
              const usersResponse = await fetch('/api/users');
              if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                currentUser = Array.isArray(usersData) ? usersData[0] : usersData;
              } else {
                throw new Error('Failed to fetch user data');
              }
            }
            
            console.log("Retrieved user data:", currentUser);
            setUserData(currentUser);
            
            // Pre-populate form data with existing COA info if available
            setFormData({
              coa_review_status: sampleData.coa_review_status || 'pending',
              coa_reviewer: sampleData.coa_reviewer || '',
              coa_created_by: sampleData.coa_created_by || (currentUser?.name || ''),
              coa_draft_url: sampleData.coa_draft_url || '',
              coa_document_url: sampleData.coa_document_url || '',
              coa_review_comment: sampleData.coa_review_comment || ''
            });
            
            // Set appropriate tab based on COA status and user role
            if (sampleData.coa_issued_date) {
              setCurrentTab('final');
            } else if ((sampleData.coa_review_status === 'approved' || 
                        sampleData.coa_review_status === 'rejected' || 
                        sampleData.coa_review_status === 'needs_revision') || 
                      (currentUser?.role === 'coa_reviewer' || currentUser?.roleId === 18)) {
              setCurrentTab('review');
            } else {
              setCurrentTab('draft');
            }
          } else {
            throw new Error('Failed to fetch session data');
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          setError('Gagal mengambil data pengguna. Silakan muat ulang halaman.');
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Gagal mengambil data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
  
    if (id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Check if the current user has a specific role
  const hasRole = (roleName) => {
    if (!userData) return false;
    
    // Check direct role property if available
    if (userData.role === roleName) return true;
    
    // Or check roleId mapping if using numeric role IDs
    const roleIdToRole = {
      1: 'super_admin',
      2: 'admin',
      16: 'coa_creator',  // assuming this is coa_admin
      18: 'coa_reviewer'  // adding this role ID for reviewers
    };
    
    return roleIdToRole[userData.roleId] === roleName;
  };

  // Check if the user is allowed to access the review tab
  const canAccessReview = () => {
    return hasRole('coa_reviewer') || hasRole('super_admin') || hasRole('admin');
  };

  // Check if the user can submit the review form
  const canSubmitReview = () => {
    return hasRole('coa_reviewer') || hasRole('super_admin') || hasRole('admin');
  };

  // Check if user can access the draft tab
  const canAccessDraft = () => {
    return hasRole('coa_creator') || hasRole('super_admin') || hasRole('admin');
  };

  // Check if the user can submit the draft form
  const canSubmitDraft = () => {
    return hasRole('coa_creator') || hasRole('super_admin') || hasRole('admin');
  };

  // Check if draft needs revision
  const draftNeedsRevision = () => {
    return formData.coa_review_status === 'needs_revision' || formData.coa_review_status === 'rejected';
  };

  // Handle tab change with permission check
  const handleTabChange = (tab) => {
    if (tab === 'review' && !canAccessReview()) {
      // If user doesn't have permission, show an error or notification
      setError('Anda tidak memiliki akses untuk melakukan review. Hanya coa_reviewer yang dapat mengakses tab ini.');
      return;
    }
    
    if (tab === 'draft' && !canAccessDraft()) {
      setError('Anda tidak memiliki akses untuk membuat draft. Hanya coa_creator yang dapat mengakses tab ini.');
      return;
    }
    
    // Clear any previous errors
    setError('');
    setCurrentTab(tab);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (fileType, e) => {
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
    
    if (fileType === 'draft') {
      setDraftFile(selectedFile);
    } else if (fileType === 'final') {
      setFinalFile(selectedFile);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    
    try {
      // Method 1: Using FormData to upload via server-side handler (recommended)
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData, // No Content-Type header needed - browser sets it with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengunggah file');
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle review action (approve or request revision)
  const handleReviewAction = async (action) => {
    if (!canSubmitReview()) {
      setError('Anda tidak memiliki izin untuk melakukan review COA');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const reviewStatus = action === 'approve' ? 'approved' : 'needs_revision';
      
      const requestData = { 
        ...formData,
        coa_review_status: reviewStatus,
        coa_review_date: new Date().toISOString(),
        coa_reviewer: formData.coa_reviewer || (userData?.name || '') // Ensure reviewer name is set
      };
      
      console.log(`Sending review action (${action}) for sample ${id}`);
      console.log("Request data:", requestData);
      
      // Send data to API
      const response = await fetch(`/api/tracking-samples/step6/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan data');
      }

      // Update local state
      setFormData(prev => ({ ...prev, coa_review_status: reviewStatus }));
      
      // Show success message
      if (action === 'approve') {
        alert('Draft COA berhasil disetujui');
      } else {
        alert('Permintaan revisi draft COA berhasil dikirim');
      }
      
      // Reload data
      router.refresh();
      
    } catch (error) {
      console.error('Error submitting review action:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view draft
  const handleViewDraft = () => {
    if (formData.coa_draft_url) {
      window.open(formData.coa_draft_url, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate that ID exists
    if (!id) {
      setError('ID sample tidak ditemukan');
      return;
    }
    
    // Validate user permissions
    if (currentTab === 'draft' && !canSubmitDraft()) {
      setError('Anda tidak memiliki izin untuk menyimpan draft COA');
      return;
    }
    
    if (currentTab === 'review' && !canSubmitReview()) {
      setError('Anda tidak memiliki izin untuk melakukan review COA');
      return;
    }
    
    setSubmitting(true);

    try {
      // Create request data
      const requestData = { ...formData };
      
      // Handle file uploads based on current tab
      if (currentTab === 'draft' && draftFile) {
        try {
          const draftUrl = await uploadFile(draftFile);
          if (!draftUrl) throw new Error('Gagal mendapatkan URL untuk draft yang diunggah');
          
          requestData.coa_draft_url = draftUrl;
          requestData.coa_draft_date = new Date().toISOString();
          requestData.coa_created_date = sampleData.coa_created_date || new Date().toISOString();
          
          // If this is a revision, set status back to pending
          if (draftNeedsRevision()) {
            requestData.coa_review_status = 'pending';
          }
        } catch (uploadError) {
          throw new Error('Gagal mengunggah draft COA: ' + uploadError.message);
        }
      } else if (currentTab === 'review') {
        requestData.coa_review_date = new Date().toISOString();
      } else if (currentTab === 'final' && finalFile) {
        try {
          const finalUrl = await uploadFile(finalFile);
          if (!finalUrl) throw new Error('Gagal mendapatkan URL untuk dokumen final yang diunggah');
          
          requestData.coa_document_url = finalUrl;
          requestData.coa_issued_date = new Date().toISOString();
        } catch (uploadError) {
          throw new Error('Gagal mengunggah dokumen COA final: ' + uploadError.message);
        }
      }
      
      console.log(`Sending PUT request to /api/tracking-samples/step6/${id}`);
      console.log("Request data:", requestData);
      
      // Send data to API
      const response = await fetch(`/api/tracking-samples/step6/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan data');
      }

      // Show success message and redirect
      if (currentTab === 'draft') {
        if (draftNeedsRevision()) {
          alert('Revisi draft COA berhasil diunggah');
        } else {
          alert('Draft COA berhasil disimpan');
        }
      } else if (currentTab === 'final') {
        alert('COA Final berhasil diunggah');
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
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              Kelola COA (Certificate of Analysis)
            </h1>
          </div>
          <div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium text-red-700">{error}</p>
            <button 
              onClick={() => setError('')}
              className="mt-2 text-sm text-blue-600 hover:underline"
              type="button"
            >
              Tutup pesan
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
                <p className="text-gray-600">Status ROA:</p>
                <p className="font-semibold">
                  {sampleData.roa_status === 'issued' ? 'Diterbitkan' : 
                   sampleData.roa_status === 'in_progress' ? 'Sedang Diproses' :
                   sampleData.roa_status === 'draft' ? 'Draft' :
                   sampleData.roa_status === 'review' ? 'Dalam Review' :
                   sampleData.roa_status === 'on_hold' ? 'Ditunda' : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Badge - Show current COA status */}
        {formData.coa_review_status && (
          <div className={`p-3 ${
            formData.coa_review_status === 'approved' ? 'bg-green-50 border-l-4 border-green-500' :
            formData.coa_review_status === 'needs_revision' || formData.coa_review_status === 'rejected' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
            'bg-gray-50 border-l-4 border-gray-500'
          }`}>
            <p className={`font-medium ${
              formData.coa_review_status === 'approved' ? 'text-green-700' :
              formData.coa_review_status === 'needs_revision' || formData.coa_review_status === 'rejected' ? 'text-yellow-700' :
              'text-gray-700'
            }`}>
              Status COA: {
                formData.coa_review_status === 'pending' ? 'Menunggu Review' :
                formData.coa_review_status === 'in_review' ? 'Sedang Direview' :
                formData.coa_review_status === 'needs_revision' || formData.coa_review_status === 'rejected' ? 'Perlu Revisi' :
                formData.coa_review_status === 'approved' ? 'Disetujui' : formData.coa_review_status
              }
            </p>
            {(formData.coa_review_status === 'needs_revision' || formData.coa_review_status === 'rejected') && formData.coa_review_comment && (
              <p className="mt-1 text-sm text-yellow-600">
                Catatan revisi: {formData.coa_review_comment}
              </p>
            )}
          </div>
        )}

        {sampleData && (
          <div className="border-b">
            <div className="flex border-b">
              <button
                onClick={() => handleTabChange('draft')}
                className={`px-4 py-3 font-medium text-sm relative ${
                  currentTab === 'draft' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${!canAccessDraft() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canAccessDraft()}
                type="button"
              >
                <div className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>{draftNeedsRevision() ? 'Revisi Draft COA' : 'Draft COA'}</span>
                  {!canAccessDraft() && (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('review')}
                className={`px-4 py-3 font-medium text-sm relative ${
                  currentTab === 'review' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${!canAccessReview() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canAccessReview() || !formData.coa_draft_url}
                type="button"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Review</span>
                  {!canAccessReview() && (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </button>
              <button
                onClick={() => handleTabChange('final')}
                className={`px-4 py-3 font-medium text-sm ${
                  currentTab === 'final' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                type="button"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Final COA</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {sampleData && (
          <form onSubmit={handleSubmit} className="p-6">
            {currentTab === 'draft' && (
              <div className="space-y-6">
                {!canSubmitDraft() && (
                  <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Akses Terbatas</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Anda tidak memiliki izin untuk membuat atau mengubah draft COA. Hanya coa_creator yang dapat mengelola draft.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Show revision notice if needed */}
                {draftNeedsRevision() && (
                  <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Revisi Diperlukan</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Draft COA memerlukan revisi. Silakan unggah draft yang telah direvisi.
                      </p>
                      {formData.coa_review_comment && (
                        <p className="text-sm text-yellow-600 mt-1">
                          <span className="font-medium">Catatan reviewer:</span> {formData.coa_review_comment}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="coa_created_by" className="block text-sm font-medium text-gray-700 mb-1">
                    Pembuat Draft COA
                  </label>
                  <input
                    type="text"
                    id="coa_created_by"
                    name="coa_created_by"
                    value={formData.coa_created_by}
                    onChange={handleChange}
                    required
                    disabled={!canSubmitDraft()}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${!canSubmitDraft() ? 'bg-gray-100' : ''}`}
                  />
                </div>

                <div>
                  <label htmlFor="draft_file" className="block text-sm font-medium text-gray-700 mb-1">
                    Unggah {draftNeedsRevision() ? 'Revisi ' : ''}Draft COA
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      id="draft_file"
                      onChange={(e) => handleFileChange('draft', e)}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      disabled={!canSubmitDraft()}
                    />
                    <div className="flex items-center space-x-2">
                      <label 
                        htmlFor="draft_file" 
                        className={`px-4 py-2 border border-gray-300 rounded-md flex items-center space-x-2 ${
                          !canSubmitDraft() 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{draftFile ? 'Ganti File' : 'Pilih File'}</span>
                      </label>
                      {draftFile && <span className="text-sm text-blue-600">{draftFile.name}</span>}
                      {formData.coa_draft_url && !draftFile && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <a
                            href={formData.coa_draft_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Lihat Draft COA
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
                </div>

                {sampleData.coa_draft_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>
                      Draft COA dibuat pada: {new Date(sampleData.coa_draft_date).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {currentTab === 'review' && (
              <div className="space-y-6">
                {!canSubmitReview() && (
                  <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Akses Terbatas</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Anda tidak memiliki izin untuk melakukan review COA. Hanya coa_reviewer yang dapat melakukan review.
                      </p>
                    </div>
                  </div>
                )}
                
                {!formData.coa_draft_url && (
                  <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Draft COA belum tersedia</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Draft COA harus diunggah terlebih dahulu oleh coa_creator sebelum dapat direview.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="coa_reviewer" className="block text-sm font-mediumtext-gray-700 mb-1">
                    Nama Reviewer
                  </label>
                  <input
                    type="text"
                    id="coa_reviewer"
                    name="coa_reviewer"
                    value={formData.coa_reviewer}
                    onChange={handleChange}
                    required
                    disabled={!canSubmitReview()}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${!canSubmitReview() ? 'bg-gray-100' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draft COA untuk di-review
                  </label>
                  {formData.coa_draft_url ? (
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={handleViewDraft}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Draft COA
                      </button>
                      <span className="text-sm text-gray-500 mt-2 sm:mt-0 sm:ml-4">
                        Dibuat oleh: {formData.coa_created_by || 'Tidak diketahui'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Belum ada draft COA yang diunggah.
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="coa_review_comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Komentar Review
                  </label>
                  <textarea
                    id="coa_review_comment"
                    name="coa_review_comment"
                    rows={4}
                    value={formData.coa_review_comment}
                    onChange={handleChange}
                    disabled={!canSubmitReview() || !formData.coa_draft_url}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${(!canSubmitReview() || !formData.coa_draft_url) ? 'bg-gray-100' : ''}`}
                    placeholder="Berikan catatan review untuk draft COA ini..."
                  />
                </div>

                {/* Review action buttons */}
                {canSubmitReview() && formData.coa_draft_url && (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => handleReviewAction('approve')}
                      disabled={submitting}
                      className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      ) : (
                        <ThumbsUp className="mr-2 h-4 w-4" />
                      )}
                      Setujui Draft COA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewAction('reject')}
                      disabled={submitting || !formData.coa_review_comment}
                      className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      ) : (
                        <ThumbsDown className="mr-2 h-4 w-4" />
                      )}
                      Minta Revisi
                    </button>
                  </div>
                )}

                {sampleData.coa_review_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>
                      Terakhir direview pada: {new Date(sampleData.coa_review_date).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {currentTab === 'final' && (
              <div className="space-y-6">
                {formData.coa_review_status !== 'approved' && (
                  <div className="bg-yellow-50 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700">Draft COA belum disetujui</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Draft COA harus disetujui oleh reviewer sebelum COA final dapat diunggah.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="final_file" className="block text-sm font-medium text-gray-700 mb-1">
                    Unggah COA Final
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      id="final_file"
                      onChange={(e) => handleFileChange('final', e)}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      disabled={formData.coa_review_status !== 'approved'}
                    />
                    <div className="flex items-center space-x-2">
                      <label 
                        htmlFor="final_file" 
                        className={`px-4 py-2 border border-gray-300 rounded-md flex items-center space-x-2 ${
                          formData.coa_review_status !== 'approved' 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{finalFile ? 'Ganti File' : 'Pilih File'}</span>
                      </label>
                      {finalFile && <span className="text-sm text-blue-600">{finalFile.name}</span>}
                      {formData.coa_document_url && !finalFile && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <a
                            href={formData.coa_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Lihat COA Final
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
                </div>

                {sampleData.coa_issued_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>
                      COA diterbitkan pada: {new Date(sampleData.coa_issued_date).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Kembali
              </button>
              
              {currentTab === 'draft' && (
                <button
                  type="submit"
                  disabled={submitting || !canSubmitDraft() || (!draftFile && !formData.coa_draft_url)}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    submitting || !canSubmitDraft() || (!draftFile && !formData.coa_draft_url)
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {draftNeedsRevision() ? 'Simpan Revisi' : 'Simpan Draft'}
                    </>
                  )}
                </button>
              )}
              
              {currentTab === 'final' && (
                <button
                  type="submit"
                  disabled={submitting || formData.coa_review_status !== 'approved' || (!finalFile && !formData.coa_document_url)}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    submitting || formData.coa_review_status !== 'approved' || (!finalFile && !formData.coa_document_url)
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Terbitkan COA Final
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
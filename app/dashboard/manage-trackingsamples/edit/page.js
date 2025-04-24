'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, Save, Loader2
} from 'lucide-react';

export default function EditSample() {
  const router = useRouter();
  const params = useParams();
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    sample_code: '',
    sample_type: '',
    quantity: '',
    unit: '',
    sampling_date: '',
    sampling_location: '',
    analysis_parameters: '',
    notes: '',
    sender_name: '',
    sender_institution: '',
    sender_address: '',
    sender_phone: '',
    sender_email: '',
    courier: '',
    tracking_number: '',
    sending_notes: '',
    sent_date: '',
    received_date: '',
    received_by: '',
    receiving_notes: '',
    preparation_completed_date: '',
    prepared_by: '',
    preparation_notes: '',
    analysis_completed_date: '',
    analyzed_by: '',
    analysis_notes: '',
    roa_issued_date: '',
    roa_number: '',
    roa_created_by: '',
    coa_issued_date: '',
    coa_number: '',
    coa_created_by: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user data first
        const userResponse = await fetch('/api/users');
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        
        // Ensure userData is an object (single user), not an array
        const currentUser = Array.isArray(userData) ? userData[0] : userData;
        setUserData(currentUser);
        
        // Only proceed if the user is a super admin
        if (currentUser?.roleId !== 1) {
          console.error('Access denied: User is not a super admin');
          router.push('/dashboard'); // Redirect non-super admins
          return;
        }
        
        // Fetch sample details
        const sampleId = params.id;
        const response = await fetch(`/api/tracking-samples/${sampleId}`);
        if (!response.ok) throw new Error('Failed to fetch sample details');
        const sampleData = await response.json();
        setSample(sampleData);
        
        // Populate form with sample data
        const populatedFormData = { ...formData };
        Object.keys(formData).forEach(key => {
          if (sampleData[key] !== undefined) {
            // Format dates for input type="date"
            if (key.includes('date') && sampleData[key]) {
              const date = new Date(sampleData[key]);
              populatedFormData[key] = date.toISOString().split('T')[0];
            } else {
              populatedFormData[key] = sampleData[key] || '';
            }
          }
        });
        
        setFormData(populatedFormData);
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [params.id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/tracking-samples/${sample.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sample');
      }
      
      // Navigate back to sample detail page after successful update
      router.push(`/dashboard/adopsi/tracking-samples/${sample.id}`);
    } catch (error) {
      console.error('Error updating sample:', error);
      alert('Failed to update sample. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Sample tidak ditemukan</p>
        <button 
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 mx-auto"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Edit Sample</h1>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
            saving ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Umum Sample</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Sample <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sample_code"
                value={formData.sample_code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contoh: gram, mL, unit"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Pengambilan Sample
              </label>
              <input
                type="date"
                name="sampling_date"
                value={formData.sampling_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi Pengambilan
              </label>
              <input
                type="text"
                name="sampling_location"
                value={formData.sampling_location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter Analisa
            </label>
            <textarea
              name="analysis_parameters"
              value={formData.analysis_parameters}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan parameter yang akan dianalisa"
            ></textarea>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
        
        {/* Sender Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Pengirim</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Pengirim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institusi
              </label>
              <input
                type="text"
                name="sender_institution"
                value={formData.sender_institution}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat
              </label>
              <textarea
                name="sender_address"
                value={formData.sender_address}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon
              </label>
              <input
                type="text"
                name="sender_phone"
                value={formData.sender_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="sender_email"
                value={formData.sender_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Shipping Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Pengiriman</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurir
              </label>
              <input
                type="text"
                name="courier"
                value={formData.courier}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Resi
              </label>
              <input
                type="text"
                name="tracking_number"
                value={formData.tracking_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Kirim
              </label>
              <input
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Pengiriman
              </label>
              <textarea
                name="sending_notes"
                value={formData.sending_notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Reception Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Penerimaan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Diterima
              </label>
              <input
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diterima Oleh
              </label>
              <input
                type="text"
                name="received_by"
                value={formData.received_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Penerimaan
              </label>
              <textarea
                name="receiving_notes"
                value={formData.receiving_notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Preparation Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Preparasi</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai Preparasi
              </label>
              <input
                type="date"
                name="preparation_completed_date"
                value={formData.preparation_completed_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dipreparasi Oleh
              </label>
              <input
                type="text"
                name="prepared_by"
                value={formData.prepared_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Preparasi
              </label>
              <textarea
                name="preparation_notes"
                value={formData.preparation_notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Analysis Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi Analisa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai Analisa
              </label>
              <input
                type="date"
                name="analysis_completed_date"
                value={formData.analysis_completed_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dianalisa Oleh
              </label>
              <input
                type="text"
                name="analyzed_by"
                value={formData.analyzed_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Analisa
              </label>
              <textarea
                name="analysis_notes"
                value={formData.analysis_notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* ROA Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi ROA</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Terbit ROA
              </label>
              <input
                type="date"
                name="roa_issued_date"
                value={formData.roa_issued_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor ROA
              </label>
              <input
                type="text"
                name="roa_number"
                value={formData.roa_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dibuat Oleh
              </label>
              <input
                type="text"
                name="roa_created_by"
                value={formData.roa_created_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* COA Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Informasi COA</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Terbit COA
              </label>
              <input
                type="date"
                name="coa_issued_date"
                value={formData.coa_issued_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor COA
              </label>
              <input
                type="text"
                name="coa_number"
                value={formData.coa_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dibuat Oleh
              </label>
              <input
                type="text"
                name="coa_created_by"
                value={formData.coa_created_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text
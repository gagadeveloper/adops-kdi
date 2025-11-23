'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TrackingSampleDetail from '@/components/TrackingSampleDetail';

export default function TrackingSampleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Memuat...</span>
        </div>
      ) : (
        <TrackingSampleDetail sampleId={id} />
      )}
    </div>
  );
}
'use client';

import { useParams } from 'next/navigation';
import Step3 from '@/components/TrackingStep3';

export default function Step3Page() {
  const params = useParams();
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Step3 params={params} />
    </main>
  );
}
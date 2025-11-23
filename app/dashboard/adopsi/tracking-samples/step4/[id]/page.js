'use client';

import { useParams } from 'next/navigation';
import Step4 from '@/components/TrackingStep4';

export default function Step4Page() {
  const params = useParams();
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Step4 params={params} />
    </main>
  );
}
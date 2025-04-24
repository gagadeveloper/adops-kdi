'use client';

import { useParams } from 'next/navigation';
import Step5 from '@/components/TrackingStep5';

export default function Step5Page() {
  const params = useParams();
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Step5 params={params} />
    </main>
  );
}
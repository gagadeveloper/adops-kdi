'use client';

import { useParams } from 'next/navigation';
import Step2 from '@/components/TrackingStep2';

export default function Step2Page() {
  const params = useParams();
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Step2 params={params} />
    </main>
  );
}
'use client';

import { useParams } from 'next/navigation';
import Step6 from '@/components/TrackingStep6';

export default function Step6Page() {
  const params = useParams();
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Step6 params={params} />
    </main>
  );
}
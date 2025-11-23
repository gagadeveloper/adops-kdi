'use client';

import { useState } from 'react';
import SampleProcessCard from './SampleProcessCard';
import TrackingSamplesCard from './TrackingSamplesCard';
import PIHantaranCard from './PIHantaranCard';

export default function DashboardContent({ userRole }) {
  const [dashboardData, setDashboardData] = useState({
    isLoading: false,
    error: null
  });

  // Role-based dashboard configuration
  const showSampleProcess = userRole === 1 || userRole === 2 || userRole === 3 || userRole === 17;
  const showTrackingSamples = userRole === 1 || userRole === 9 || userRole === 19 || userRole === 17 || userRole === 7 || userRole === 13 || userRole === 16 || userRole === 18;
  const showPIHantaran = userRole === 1 || userRole === 2 || userRole === 17;

  if (dashboardData.isLoading) {
    return <div className="text-center py-10">Memuat data dashboard...</div>;
  }

  if (dashboardData.error) {
    return <div className="text-center py-10 text-blue-500">Error: {dashboardData.error}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {showPIHantaran && (
        <div className="col-span-1">
          <PIHantaranCard />
        </div>
      )}

      {showSampleProcess && (
        <div className="col-span-1">
          <SampleProcessCard title="Hantaran Samples" />
        </div>
      )}
      
      {showTrackingSamples && (
        <div className="col-span-1">
          <TrackingSamplesCard title="Shipment Samples" />
        </div>
      )}

    </div>
  );
}
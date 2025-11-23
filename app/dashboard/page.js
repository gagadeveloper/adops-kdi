'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(false);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {/* Selamat Datang di Dashboard {session?.user?.name && `${session.user.name}`} */}
      </h1>
      
      {session?.user?.roleId && (
        <DashboardContent userRole={session.user.roleId} />
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.roleId) {
      // Langsung gunakan roleId dari session tanpa memanggil API
      setUserData({ role: session.user.roleId });
      setLoading(false);
      
      // Debug logging
      console.log('Role ID yang akan dikirim ke DashboardContent:', session.user.roleId);
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Selamat Datang di Dashboard</h1>
      
      {userData && (
        <DashboardContent userRole={userData.role} />
      )}
    </div>
  );
}
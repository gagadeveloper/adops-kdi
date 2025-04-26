'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  useEffect(() => {
    console.error('Authentication Error:', error);
  }, [error]);
  
  // Terjemahkan error message
  const getErrorMessage = () => {
    switch(error) {
      case 'CredentialsSignin':
        return 'Email atau password salah';
      case 'SessionRequired':
        return 'Anda perlu login untuk mengakses halaman ini';
      case 'Configuration':
        return 'Terjadi masalah pada konfigurasi autentikasi';
      default:
        return error || 'Terjadi kesalahan saat login';
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-red-600">
          Error Autentikasi
        </h1>
        
        <div className="p-4 bg-red-50 rounded-md border border-red-200">
          <p className="text-red-700">{getErrorMessage()}</p>
        </div>
        
        <div className="text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
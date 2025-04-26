'use client';

import Link from 'next/link';

// Halaman error statis tanpa useSearchParams
export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Autentikasi</h1>
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-800">Terjadi kesalahan saat proses autentikasi. Silakan coba lagi.</p>
          </div>
          <Link href="/auth/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
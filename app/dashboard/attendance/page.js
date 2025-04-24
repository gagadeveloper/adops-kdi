// app/dashboard/attendance/page.js
'use client';

import { Terproteksi } from '@/components/Terproteksi';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function HalamanAbsensi() {
  return (
    <Terproteksi izinYangDiperlukan="kelola_absensi">
      <KontenAbsensi />
    </Terproteksi>
  );
}

function KontenAbsensi() {
  const [dataAbsensi, setDataAbsensi] = useState([]);
  const { data: sesi } = useSession();

  useEffect(() => {
    // Ambil data absensi
    fetch('/api/absensi')
      .then(res => res.json())
      .then(data => setDataAbsensi(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Absensi</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Catatan Absensi</h2>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
              Catat Absensi
            </button>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Masuk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Keluar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataAbsensi.map((catatan, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{catatan.tanggal}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{catatan.jamMasuk}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{catatan.jamKeluar}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{catatan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
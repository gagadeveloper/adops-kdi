// components/Terproteksi.js
import { useSession } from 'next-auth/react';
import { gunakanIzin } from '@/utils/rbac';

export function Terproteksi({ children, izinYangDiperlukan }) {
  const { data: sesi, status } = useSession();
  const memilikiIzin = gunakanIzin(izinYangDiperlukan);

  if (status === 'loading') {
    return <div>Memuat...</div>;
  }

  if (!sesi) {
    return <div>Silakan login untuk mengakses halaman ini.</div>;
  }

  if (!memilikiIzin) {
    return <div>Anda tidak memiliki izin untuk mengakses konten ini.</div>;
  }

  return children;
}
// Buat file components/LogoutButton.js

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const LogoutButton = ({ className = '', children }) => {
  const router = useRouter();
  
  const handleLogout = async () => {
    // Dapatkan base URL yang sesuai (production atau development)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_VERCEL_URL || 
                    window.location.origin;
    
    try {
      console.log(`🔒 Logging out, will redirect to ${baseUrl}/login`);
      
      // Gunakan callbackUrl yang sudah terbentuk dengan benar
      await signOut({ 
        callbackUrl: `${baseUrl}/login`,
        redirect: true
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback manual redirect jika signOut gagal
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
      type="button"
    >
      {children || 'Logout'}
    </button>
  );
};

export default LogoutButton;
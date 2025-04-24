"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Terjadi kesalahan saat login");
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('/sibg.jpg')",
        // Alternatif jika menggunakan GIF:
        // backgroundImage: "url('/path/to/your-background.gif')"
      }}
    >
      {/* Overlay untuk memastikan teks tetap terbaca di atas background */}
      <div className="absolute inset-0 bg-black opacity-40 z-0"></div>
      
      {/* Container login */}
      <div className="relative z-10 bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md backdrop-blur-sm bg-opacity-90">
        {/* Logo atau gambar header (opsional) */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">SIIS</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login ke SIIS
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan password"
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} SIIS. All rights reserved.
        </div>
      </div>
    </div>
  );
}
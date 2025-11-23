"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Package, FlaskConical, ClipboardList, FileText } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", email);
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        console.error("Login error:", res.error);
        setError(res.error);
        setLoading(false);
      } else {
        console.log("Login successful, redirecting...");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    { icon: Package, label: "Tracking Sample" },
    { icon: FlaskConical, label: "Sample Preparations" },
    { icon: ClipboardList, label: "Analysis Samples" },
    { icon: FileText, label: "Invoicing" },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: "url('/sibg.jpg')",
      }}
    >
      {/* Overlay dengan opacity lebih tinggi agar background lebih samar */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/50 to-blue-900/60 backdrop-blur-[2px]"></div>
      
      {/* Logo Perusahaan di Kiri Atas */}
      <div className="absolute top-6 left-6 z-20">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl">
          <img 
            src="/logo.png" 
            alt="Company Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        
        {/* Left Side - Branding & Features */}
        <div className="flex-1 text-center lg:text-left text-white">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold tracking-wide mb-2">SISMART</h1>
            <p className="text-lg text-blue-100 font-light">Surveyor Indonesia</p>
          </div>

          {/* Subtitle */}
          <h2 className="text-xl lg:text-2xl font-semibold mb-3 leading-tight">
            SURVEYOR INDONESIA SAMPLE MONITORING
            <br />
            & ANALYSIS REPORTING TOOLS
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto lg:mx-0">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                <feature.icon className="h-8 w-8 mb-2 mx-auto lg:mx-0 text-blue-200" />
                <p className="text-sm font-medium text-white">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
            {/* Form Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-4 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Login Page</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 border border-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin(e);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                type="button"
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : "Login"}
              </button>
            </div>
            
            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} SIMAK. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
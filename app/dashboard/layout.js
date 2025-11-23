"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import DynamicMenu from '../../components/Menu/DynamicMenu';
import { X, Menu, Bell, Search, User, Settings, FileText,Home, LogOut } from 'lucide-react';
import Image from 'next/image';

// Enhanced Modal Component with animations and softer styling
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none rounded-full hover:bg-gray-100 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// Reset Password Modal with enhanced UI
const ResetPasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Add your password reset logic here
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Saat Ini
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Baru
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            required
          />
        </div>
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm hover:shadow transition-all flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Sedang Proses</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Change Bank Modal with enhanced UI
const ChangeBankModal = ({ isOpen, onClose }) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Add your bank change logic here
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Rekening Bank">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Bank
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all appearance-none bg-white"
            required
          >
            <option value="">Pilih Bank</option>
            <option value="BCA">BCA</option>
            <option value="BNI">BNI</option>
            <option value="BRI">BRI</option>
            <option value="Mandiri">Mandiri</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor Rekening
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Pemilik Rekening
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            required
          />
        </div>
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm hover:shadow transition-all flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Sedang Proses</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Logout Confirmation Modal with enhanced UI
const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Logout">
      <div className="py-3">
        <p className="text-gray-700">Anda yakin ingin keluar dari sistem?</p>
      </div>
      <div className="flex justify-end pt-3">
        <button
          onClick={onClose}
          className="mr-3 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
          Tidak
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm hover:shadow transition-all flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2">Sedang Proses</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            'Ya, Keluar'
          )}
        </button>
      </div>
    </Modal>
  );
};

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [changeBankModalOpen, setChangeBankModalOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const sidebarRef = useRef(null);
    const searchRef = useRef(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Responsive sidebar settings
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        
        // Set initial state
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (status === "unauthenticated") {
        return null;
    }

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600">Mohon tunggu sebentar...</p>
                </div>
            </div>
        );
    }

    // Logout function with Loading
    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await signOut({ callbackUrl: "/login" });
        } catch (error) {
            console.error("Logout failed", error);
            setIsLoading(false);
            setLogoutModalOpen(false);
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Sample notifications data
    const notifications = [
        { id: 1, title: "Pengumuman Sistem", message: "Pemeliharaan sistem akan dilakukan besok pukul 22:00", time: "5 menit yang lalu", read: false },
        { id: 2, title: "Tugas Baru", message: "Ada 3 tugas baru yang harus diselesaikan", time: "1 jam yang lalu", read: true },
        { id: 3, title: "Pengingat", message: "Rapat koordinasi pukul 13:00 hari ini", time: "3 jam yang lalu", read: true },
    ];

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
            {/* Sidebar with softer color scheme */}
            <aside 
                ref={sidebarRef}
                className={`fixed lg:relative z-30 h-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
                }`}
            >
                <div className="p-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        {/* Logo container */}
                        <div className={`${!sidebarOpen && 'lg:hidden'}`}>
                            <div className="relative">
                                <Image 
                                    src="/logo.png" 
                                    alt="ADOPS WEB Logo"
                                    width={180}
                                    height={60}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                        
                        {/* Show small logo icon when collapsed on desktop */}
                        <div className={`${sidebarOpen ? 'hidden' : 'hidden lg:block'} w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center`}>
                            <span className="text-xl font-bold text-blue-600">S</span>
                        </div>
                        
                        <button 
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Show full menu when sidebar is open */}
                    <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-2 ${!sidebarOpen && 'lg:hidden'}`}>
                        {session && session.user && (
                            <DynamicMenu userEmail={session.user.email} />
                        )}
                    </div>
                    
                    {/* Show only icons when collapsed on desktop */}
                    <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'hidden' : 'hidden lg:block'}`}>
                        {/* Icon-only menu items will go here */}
                        <div className="space-y-3 mt-5">
                            <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-200 transition-colors">
                                    <Home className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                                    <Settings className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* User profile section in sidebar */}
                    <div className={`mt-auto pt-4 border-t border-gray-100 ${!sidebarOpen && 'lg:hidden'}`}>
                        <div className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {session?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3 truncate">
                                <p className="text-sm font-medium">{session?.user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Dark overlay on mobile when sidebar is open */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
                {/* Enhanced header with search and notifications */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                    <div className="flex items-center">
                        <button 
                            onClick={toggleSidebar}
                            data-sidebar-toggle="true"
                            className="p-2 mr-3 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {/* Search bar */}
                        {/* <div 
                            ref={searchRef}
                            className={`hidden md:flex items-center rounded-lg border ${searchFocused ? 'border-blue-400 ring-2 ring-blue-50' : 'border-gray-200'} px-3 py-2 w-64 transition-all`}
                        >
                            <Search className="w-4 h-4 text-gray-400 mr-2" />
                            <input 
                                type="text" 
                                placeholder="Cari..."
                                className="bg-transparent outline-none text-sm w-full"
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                        </div> */}
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-xl font-semibold text-gray-800">
                                SIMAK RO. Kendari - {session?.user?.name}!
                            </h1>
                            {/* <p className="text-sm text-gray-500 mt-1">
                                Adops System Kantor Regional Kendari
                            </p> */}
                        </div>
                        </div>
                    
                    {/* Page title for mobile view */}
                    <div className="md:hidden">
                        <h2 className="text-lg font-semibold">SIMAK RO. Kendari</h2>
                    </div>

                    {/* Right section with notifications and user menu */}
                    <div className="flex items-center space-x-3">
                        {/* Notifications dropdown */}
                        <div className="relative" ref={notificationRef}>
                            <button 
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                            
                            {/* Notifications dropdown panel */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                                    </div>
                                    
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.read && 'bg-blue-50'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-medium text-sm">{notification.title}</p>
                                                    <span className="text-xs text-gray-500">{notification.time}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{notification.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="px-4 py-2 text-center">
                                        <button className="text-sm text-blue-500 hover:text-blue-700">
                                            Lihat Semua Notifikasi
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Dropdown Menu */}
                        <div className="relative" ref={dropdownRef}>
                            {/* Avatar (Click to open dropdown) */}
                            <div
                                className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-md transition"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                {session?.user?.name?.charAt(0).toUpperCase()}
                            </div>

                            {/* Enhanced dropdown menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50">
                                    {/* User info section */}
                                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                        <p className="font-medium">{session?.user?.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                                    </div>
                                    
                                    {/* Menu items */}
                                    <button 
                                        className="flex w-full items-center text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                            setResetPasswordModalOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                                        Ubah Password
                                    </button>
                                    <button 
                                        className="flex w-full items-center text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => {
                                            setChangeBankModalOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                                        Ubah Rekening Bank
                                    </button>
                                    
                                    {/* Divider */}
                                    <div className="border-t border-gray-100 my-1"></div>
                                    
                                    {/* Logout option */}
                                    <button
                                        onClick={() => {
                                            setLogoutModalOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                        className="flex w-full items-center text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-red-50"
                                        disabled={isLoading}
                                    >
                                        <LogOut className="w-4 h-4 mr-3" />
                                        Keluar
                                        {isLoading && (
                                            <div className="ml-auto w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page title bar */}
                {/* <div className="bg-white shadow-sm p-4 border-b border-gray-200 hidden md:block">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-xl font-semibold text-gray-800">
                            SIMAK RO. Kendari - {session?.user?.name}!
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Adops System Kantor Regional Kendari
                        </p>
                    </div>
                </div> */}

                {/* Main content with softer background */}
                <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Modals */}
            <ResetPasswordModal 
                isOpen={resetPasswordModalOpen} 
                onClose={() => setResetPasswordModalOpen(false)} 
            />
            
            <ChangeBankModal 
                isOpen={changeBankModalOpen} 
                onClose={() => setChangeBankModalOpen(false)} 
            />
            
            <LogoutConfirmationModal 
                isOpen={logoutModalOpen} 
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={handleLogout}
                isLoading={isLoading}
            />
        </div>
    );
}
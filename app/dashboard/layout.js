"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import DynamicMenu from '../../components/Menu/DynamicMenu';
import { X, Menu } from 'lucide-react';

// Modal Component unchanged
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Reset Password Modal Content unchanged
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
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Processing</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Other modals remain unchanged
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
    <Modal isOpen={isOpen} onClose={onClose} title="Change Bank Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bank Name
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select Bank</option>
            <option value="BCA">BCA</option>
            <option value="BNI">BNI</option>
            <option value="BRI">BRI</option>
            <option value="Mandiri">Mandiri</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Processing</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Logout Confirmation">
      <div className="py-2">
        <p className="text-gray-700">Anda yakin ingin keluar?</p>
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={onClose}
          className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          disabled={isLoading}
        >
          Tidak
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2">Processing</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            'Ya'
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
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [changeBankModalOpen, setChangeBankModalOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);
    const sidebarRef = useRef(null);

    // Mengarahkan user ke login jika tidak terautentikasi
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            
            // Don't close sidebar when clicking inside it
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && 
                !event.target.closest('[data-sidebar-toggle]')) {
                setSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Show sidebar by default on larger screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
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
        return <div className="flex items-center justify-center h-screen text-gray-700">Mohon Bersabar...</div>;
    }

    // Fungsi Logout dengan Loading
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

    return (
        <div className="flex h-screen bg-gray-300 text-gray-900 overflow-hidden">
            {/* Sidebar - Always positioned on left, with fixed width */}
            <aside 
                ref={sidebarRef}
                className={`fixed md:relative z-30 h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-16 md:translate-x-0'
                }`}
            >
                <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold text-gray-800 ${!sidebarOpen && 'md:hidden'}`}>Dashboard</h2>
                        <button 
                            onClick={toggleSidebar}
                            className="p-1 rounded-md hover:bg-gray-200 md:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Only show menu content when sidebar is open */}
                    <div className={`flex-1 overflow-y-auto ${!sidebarOpen && 'md:hidden'}`}>
                        {session && session.user && (
                            <DynamicMenu userEmail={session.user.email} />
                        )}
                    </div>
                    
                    {/* Show only icons when collapsed on desktop */}
                    <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'hidden' : 'hidden md:block'}`}>
                        {/* You can add icon-only menu here if needed */}
                    </div>
                </div>
            </aside>

            {/* Dark overlay on mobile when sidebar is open */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
                <header className="bg-white shadow p-4 flex justify-between items-center z-10">
                    {/* Sidebar toggle button */}
                    <div className="flex items-center">
                        <button 
                            onClick={toggleSidebar}
                            data-sidebar-toggle="true"
                            className="p-1 mr-3 rounded-md hover:bg-gray-200"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-semibold truncate">
                            Welcome, {session?.user?.name}!
                        </h2>
                    </div>

                    {/* User Dropdown Menu */}
                    <div className="relative" ref={dropdownRef}>
                        {/* Avatar (Klik untuk membuka dropdown) */}
                        <div
                            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-blue-600 transition"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            {session?.user?.name?.charAt(0).toUpperCase()}
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50">
                                <button 
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                        setResetPasswordModalOpen(true);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    Reset Password
                                </button>
                                <button 
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                    onClick={() => {
                                        setChangeBankModalOpen(true);
                                        setDropdownOpen(false);
                                    }}
                                >
                                    Change Bank
                                </button>
                                <button
                                    onClick={() => {
                                        setLogoutModalOpen(true);
                                        setDropdownOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100 flex items-center justify-between"
                                    disabled={isLoading}
                                >
                                    Logout
                                    {isLoading && (
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-6 bg-gray-200 overflow-y-auto">
                    {children}
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
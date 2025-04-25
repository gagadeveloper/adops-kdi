'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MenuSelect from '@/components/Menu/MenuSelect';

export default function EditUserPage() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    department: 'IT',
    position: 'Staff',
    roleId: '',
    menuIds: [],
    status: 'active',
    // Kolom tambahan
    bankAccount: '',
    bankName: '',
    address: '',
    location: 'Makassar'
  });
  
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const { id } = useParams();

  // Fetch roles dari API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('/api/roles');
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    }
    fetchRoles();
  }, []);

  // Fetch data user berdasarkan ID
  useEffect(() => {
    if (!id) return;
    
    async function fetchUserDetail() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        
        // Format menu IDs untuk digunakan dengan MenuSelect
        const formattedMenuIds = Array.isArray(data.menuIds) 
          ? data.menuIds.map(menu => ({
              value: typeof menu === 'object' ? Number(menu.id) : Number(menu),
              label: typeof menu === 'object' ? menu.menu_name : 
                     menu.toString()
            }))
          : [];

          setUser({
            ...data,
            menuIds: Array.isArray(data.menuIds) 
              ? data.menuIds.map(menuId => ({
                  value: typeof menuId === 'object' ? Number(menuId.id) : Number(menuId),
                  label: typeof menuId === 'object' ? menuId.menu_name : menuId.toString()
                }))
              : [],
            // Use the proper case from API response
            bankAccount: data.bankAccount || '',  // This needs to match what API returns
            bankName: data.bankName || '',        // This needs to match what API returns
            address: data.address || '',
            location: data.location || 'Makassar'
          });
      } catch (error) {
        console.error('❌ Error fetching user detail:', error);
        setMessage('❌ Error: User not found or could not be loaded');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserDetail();
  }, [id]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleResetPassword = () => {
    setShowResetPassword(!showResetPassword);
    if (!showResetPassword) {
      setNewPassword('QWERTY123'); // Default reset password
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Extract just the values from menuIds objects
    const menuIds = user.menuIds.map(menu => 
      typeof menu === 'object' ? menu.value : menu
    );

    const updatedUser = {
      ...user,
      menuIds: user.menuIds.map(menu => menu.value)
    };

    // Tambahkan password baru jika ada reset password
    if (showResetPassword && newPassword) {
      updatedUser.password = newPassword;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      setMessage('✅ User updated successfully!');
      
      // Redirect setelah delay singkat
      setTimeout(() => {
        router.push('/dashboard/users');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Update Error:', error);
      setMessage(`❌ ${error.message || 'Failed to update user'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user.name) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit User</h2>
      {message && <p className={`mb-4 text-sm ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input 
            type="text" 
            value={user.name} 
            onChange={(e) => setUser({ ...user, name: e.target.value })} 
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            value={user.email} 
            disabled 
            className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed" 
          />
        </div>
        
        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
          <input 
            type="text" 
            value={user.employeeId || ''} 
            disabled 
            className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed" 
          />
        </div>

        {/* Password Reset Option */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              id="resetPassword"
              checked={showResetPassword}
              onChange={toggleResetPassword}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="resetPassword" className="text-sm font-medium text-gray-700">
              Reset Password
            </label>
          </div>
          
          {showResetPassword && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="Enter new password"
                required={showResetPassword}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
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
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select 
            value={user.department} 
            onChange={(e) => setUser({ ...user, department: e.target.value })} 
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="BOD">BOD</option>
            <option value="Sales&Marketing">Sales & Marketing</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Admin">Admin</option>
            <option value="Finance">Finance</option>
            <option value="Operational">Operational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <select 
            value={user.position} 
            onChange={(e) => setUser({ ...user, position: e.target.value })} 
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="BOD">BOD</option>
            <option value="Direktur">Direktur</option>
            <option value="GM">GM</option>
            <option value="Manager">Manager</option>
            <option value="Section Head">Section Head</option>
            <option value="Staff">Staff</option>
            <option value="OJT">OJT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select 
            value={user.roleId} 
            onChange={(e) => setUser({ ...user, roleId: e.target.value })} 
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
            required
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        {/* Bank Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700">No Rekening</label>
          <input 
            type="text" 
            value={user.bankAccount} 
            onChange={(e) => setUser({ ...user, bankAccount: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan no rekening"
          />
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Bank</label>
          <input 
            type="text" 
            value={user.bankName} 
            onChange={(e) => setUser({ ...user, bankName: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan nama bank"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Alamat</label>
          <textarea 
            value={user.address} 
            onChange={(e) => setUser({ ...user, address: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan alamat lengkap"
            rows="3"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Lokasi</label>
          <select 
            value={user.location} 
            onChange={(e) => setUser({ ...user, location: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="Makassar">Makassar</option>
            <option value="Kendari">Kendari</option>
            <option value="Gorontalo">Gorontalo</option>
            <option value="Palu">Palu</option>
            <option value="Manado">Manado</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Menus</label>
          <MenuSelect
            value={user.menuIds}
            onChange={(selected) => setUser({ ...user, menuIds: selected || [] })}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select 
            value={user.status} 
            onChange={(e) => setUser({ ...user, status: e.target.value })}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex space-x-2 pt-2">
          <button 
            type="button" 
            onClick={() => router.push('/dashboard/users')}
            className="w-1/3 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-2/3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              </>
            ) : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
}
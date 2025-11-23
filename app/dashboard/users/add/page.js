"use client";

import { useState, useEffect } from "react";
import MenuSelect from "@/components/Menu/MenuSelect";

export default function AddUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("QWERTY123"); // Default password
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("Staff");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [menuIds, setMenuIds] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Tambahan kolom baru
  const [bankAccount, setBankAccount] = useState("123");
  const [bankName, setBankName] = useState("ABC");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");

  // Fetch roles dari API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    }
    fetchRoles();
  }, []);

  // Fetch menu dari API
  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch(`/api/menus/all`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const formattedMenus = data.map(menu => ({
            value: Number(menu.id),
            label: menu.menu_name
          }));
          setMenus(formattedMenus);
        }
      } catch (err) {
        console.error("❌ Error fetching menus:", err);
      }
    }
    fetchMenus();
  }, []);

  // Generate Employee ID otomatis
  useEffect(() => {
    async function generateEmployeeId() {
      try {
        const res = await fetch('/api/users/generateId');
        const data = await res.json();
        
        if (data && data.employeeId) {
          setEmployeeId(data.employeeId);
        } else {
          console.error("Invalid employee ID response", data);
          setMessage("❌ Error generating employee ID");
        }
      } catch (err) {
        console.error("Error fetching Employee ID:", err);
        setMessage("❌ Error generating employee ID");
      }
    }
    
    generateEmployeeId();
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const selectedMenuIds = menuIds.map(menu => menu.value);
    const userData = { 
      email, 
      password, 
      name, 
      department, 
      employeeId, 
      position, 
      roleId, 
      menuIds: selectedMenuIds, 
      status: "active",
      // Tambahan data baru
      bankAccount,
      bankName,
      address,
      location 
    };

    try {
      const res = await fetch('/api/users/add', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage("✅ User added successfully!");
        // Reset form after successful submission
        setEmail("");
        setPassword("QWERTY123");
        setName("");
        // Generate new employee ID
        const idRes = await fetch('/api/users/generateId');
        const idData = await idRes.json();
        setEmployeeId(idData.employeeId);
        setDepartment("IT");
        setPosition("Staff");
        setRoleId("");
        setMenuIds([]);
        setBankAccount("");
        setBankName("");
        setAddress("");
        setLocation("Makassar");
      } else {
        setMessage(`❌ Error: ${result.error || "Failed to add user"}`);
      }
    } catch (error) {
      setMessage("❌ Error: Network or server error");
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New User</h2>
      {message && <p className={`mb-4 text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
            placeholder="Enter email" required
          />
        </div>

        {/* Password dengan toggle show/hide */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Enter password" 
              required
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
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Enter full name" required
          />
        </div>

        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
          <input 
            type="text" value={employeeId} disabled
            className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            <option value="BOD">BOD</option>
            <option value="Sales&Marketing">Sales & Marketing</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Admin">Admin</option>
            <option value="Finance">Finance</option>
            <option value="Operational">Operational</option>
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            <option value="BOD">BOD</option>
            <option value="Direktur">Direktur</option>
            <option value="GM">GM</option>
            <option value="Manager">Manager</option>
            <option value="Section Head">Section Head</option>
            <option value="Staff">Staff</option>
            <option value="OJT">OJT</option>
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400" required>
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
            type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan no rekening"
          />
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Bank</label>
          <input 
            type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan nama bank"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Alamat</label>
          <textarea 
            value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Masukkan alamat lengkap"
            rows="3"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Lokasi</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            <option value="Makassar">Makassar</option>
            <option value="Kendari">Kendari</option>
            <option value="Gorontalo">Gorontalo</option>
            <option value="Palu">Palu</option>
            <option value="Manado">Manado</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>

        {/* Select Menus */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Menus</label>
          <MenuSelect 
            value={menuIds}
            onChange={setMenuIds}
            options={menus} // Pass the menus array
          />
        </div>
        {/* Submit Button */}
        <button type="submit" disabled={loading} 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Adding...
            </>
          ) : "Add User"}
        </button>
      </form>
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";

export default function AssignMenusPage() {
  const [roles, setRoles] = useState([]); // Simpan daftar role
  const [menus, setMenus] = useState([]); // Simpan daftar menu
  const [selectedRole, setSelectedRole] = useState(""); // Role yang dipilih
  const [selectedMenus, setSelectedMenus] = useState([]); // Menyimpan ID menu yang dipilih

  // Fetch roles dari API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        if (Array.isArray(data)) setRoles(data);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    }
    fetchRoles();
  }, []);

  // Fetch menus dari API
  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch("/api/menus");
        const data = await res.json();
        if (Array.isArray(data)) setMenus(data);
      } catch (error) {
        console.error("Failed to fetch menus:", error);
      }
    }
    fetchMenus();
  }, []);

  // Handle perubahan checkbox
  const handleMenuChange = (menuId) => {
    setSelectedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId) // Hapus jika sudah dipilih
        : [...prev, menuId] // Tambahkan jika belum dipilih
    );
  };

  // Simpan menu ke RoleMenu
  const handleAssignMenus = async () => {
    if (!selectedRole || selectedMenus.length === 0) {
      alert("Pilih role dan minimal satu menu!");
      return;
    }

    try {
      const res = await fetch("/api/role-menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRole, menuIds: selectedMenus }),
      });
      const result = await res.json();
      if (res.ok) alert("Menus assigned successfully!");
      else alert("Error: " + result.error);
    } catch (error) {
      console.error("Failed to assign menus:", error);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">Assign Menus to Role</h2>

      {/* Dropdown untuk memilih Role */}
      <select
        className="w-full p-2 border rounded mb-4"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="">-- Select Role --</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      {/* Checkbox untuk memilih menu */}
      <div className="mb-4">
        <h3 className="font-bold">Select Menus:</h3>
        {menus.map((menu) => (
          <div key={menu.id} className="flex items-center">
            <input
              type="checkbox"
              id={`menu-${menu.id}`}
              checked={selectedMenus.includes(menu.id)}
              onChange={() => handleMenuChange(menu.id)}
            />
            <label htmlFor={`menu-${menu.id}`} className="ml-2">
              {menu.menu_name}
            </label>
          </div>
        ))}
      </div>

      {/* Tombol Assign */}
      <button onClick={handleAssignMenus} className="bg-blue-500 text-white px-4 py-2 rounded">
        Assign Menus
      </button>
    </div>
  );
}

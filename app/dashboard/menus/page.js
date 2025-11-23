'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageMenusPage() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [menuName, setMenuName] = useState('');
  const [menuPath, setMenuPath] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchRoles();
    fetchMenus();
  }, []);

  const fetchRoles = async () => {
    const response = await fetch('/api/roles');
    const data = await response.json();
    setRoles(data);
  };

  const fetchMenus = async () => {
    const response = await fetch('/api/menus');
    const data = await response.json();
    setMenus(data);
  };

  const handleAddRole = async () => {
    if (!roleName) return alert('Role name is required');
    await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roleName }),
    });
    setRoleName('');
    fetchRoles();
  };

  const handleAddMenu = async () => {
    if (!menuName || !menuPath) return alert('Menu name and path are required');
    await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: menuName, path: menuPath }),
    });
    setMenuName('');
    setMenuPath('');
    fetchMenus();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Roles & Menus</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add Role</h2>
        <input 
          type="text" 
          value={roleName} 
          onChange={(e) => setRoleName(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Role name"
        />
        <button onClick={handleAddRole} className="bg-blue-500 text-white px-4 py-2 rounded">Add Role</button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add Menu</h2>
        <input 
          type="text" 
          value={menuName} 
          onChange={(e) => setMenuName(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Menu name"
        />
        <input 
          type="text" 
          value={menuPath} 
          onChange={(e) => setMenuPath(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Menu path"
        />
        <button onClick={handleAddMenu} className="bg-green-500 text-white px-4 py-2 rounded">Add Menu</button>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Existing Roles</h2>
        <ul>{roles.map(role => <li key={role.id}>{role.name}</li>)}</ul>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">Existing Menus</h2>
        <ul>{menus.map(menu => <li key={menu.id}>{menu.name} - {menu.path}</li>)}</ul>
      </div>
    </div>
  );
}

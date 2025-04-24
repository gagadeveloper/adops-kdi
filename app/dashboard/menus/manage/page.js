import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, 
  ChevronUp, ChevronDown, FolderPlus 
} from 'lucide-react';
import Select from 'react-select';

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    menu_name: '',
    icon: '',
    path: '',
    menu_order: '',
    parent_id: null
  });

  // Fetch menus
  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus/all');
      const data = await res.json();
      setMenus(data);
    } catch (err) {
      setMessage('Error fetching menus: ' + err.message);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle parent menu selection
  const handleParentChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      parent_id: selected ? selected.value : null
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = editingId 
        ? `/api/menus/${editingId}` 
        : '/api/menus/add';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save menu');

      setMessage(editingId ? '✅ Menu updated!' : '✅ Menu added!');
      fetchMenus();
      resetForm();
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete menu
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      const res = await fetch(`/api/menus/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete menu');

      setMessage('✅ Menu deleted!');
      fetchMenus();
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  // Edit menu
  const handleEdit = (menu) => {
    setFormData({
      menu_name: menu.menu_name,
      icon: menu.icon || '',
      path: menu.path,
      menu_order: menu.menu_order,
      parent_id: menu.parent_id
    });
    setEditingId(menu.id);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      menu_name: '',
      icon: '',
      path: '',
      menu_order: '',
      parent_id: null
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Reorder menu
  const handleReorder = async (id, direction) => {
    const menu = menus.find(m => m.id === id);
    const newOrder = direction === 'up' 
      ? menu.menu_order - 1 
      : menu.menu_order + 1;

    try {
      const res = await fetch(`/api/menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menu, menu_order: newOrder })
      });

      if (!res.ok) throw new Error('Failed to reorder menu');

      fetchMenus();
    } catch (err) {
      setMessage('❌ Error: ' + err.message);
    }
  };

  // Format menus for parent selection
  const parentOptions = menus
    .filter(menu => !menu.parent_id)
    .map(menu => ({
      value: menu.id,
      label: menu.menu_name
    }));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? <X /> : <Plus />}
          {showForm ? 'Cancel' : 'Add Menu'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Menu Name</label>
              <input
                type="text"
                name="menu_name"
                value={formData.menu_name}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Icon</label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400"
                placeholder="e.g., home, users, calendar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Path</label>
              <input
                type="text"
                name="path"
                value={formData.path}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400"
                required
                placeholder="/dashboard/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Menu Order</label>
              <input
                type="number"
                name="menu_order"
                value={formData.menu_order}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Menu</label>
              <Select
                isClearable
                value={parentOptions.find(opt => opt.value === formData.parent_id)}
                onChange={handleParentChange}
                options={parentOptions}
                className="mt-1"
                placeholder="Select parent menu..."
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {editingId ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Menu Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {menus.map(menu => (
              <tr key={menu.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{menu.menu_order}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleReorder(menu.id, 'up')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleReorder(menu.id, 'down')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{menu.menu_name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{menu.icon || '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{menu.path}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {menu.parent_id ? menus.find(m => m.id === menu.parent_id)?.menu_name : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(menu)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagement;
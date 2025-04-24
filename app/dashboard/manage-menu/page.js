'use client';

import { useState, useEffect } from "react";
import axios from "axios";

const ManageMenuPage = () => {
  const [menus, setMenus] = useState([]);
  const [formData, setFormData] = useState({
    menu_name: "",
    icon: "",
    path: "",
    menu_order: "",
    parent_id: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const fetchMenus = async () => {
    try {
      const response = await axios.get("/api/menus/all");
      setMenus(response.data);
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Handle form submit untuk tambah/edit menu
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        menu_name: formData.menu_name,
        icon: formData.icon || null,
        path: formData.path || null,
        menu_order: formData.menu_order ? parseInt(formData.menu_order) : null,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      };
  
      if (editMode) {
        // Update menu
        const response = await axios.put(`/api/menus/${editingId}`, postData);
        setMenus(menus.map((menu) => (menu.id === editingId ? response.data : menu)));
        setAlert({ message: "Menu updated successfully!", type: "success" });
        setEditMode(false);
      } else {
        // Tambah menu baru
        const response = await axios.post("/api/menus", postData);
        setMenus([...menus, response.data]);
        setAlert({ message: "Menu added successfully!", type: "success" });
      }
  
      // Reset form & modal
      setFormData({
        menu_name: "",
        icon: "",
        path: "",
        menu_order: "",
        parent_id: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Error submitting menu:", error);
      setAlert({ message: error.response?.data?.error || "Error submitting menu", type: "error" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/menus/${id}`);
      setMenus(menus.filter((menu) => menu.id !== id));
      setAlert({ message: "Menu deleted successfully!", type: "success" });
    } catch (error) {
      console.error("❌ Error deleting menu:", error);
      setAlert({ message: "Error deleting menu, please try again.", type: "error" });
    }
  };

  const handleEdit = (menu) => {
    setFormData({
      menu_name: menu.menu_name,
      icon: menu.icon,
      path: menu.path,
      menu_order: menu.menu_order,
      parent_id: menu.parent_id || "",
    });
    setEditingId(menu.id);
    setEditMode(true);
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Manage Menu</h1>

      <button
        onClick={() => {
          setIsOpen(true);
          setEditMode(false);
        }}
        className="mb-6 p-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
      >
        Add New Menu
      </button>

      {/* Alert */}
      {alert.message && (
        <div className={`p-4 mb-4 rounded-md text-white ${alert.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {alert.message}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-1/2">
            <h2 className="text-lg font-medium mb-4">{editMode ? "Edit Menu" : "Add New Menu"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Menu Name</label>
                <input
                  type="text"
                  name="menu_name"
                  value={formData.menu_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Icon</label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Path</label>
                <input
                  type="text"
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Menu Order</label>
                <input
                  type="number"
                  name="menu_order"
                  value={formData.menu_order}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Parent Menu (Optional)</label>
                <select name="parent_id" value={formData.parent_id} onChange={handleChange} className="w-full p-2 border rounded-md">
                  <option value="">None</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.menu_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-400 text-white rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  {editMode ? "Update Menu" : "Add Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu List */}
      <h2 className="text-lg font-medium mb-4">Menu List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.map((menu) => (
          <div key={menu.id} className="p-4 bg-white shadow-md rounded-md hover:bg-gray-50 transition duration-200">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-lg">{menu.menu_name}</strong>
                <p className="text-sm text-gray-600">{menu.path}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(menu)} className="text-blue-500 hover:text-blue-700">
                  Edit
                </button>
                <button onClick={() => handleDelete(menu.id)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageMenuPage;

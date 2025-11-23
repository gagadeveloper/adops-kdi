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
  const [sortedMenus, setSortedMenus] = useState([]);
  const [showChildren, setShowChildren] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    menuId: null,
    menuName: "",
    hasChildren: false,
    hasRoles: false,
    forceDelete: false
  });
  
  // List of common lucide icons to choose from
  const commonIcons = [
    { value: "", label: "None" },
    { value: "home", label: "Home" },
    { value: "user", label: "User" },
    { value: "settings", label: "Settings" },
    { value: "file-text", label: "File Text" },
    { value: "calendar", label: "Calendar" },
    { value: "truck", label: "Truck" },
    { value: "car", label: "Car" },
    { value: "check-circle", label: "Check Circle" },
    { value: "clipboard-list", label: "Clipboard List" },
    { value: "lock", label: "Lock" },
    { value: "user-lock", label: "UserLock" },
    { value: "ship", label: "Ship" },
  ];

  const fetchMenus = async () => {
    try {
      const response = await axios.get("/api/menus/all");
      console.log("Fetched menus:", response.data);
      setMenus(response.data);
      
      // Create a hierarchical structure for display
      organizeMenus(response.data);
    } catch (error) {
      console.error("Error fetching menus:", error);
      setAlert({ message: "Failed to load menus: " + (error.response?.data?.message || error.message), type: "error" });
    }
  };
  
  // Function to organize menus into a hierarchical structure
  const organizeMenus = (menuList) => {
    // Create a map of all menus for quick access
    const menuMap = {};
    menuList.forEach(menu => {
      menuMap[menu.id] = { ...menu, children: [] };
    });
    
    // Create the hierarchical structure
    const rootMenus = [];
    menuList.forEach(menu => {
      if (menu.parent_id && menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].children.push(menuMap[menu.id]);
      } else {
        rootMenus.push(menuMap[menu.id]);
      }
    });
    
    // Sort by menu_order
    rootMenus.sort((a, b) => 
      (a.menu_order || 999) - (b.menu_order || 999)
    );
    
    // Also sort children
    rootMenus.forEach(menu => {
      if (menu.children) {
        menu.children.sort((a, b) => 
          (a.menu_order || 999) - (b.menu_order || 999)
        );
      }
    });
    
    setSortedMenus(rootMenus);
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
        parent_id: formData.parent_id ? formData.parent_id : null, // Keep as string if using UUIDs
      };
      
      console.log("Submitting menu data:", postData);
  
      if (editMode) {
        // Update menu
        const response = await axios.put(`/api/menus/${editingId}`, postData);
        console.log("Menu updated response:", response.data);
        // Refresh the entire menu list to ensure hierarchies are updated
        fetchMenus();
        setAlert({ message: "Menu updated successfully!", type: "success" });
        setEditMode(false);
      } else {
        // Tambah menu baru
        const response = await axios.post("/api/menus", postData);
        console.log("Menu added response:", response.data);
        // Refresh the entire menu list to ensure hierarchies are updated
        fetchMenus();
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
      setAlert({ 
        message: error.response?.data?.error || error.response?.data?.message || "Error submitting menu", 
        type: "error" 
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // New function to check menu constraints before deletion
  const checkMenuConstraints = async (id) => {
    try {
      const menu = menus.find(m => m.id === id);
      if (!menu) return;
      
      // Check if menu has children
      const hasChildren = menus.some(m => m.parent_id === id);
      
      // Check if menu is used in roles (this requires a new API endpoint)
      try {
        const roleResponse = await axios.get(`/api/menus/${id}/check-roles`);
        const hasRoles = roleResponse.data.hasRoles;
        
        setDeleteModal({
          isOpen: true,
          menuId: id,
          menuName: menu.menu_name,
          hasChildren,
          hasRoles,
          forceDelete: false
        });
      } catch (error) {
        console.error("Error checking roles:", error);
        setAlert({ message: "Failed to check menu roles", type: "error" });
      }
    } catch (error) {
      console.error("Error checking menu constraints:", error);
      setAlert({ message: "Failed to check menu constraints", type: "error" });
    }
  };

  // Modified delete function with force option
  const handleDelete = async (id, force = false) => {
    try {
      if (force) {
        // If force delete, use new endpoint that bypasses constraints
        await axios.delete(`/api/menus/${id}/force`);
      } else {
        // Regular delete that respects constraints
        await axios.delete(`/api/menus/${id}`);
      }
      
      // Refresh menus after deletion
      fetchMenus();
      setAlert({ message: "Menu deleted successfully!", type: "success" });
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (error) {
      console.error("❌ Error deleting menu:", error);
      setAlert({ 
        message: error.response?.data?.message || "Error deleting menu, please try again.", 
        type: "error" 
      });
    }
  };

  const handleEdit = (menu) => {
    setFormData({
      menu_name: menu.menu_name,
      icon: menu.icon || "",
      path: menu.path || "",
      menu_order: menu.menu_order || "",
      parent_id: menu.parent_id ? String(menu.parent_id) : "",
    });
    setEditingId(menu.id);
    setEditMode(true);
    setIsOpen(true);
  };
  
  const toggleChildren = (id) => {
    setShowChildren(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Function to render menu items recursively
  const renderMenuItem = (menu) => {
    const hasChildren = menu.children && menu.children.length > 0;
    
    return (
      <div key={menu.id} className="mb-2">
        <div className="p-4 bg-white shadow-md rounded-md hover:bg-gray-50 transition duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <strong className="text-lg">{menu.menu_name}</strong>
                {hasChildren && (
                  <button 
                    onClick={() => toggleChildren(menu.id)}
                    className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full hover:bg-gray-300"
                  >
                    {showChildren[menu.id] ? 'Hide Children' : `Show Children (${menu.children.length})`}
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1 grid grid-cols-3 gap-2">
                <div><span className="font-medium">Path:</span> {menu.path || '-'}</div>
                <div><span className="font-medium">Icon:</span> {menu.icon || '-'}</div>
                <div><span className="font-medium">Order:</span> {menu.menu_order || '-'}</div>
              </div>
              {menu.parent_id && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Parent:</span> {
                    menus.find(m => m.id === menu.parent_id)?.menu_name || `ID: ${menu.parent_id}`
                  }
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleEdit(menu)} 
                className="px-2 py-1 text-blue-500 hover:text-blue-700 border border-blue-500 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button 
                onClick={() => checkMenuConstraints(menu.id)} 
                className="px-2 py-1 text-red-500 hover:text-red-700 border border-red-500 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        
        {/* Render children */}
        {hasChildren && showChildren[menu.id] && (
          <div className="pl-6 mt-2 border-l-2 border-gray-300">
            {menu.children.map(child => renderMenuItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Manage Menu</h1>

      <button
        onClick={() => {
          setIsOpen(true);
          setEditMode(false);
          setFormData({
            menu_name: "",
            icon: "",
            path: "",
            menu_order: "",
            parent_id: "",
          });
        }}
        className="mb-6 p-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
      >
        Add New Menu
      </button>

      {/* Alert */}
      {alert.message && (
        <div className={`p-4 mb-4 rounded-md text-white ${alert.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {alert.message}
          <button 
            className="float-right font-bold"
            onClick={() => setAlert({ message: "", type: "" })}
          >
            ×
          </button>
        </div>
      )}

      {/* Add/Edit Menu Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">{editMode ? "Edit Menu" : "Add New Menu"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Menu Name *</label>
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
                <select
                  name="icon"
                  value={formData.icon}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  {commonIcons.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Path</label>
                <input
                  type="text"
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., /dashboard/users or - for parent menus"
                />
                <p className="text-xs text-gray-500 mt-1"></p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Menu Order</label>
                <input
                  type="number"
                  name="menu_order"
                  value={formData.menu_order}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Parent Menu (Optional)</label>
                <select name="parent_id" value={formData.parent_id} onChange={handleChange} className="w-full p-2 border rounded-md">
                  <option value="">None (Root Menu)</option>
                  {menus.map((menu) => (
                    // Prevent choosing itself as parent when editing
                    (editMode && menu.id === editingId) ? null :
                    <option key={menu.id} value={menu.id}>
                      {menu.menu_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editMode ? "Update Menu" : "Add Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">Delete Menu: {deleteModal.menuName}</h2>
            
            <div className="mb-4">
              {deleteModal.hasChildren && (
                <div className="text-orange-600 p-2 mb-2 bg-orange-50 rounded border border-orange-200">
                  This menu has sub-menus. Deleting it will also delete all its sub-menus.
                </div>
              )}
              
              {deleteModal.hasRoles && (
                <div className="text-orange-600 p-2 mb-2 bg-orange-50 rounded border border-orange-200">
                  This menu is assigned to one or more roles. Deleting it will remove these role assignments.
                </div>
              )}
              
              {(deleteModal.hasChildren || deleteModal.hasRoles) && (
                <div className="mb-4">
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={deleteModal.forceDelete}
                      onChange={() => setDeleteModal({...deleteModal, forceDelete: !deleteModal.forceDelete})}
                      className="mr-2"
                    />
                    <span>I understand the risks and want to force delete this menu</span>
                  </label>
                </div>
              )}
              
              <p className="text-gray-600">
                Are you sure you want to delete this menu? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-between">
              <button 
                type="button" 
                onClick={() => setDeleteModal({...deleteModal, isOpen: false})} 
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleDelete(deleteModal.menuId, deleteModal.forceDelete)}
                disabled={(deleteModal.hasChildren || deleteModal.hasRoles) && !deleteModal.forceDelete}
                className={`px-4 py-2 ${
                  (deleteModal.hasChildren || deleteModal.hasRoles) && !deleteModal.forceDelete
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                } text-white rounded-md`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu List - now with hierarchical display */}
      <h2 className="text-lg font-medium mb-4">Menu Structure</h2>
      <div className="space-y-4">
        {sortedMenus.map(menu => renderMenuItem(menu))}
      </div>
    </div>
  );
};

export default ManageMenuPage;
'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';

export default function MenuSelect({ value = [], onChange, options: providedOptions = null }) {
  const [menuOptions, setMenuOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch menus if not provided externally
  useEffect(() => {
    async function fetchMenus() {
      if (providedOptions) {
        setMenuOptions(providedOptions);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/menus/all');
        if (!res.ok) throw new Error('Failed to fetch menus');
        
        const data = await res.json();
        if (Array.isArray(data)) {
          // Format menus as value/label pairs for react-select
          const formattedMenus = data.map(menu => ({
            value: Number(menu.id),
            label: menu.menu_name,
            parentId: menu.parent_id
          }));
          
          // Sort menus: first by parent (null parents first), then by menu_name
          formattedMenus.sort((a, b) => {
            // If one has a parent and the other doesn't
            if (a.parentId === null && b.parentId !== null) return -1;
            if (a.parentId !== null && b.parentId === null) return 1;
            
            // If both have same parent status, sort by name
            return a.label.localeCompare(b.label);
          });
          
          setMenuOptions(formattedMenus);
        }
      } catch (error) {
        console.error('Error fetching menus:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMenus();
  }, [providedOptions]);

  // Ensure value is in correct format
  const normalizedValue = Array.isArray(value) 
    ? value.map(v => typeof v === 'object' && v.value ? v : { value: Number(v), label: getMenuLabel(v) })
    : [];

  // Helper to find menu label from value
  function getMenuLabel(menuId) {
    if (typeof menuId === 'object' && menuId.label) return menuId.label;
    
    const id = typeof menuId === 'object' ? menuId.value : Number(menuId);
    const menu = menuOptions.find(option => option.value === id);
    return menu ? menu.label : `Menu ${id}`;
  }

  const handleChange = (selectedOptions) => {
    // When nothing is selected, we get null
    const normalizedOptions = selectedOptions || [];
    onChange(normalizedOptions);
  };

  return (
    <div>
      <Select
        isMulti
        isLoading={loading}
        options={menuOptions}
        value={normalizedValue}
        onChange={handleChange}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder={loading ? "Loading menus..." : "Select menus"}
      />
    </div>
  );
}
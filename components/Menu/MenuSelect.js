import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const MenuSelect = ({ value, onChange }) => {
  const [menus, setMenus] = useState([]);
  const [groupedOptions, setGroupedOptions] = useState([]);

  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await fetch(`/api/menus/all`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          // Separate parent and child menus
          const parentMenus = data.filter(menu => !menu.parent_id);
          const childMenus = data.filter(menu => menu.parent_id);

          // Create grouped options
          const grouped = parentMenus.map(parent => ({
            label: parent.menu_name,
            options: [
              // Add parent menu as an option
              {
                value: Number(parent.id),
                label: parent.menu_name,
                isParent: true
              },
              // Add child menus if any exist for this parent
              ...childMenus
                .filter(child => child.parent_id === parent.id)
                .map(child => ({
                  value: Number(child.id),
                  label: `${parent.menu_name} - ${child.menu_name}`,
                  isChild: true,
                  parentId: parent.id
                }))
            ]
          }));

          setGroupedOptions(grouped);
          setMenus(data);
        }
      } catch (err) {
        console.error("❌ Error fetching menus:", err);
      }
    }
    fetchMenus();
  }, []);

  return (
    <Select
      isMulti
      options={groupedOptions}
      value={value}
      onChange={onChange}
      className="w-full border rounded-md focus:ring-2 focus:ring-blue-400"
      placeholder="Select menus..."
      styles={{
        group: (base) => ({
          ...base,
          paddingLeft: 0
        }),
        groupHeading: (base) => ({
          ...base,
          color: '#4B5563',
          fontWeight: 600,
          fontSize: '0.875rem'
        }),
        option: (base, state) => ({
          ...base,
          paddingLeft: state.data.isChild ? '2rem' : base.paddingLeft,
          backgroundColor: state.isSelected 
            ? '#2563EB' 
            : state.isFocused 
              ? '#DBEAFE' 
              : base.backgroundColor,
          color: state.isSelected ? 'white' : base.color
        })
      }}
    />
  );
};

export default MenuSelect;
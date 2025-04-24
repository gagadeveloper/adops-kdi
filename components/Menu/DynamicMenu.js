"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { 
  Calendar, 
  FileText, 
  Home, 
  Settings, 
  User, 
} from 'lucide-react';

// Enhanced MenuItem Component
const MenuItem = ({ menu, subMenus = [], level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = subMenus.length > 0;

  const iconMap = {
    calendar: Calendar,
    'file-text': FileText,
    home: Home,
    settings: Settings,
    user: User,
  };

  const Icon = iconMap[menu.icon];

  // Toggle dropdown both when clicking on menu name and arrow
  const toggleDropdown = (e) => {
    e.preventDefault();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="menu-item mb-1">
      <div 
        className={`flex items-center justify-between p-2 hover:bg-blue-50 rounded transition-colors ${isOpen ? 'bg-blue-50' : ''}`}
      >
        <div 
          className="flex items-center w-full cursor-pointer"
          onClick={hasChildren ? toggleDropdown : undefined}
        >
          {Icon && (
            <span className="mr-2">
              <Icon className="w-5 h-5 text-gray-600" />
            </span>
          )}

          {menu.path && !hasChildren ? (
            <Link 
              href={menu.path}
              className="text-gray-700 hover:text-blue-600 font-medium text-sm w-full"
            >
              {menu.menu_name}
            </Link>
          ) : (
            <span 
              className="text-gray-700 font-medium text-sm w-full"
            >
              {menu.menu_name}
            </span>
          )}
        </div>

        {hasChildren && (
          <button
            onClick={toggleDropdown}
            className="p-1 hover:bg-blue-100 rounded focus:outline-none"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className={`pl-${Math.min(level + 2, 6)} transition-all duration-200 ease-in-out`}>
          {subMenus.map((subMenu) => (
            <MenuItem
              key={subMenu.id}
              menu={subMenu}
              subMenus={subMenu.children || []}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced DynamicMenu Component
const DynamicMenu = ({ userEmail }) => {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const fetchUserMenus = async () => {
      try {
        const response = await fetch(`/api/menus/user?email=${userEmail}`);
        const data = await response.json();
        const organizedMenus = organizeMenus(data);
        setMenus(organizedMenus);
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };

    if (userEmail) {
      fetchUserMenus();
    }
  }, [userEmail]);

  const organizeMenus = (flatMenus) => {
    const menuMap = new Map();
    const rootMenus = [];

    flatMenus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    flatMenus.forEach(menu => {
      const menuObject = menuMap.get(menu.id);
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        const parent = menuMap.get(menu.parent_id);
        parent.children.push(menuObject);
      } else {
        rootMenus.push(menuObject);
      }
    });

    return rootMenus.sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  };

  return (
    <div className="space-y-1">
      {menus.map((menu) => (
        <MenuItem
          key={menu.id}
          menu={menu}
          subMenus={menu.children || []}
        />
      ))}
    </div>
  );
};

export default DynamicMenu;
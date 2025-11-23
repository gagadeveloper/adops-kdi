"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronRight,
  ChevronDown,
  Calendar, 
  FileText, 
  Home, 
  Settings, 
  User,
  Car,
  Truck,
  CheckCircle,
  ClipboardList,
  Lock,
  Ship,
} from 'lucide-react';

// Enhanced MenuItem Component
const MenuItem = ({ menu, subMenus = [], level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = subMenus && subMenus.length > 0;

  const iconMap = {
    'calendar': Calendar,
    'file-text': FileText,
    'home': Home,
    'settings': Settings,
    'user': User,
    'truck': Truck,
    'car': Car,
    'check-circle': CheckCircle,
    'clipboard-list': ClipboardList,
    'lock': Lock,
    'ship': Ship,
  };

  const Icon = iconMap[menu.icon] || FileText; // Default to FileText if icon not found

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

          {menu.path && menu.path !== '-' && !hasChildren ? (
            <Link 
              href={menu.path}
              className="text-gray-700 hover:text-blue-600 font-medium text-sm w-full"
            >
              {menu.menu_name}
            </Link>
          ) : (
            <span 
              className="text-gray-700 font-medium text-sm w-full"
              onClick={hasChildren ? toggleDropdown : undefined}
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
        <div className={`pl-4 transition-all duration-200 ease-in-out`}>
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

// Improved DynamicMenu Component
const DynamicMenu = ({ userEmail }) => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserMenus = async () => {
      try {
        console.log('Fetching menus for user email:', userEmail);
        setLoading(true);
        
        const response = await fetch(`/api/menus/user?email=${userEmail}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch menus: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw menu data from API:', data);
        
        // Check if we have menu data
        if (!Array.isArray(data) || data.length === 0) {
          console.log('No menus found for this user');
          setMenus([]);
          return;
        }
        
        // Organize into hierarchy
        const organizedMenus = organizeMenusImproved(data);
        console.log('Organized menu structure:', organizedMenus);
        
        setMenus(organizedMenus);
      } catch (error) {
        console.error('Error fetching menus:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchUserMenus();
    }
  }, [userEmail]);

  // Improved menu organization function
  const organizeMenusImproved = (flatMenus) => {
    console.log('Starting organization of menus. Total items:', flatMenus.length);
    
    // Create a map to store all menus with their children
    const menuMap = {};
    
    // Initialize each menu in the map with an empty children array
    flatMenus.forEach(menu => {
      menuMap[menu.id] = {
        ...menu,
        children: []
      };
    });
    
    // Separate root menus and child menus
    const rootMenus = [];
    
    // Populate children arrays
    flatMenus.forEach(menu => {
      // If this menu has a parent_id and the parent exists in our map
      if (menu.parent_id && menuMap[menu.parent_id]) {
        // Add this menu as a child to its parent
        menuMap[menu.parent_id].children.push(menuMap[menu.id]);
        console.log(`Added "${menu.menu_name}" as child of "${menuMap[menu.parent_id].menu_name}"`);
      } else {
        // If no parent_id or parent doesn't exist, it's a root menu
        rootMenus.push(menuMap[menu.id]);
        console.log(`Added "${menu.menu_name}" as root menu`);
      }
    });
    
    // Sort root menus by menu_order
    rootMenus.sort((a, b) => (a.menu_order || 999) - (b.menu_order || 999));
    
    // Sort children within each menu by menu_order
    const sortMenuChildren = (menu) => {
      if (menu.children && menu.children.length > 0) {
        menu.children.sort((a, b) => (a.menu_order || 999) - (b.menu_order || 999));
        menu.children.forEach(sortMenuChildren);
      }
    };
    
    rootMenus.forEach(sortMenuChildren);
    
    console.log(`Organized ${flatMenus.length} items into ${rootMenus.length} root menus`);
    return rootMenus;
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading menus...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (menus.length === 0) {
    return <div className="p-4 text-gray-500">No menus available for this user</div>;
  }

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
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Sidebar() {
  const { data: session } = useSession();
  const [menus, setMenus] = useState([]);

  // Definisikan path secara manual
  const menuPaths = {
    "Dashboard": "/dashboard",
    "User Management": "/users",
    "Process": "/process",
    "RS1": "/process/rs1",
    "RS2": "/process/rs2",
    "PI": "/process/pi"
  };

  useEffect(() => {
    if (session) {
      fetch(`/api/menus`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Menus from API:", data); // Debugging
          setMenus(data);
        });
    }
  }, [session]);

  if (!session) return null;

  return (
    <nav className="sidebar">
      <h2>Menu</h2>
      <ul>
        {menus.map((menu) => (
          <li key={menu.id}>
            <Link href={menuPaths[menu.name] || "#"}>{menu.name}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

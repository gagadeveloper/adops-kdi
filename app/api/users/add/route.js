import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
  return db.transaction(async (client) => {
    try {
      const { 
        email,
        password,
        name,
        department,
        employeeId,
        position,
        roleId,
        menuIds,
        status,
        // Data tambahan
        bankAccount,
        bankName,
        address,
        location
      } = await req.json();

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user dengan kolom tambahan
      const insertUserQuery = `
        INSERT INTO "User" (
          email, 
          password_hash, 
          name, 
          department, 
          "employeeId", 
          position, 
          "roleId", 
          status,
          bank_account,
          bank_name,
          address,
          location
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `;

      const userResult = await client.query(insertUserQuery, [
        email,
        hashedPassword,
        name,
        department,
        employeeId,
        position,
        roleId,
        status,
        bankAccount || null,
        bankName || null,
        address || null,
        location || 'Makassar'
      ]);

      const userId = userResult.rows[0].id;
      
      // Process menuIds to include both parent and child menus
      if (menuIds && menuIds.length > 0) {
        // First, get all menu items to identify parent-child relationships
        const getAllMenusQuery = `SELECT id, parent_id FROM menus`;
        const allMenusResult = await client.query(getAllMenusQuery);
        const allMenus = allMenusResult.rows;
        
        // Create a set to store unique menu IDs
        const finalMenuIds = new Set(menuIds);
        
        // Function to add parent menus
        const addParentMenus = (menuId) => {
          const menu = allMenus.find(m => m.id === menuId);
          if (menu && menu.parent_id) {
            finalMenuIds.add(menu.parent_id);
            // Recursively add all ancestor menus
            addParentMenus(menu.parent_id);
          }
        };
        
        // Function to add child menus
        const addChildMenus = (parentId) => {
          const children = allMenus.filter(m => m.parent_id === parentId);
          children.forEach(child => {
            finalMenuIds.add(child.id);
            // Recursively add all descendant menus
            addChildMenus(child.id);
          });
        };
        
        // First add parent menus for each selected menu
        menuIds.forEach(menuId => {
          addParentMenus(menuId);
        });
        
        // Then add all child menus for each selected menu
        menuIds.forEach(menuId => {
          addChildMenus(menuId);
        });
        
        // Get the next available ID from user_menus
        const getMaxIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM user_menus`;
        const maxIdResult = await client.query(getMaxIdQuery);
        let nextId = maxIdResult.rows[0].next_id || 1;
        
        // Prepare batch insert with proper IDs
        const values = [];
        const valuePlaceholders = [];
        let placeholderIndex = 1;
        
        for (const menuId of finalMenuIds) {
          values.push(nextId, userId, menuId);
          valuePlaceholders.push(`($${placeholderIndex}, $${placeholderIndex + 1}, $${placeholderIndex + 2})`);
          placeholderIndex += 3;
          nextId++;
        }
        
        const insertUserMenusQuery = `
          INSERT INTO user_menus (id, user_id, menu_id)
          VALUES ${valuePlaceholders.join(', ')}
        `;
        
        await client.query(insertUserMenusQuery, values);
      }

      return NextResponse.json({
        message: "User added successfully",
        userId
      });
    } catch (error) {
      console.error("Error adding user:", error);
      throw error; // Let the transaction function handle the rollback
    }
  }).catch(error => {
    // Handle any errors that occurred during the transaction
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  });
}

// Updated GET endpoint to fetch menus by user email
// Updated GET endpoint to fetch menus by user email
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }
    
    // Get the user's ID first
    const userQuery = `SELECT id FROM "User" WHERE email = $1 AND status = 'active'`;
    const userResult = await db.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      );
    }
    
    const userId = userResult.rows[0].id;
    
    // Query user-specific menus from user_menus table with full menu details
    // Include ordering by parent_id first (null values first), then by menu_order
    const menuQuery = `
      SELECT m.* 
      FROM menus m
      JOIN user_menus um ON m.id = um.menu_id
      WHERE um.user_id = $1
      ORDER BY 
        CASE WHEN m.parent_id IS NULL THEN 0 ELSE 1 END, 
        m.parent_id NULLS FIRST,
        m.menu_order
    `;
    
    const menuResult = await db.query(menuQuery, [userId]);
    
    // Debug log all menus returned
    console.log(`Found ${menuResult.rows.length} menus for user ${email}:`, 
      menuResult.rows.map(m => ({id: m.id, name: m.menu_name, parent: m.parent_id})));
    
    return NextResponse.json(menuResult.rows);
  } catch (error) {
    console.error("Error fetching user menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch user menus" },
      { status: 500 }
    );
  }
}
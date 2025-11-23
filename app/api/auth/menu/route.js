import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { pool } from '@/lib/db';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    console.log("🔹 Session Data:", session); // Debugging session
    
    if (!session || !session.user) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const userEmail = session.user.email;
        console.log("📧 User Email:", userEmail); // Debugging email
        
        // Ambil role berdasarkan email user
        const roleQuery = `SELECT "roleId" FROM "User" WHERE email = $1 LIMIT 1;`;
        const roleResult = await pool.query(roleQuery, [userEmail]);
        
        if (roleResult.rows.length === 0) {
            console.log("⚠️ User tidak memiliki role!");
            return new Response(JSON.stringify({ message: 'No role assigned' }), { 
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const roleId = roleResult.rows[0].roleId;
        console.log("🔹 Role ID:", roleId); // Debugging role_id
        
        // Ambil daftar menu berdasarkan role
        const menuQuery = `
            SELECT m.id, m.menu_name as name, m.path as url, m.icon
            FROM "menus" m
            JOIN "role_menus" rm ON m.id = rm.menu_id
            WHERE rm.role_id = $1
            ORDER BY m.menu_order ASC;
        `;
        const menuResult = await pool.query(menuQuery, [roleId]);
        
        console.log("✅ Menu Retrieved:", menuResult.rows); // Debugging hasil query menu
        
        return new Response(JSON.stringify(menuResult.rows), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('❌ Menu Fetch Error:', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
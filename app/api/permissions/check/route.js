// app/api/permissions/check/route.js
import { getServerSession } from "next-auth/next";
import { prisma } from '@/lib/prisma';

// Hapus import authOptions yang tidak ada
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get('permission');
    
    // Panggil getServerSession() tanpa parameter authOptions
    const session = await getServerSession();
    
    if (!session?.user) {
        return Response.json({ hasPermission: false });
    }
    
    // Gunakan kode asli Anda
    try {
        const hasPermission = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT 1
                FROM "Permission" p
                JOIN "RolePermission" rp ON p.id = rp."permissionId"
                JOIN "Role" r ON rp."roleId" = r.id
                JOIN "User" u ON u."roleId" = r.id
                WHERE u.id = ${session.user.id}
                AND p.name = ${permission}
            )
        `;
        
        return Response.json({ hasPermission: hasPermission[0].exists });
    } catch (error) {
        console.error("Permission check error:", error);
        return Response.json({ hasPermission: false, error: error.message }, { status: 500 });
    }
}
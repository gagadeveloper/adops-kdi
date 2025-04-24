// app/api/permissions/check/route.js
import { getServerSession } from "next-auth/next";
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get('permission');
    const session = await getServerSession();
    
    if (!session?.user) {
        return Response.json({ hasPermission: false });
    }
    
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
}
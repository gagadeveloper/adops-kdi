// app/api/permissions/check/route.js
import { getServerSession } from "next-auth/next";
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Sesuaikan path ini

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get('permission');
    const session = await getServerSession(authOptions); // Tambahkan authOptions
    
    if (!session?.user) {
        return Response.json({ hasPermission: false });
    }
    
    // Gunakan Prisma client API daripada raw query jika memungkinkan
    try {
        const permissionCheck = await prisma.rolePermission.findFirst({
            where: {
                Role: {
                    User: {
                        some: {
                            id: session.user.id
                        }
                    }
                },
                Permission: {
                    name: permission
                }
            }
        });
        
        return Response.json({ hasPermission: !!permissionCheck });
    } catch (error) {
        console.error("Permission check error:", error);
        return Response.json({ hasPermission: false, error: error.message }, { status: 500 });
    }
}
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const menus = await prisma.menus.findMany({
        where: {
            RoleMenu: {
                some: { roleId: session.user.role }
            }
        }
    });

    return new Response(JSON.stringify(menus), { status: 200 });
}

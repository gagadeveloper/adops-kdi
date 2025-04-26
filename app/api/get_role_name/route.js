import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Sesuaikan dengan import database Anda

export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID diperlukan' }, { status: 400 });
    }

    // Query database untuk mendapatkan nama role
    const role = await db.role.findUnique({
      where: {
        id: parseInt(roleId)
      },
      select: {
        name: true
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ roleName: role.name });
  } catch (error) {
    console.error('Error getting role name:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
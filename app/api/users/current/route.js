// app/api/user/current/route.js
import { NextResponse } from "next/server";
import db from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Ambil token dari cookie
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Verifikasi token
    const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Query user dengan role
    const query = `
      SELECT u.id, u.email, u.name, r.name AS role
      FROM "User" u
      JOIN "Role" r ON u."roleId" = r.id
      WHERE u.id = $1
    `;
    
    const result = await db.query(query, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
  }
}
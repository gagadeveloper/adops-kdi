// app/api/menus/user/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    // Query untuk mengambil menu berdasarkan email user
    const query = `
      SELECT DISTINCT m.*
      FROM menus m
      LEFT JOIN user_menus um ON m.id = um.menu_id
      LEFT JOIN "User" u ON um.user_id = u.id
      LEFT JOIN role_menus rm ON m.id = rm.menu_id
      WHERE u.email = $1
      OR rm.role_id = (
        SELECT "roleId"
        FROM "User"
        WHERE email = $1
      )
      ORDER BY m.menu_order;
    `;

    const result = await pool.query(query, [email]);
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching user menus:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
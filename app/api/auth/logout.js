import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
}

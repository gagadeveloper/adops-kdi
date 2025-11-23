import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req) {
    try {
        const token = req.cookies.get('token')?.value;
        
        if (!token) {
            return NextResponse.json({ message: 'No token found' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        return NextResponse.json({
            user: {
                id: decoded.id,
                email: decoded.email
            }
        });
    } catch (error) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
}
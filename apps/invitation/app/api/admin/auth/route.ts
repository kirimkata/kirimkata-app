import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/repositories/adminRepository';
import { generateToken } from '@/lib/services/jwt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Verify credentials
        const admin = await verifyAdminCredentials(username, password);

        if (!admin) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: admin.id,
            username: admin.username,
            type: 'admin',
        });

        return NextResponse.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

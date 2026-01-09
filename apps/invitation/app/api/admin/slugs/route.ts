import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlugs } from '@/lib/repositories/clientRepository';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify JWT token
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);

        if (!payload || payload.type !== 'admin') {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get available slugs
        const slugs = await getAvailableSlugs();

        return NextResponse.json({
            success: true,
            slugs,
        });
    } catch (error) {
        console.error('Error fetching slugs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

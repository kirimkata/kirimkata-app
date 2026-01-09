import { NextRequest, NextResponse } from 'next/server';
import { listWishes } from '@/lib/repositories/wishesRepository';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getClientById } from '@/lib/repositories/clientRepository';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Cache for 30 seconds to reduce function invocations
export const revalidate = 30;

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

        if (!payload || payload.type !== 'client') {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get client data to get the slug
        const client = await getClientById(payload.userId);

        if (!client || !client.slug) {
            return NextResponse.json(
                { error: 'Client not found or no slug assigned' },
                { status: 404 }
            );
        }

        // Fetch wishes for the client's slug
        const wishes = await listWishes(client.slug);

        return NextResponse.json({
            success: true,
            wishes,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

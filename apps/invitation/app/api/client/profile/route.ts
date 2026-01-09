import { NextRequest, NextResponse } from 'next/server';
import { getClientById } from '@/lib/repositories/clientRepository';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify JWT token
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const payload = verifyClientToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Get client data
        const client = await getClientById(payload.client_id);

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Remove password from response
        const { password_encrypted, ...safeClient } = client;

        return NextResponse.json({
            success: true,
            client: safeClient,
        });
    } catch (error) {
        console.error('Error fetching client profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

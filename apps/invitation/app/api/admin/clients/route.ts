import { NextRequest, NextResponse } from 'next/server';
import {
    getAllClients,
    createClient,
    updateClient,
    deleteClient,
} from '@/lib/repositories/clientRepository';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';

export const dynamic = 'force-dynamic';

/**
 * Verify admin JWT token
 */
function verifyAdminToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    const payload = verifyToken(token);

    if (!payload || payload.type !== 'admin') {
        return null;
    }

    return payload;
}

/**
 * GET - List all clients
 */
export async function GET(request: NextRequest) {
    try {
        const payload = verifyAdminToken(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const clients = await getAllClients();

        // Remove password from response
        const clientsWithoutPassword = clients.map((client) => ({
            id: client.id,
            username: client.username,
            email: client.email,
            slug: client.slug,
            created_at: client.created_at,
            updated_at: client.updated_at,
        }));

        return NextResponse.json({
            success: true,
            clients: clientsWithoutPassword,
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Create new client
 */
export async function POST(request: NextRequest) {
    try {
        const payload = verifyAdminToken(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { username, password, email, slug } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const client = await createClient({
            username,
            password,
            email,
            slug,
        });

        if (!client) {
            return NextResponse.json(
                { error: 'Failed to create client' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            client: {
                id: client.id,
                username: client.username,
                email: client.email,
                slug: client.slug,
                created_at: client.created_at,
            },
        });
    } catch (error) {
        console.error('Error creating client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update client
 */
export async function PUT(request: NextRequest) {
    try {
        const payload = verifyAdminToken(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, username, password, email, slug } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Client ID is required' },
                { status: 400 }
            );
        }

        const client = await updateClient(id, {
            username,
            password,
            email,
            slug,
        });

        if (!client) {
            return NextResponse.json(
                { error: 'Failed to update client' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            client: {
                id: client.id,
                username: client.username,
                email: client.email,
                slug: client.slug,
                updated_at: client.updated_at,
            },
        });
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Delete client
 */
export async function DELETE(request: NextRequest) {
    try {
        const payload = verifyAdminToken(request);

        if (!payload) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Client ID is required' },
                { status: 400 }
            );
        }

        const success = await deleteClient(id);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete client' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Client deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

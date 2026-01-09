import { NextRequest, NextResponse } from 'next/server';
import { updateClient, getClientById, verifyClientCredentials } from '@/lib/repositories/clientRepository';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
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

        const body = await request.json();
        const { email, currentPassword, newPassword } = body;

        // Get current client data
        const client = await getClientById(payload.userId);

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (email !== undefined) {
            updateData.email = email;
        }

        // If changing password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: 'Current password is required to set new password' },
                    { status: 400 }
                );
            }

            // Verify current password
            const isValid = await verifyClientCredentials(client.username, currentPassword);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Password saat ini salah' },
                    { status: 400 }
                );
            }

            updateData.password = newPassword;
        }

        // Update client
        const updatedClient = await updateClient(client.id, updateData);

        if (!updatedClient) {
            return NextResponse.json(
                { error: 'Failed to update settings' },
                { status: 500 }
            );
        }

        // Remove sensitive data
        const { password_encrypted, ...safeClient } = updatedClient;

        return NextResponse.json({
            success: true,
            client: safeClient,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

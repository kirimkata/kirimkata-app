import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { updateAdminPassword } from '@/lib/repositories/adminRepository';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/settings
 * Update admin settings (currently only password change)
 */
export async function PUT(request: NextRequest) {
    try {
        // Verify admin token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.type !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'New password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Update password
        const result = await updateAdminPassword(
            decoded.userId,  // Fixed: use userId from JWT payload
            currentPassword,
            newPassword
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Error in admin settings API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

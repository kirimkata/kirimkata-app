import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { weddingGiftRepo } from '@/lib/repositories/weddingGiftRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

/**
 * GET /api/invitations/[slug]/wedding-gift
 * Get wedding gift settings and bank accounts
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const settings = await weddingGiftRepo.getSettings(registration.id);
        const bankAccounts = await weddingGiftRepo.getBankAccounts(registration.id);

        return NextResponse.json({
            success: true,
            data: {
                settings,
                bankAccounts,
            },
        });
    } catch (error: any) {
        console.error('Error getting wedding gift:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/invitations/[slug]/wedding-gift
 * Update wedding gift settings and bank accounts
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { settings, bankAccounts } = body;

        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Save settings
        if (settings) {
            await weddingGiftRepo.upsertSettings({
                registration_id: registration.id,
                ...settings,
            });
        }

        // Save bank accounts
        if (bankAccounts && Array.isArray(bankAccounts)) {
            // Delete existing and create new ones
            await weddingGiftRepo.deleteAllBankAccounts(registration.id);

            for (const account of bankAccounts) {
                await weddingGiftRepo.createBankAccount({
                    registration_id: registration.id,
                    bank_name: account.bank_name,
                    account_number: account.account_number,
                    account_holder_name: account.account_holder_name,
                    display_order: account.display_order,
                });
            }
        }

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: 'Wedding gift updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating wedding gift:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

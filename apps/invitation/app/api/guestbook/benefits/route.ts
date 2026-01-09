import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getBenefitCatalog, createBenefit } from '@/lib/guestbook/repositories/benefitRepository';

/**
 * GET /api/guestbook/benefits
 * Get all benefits from catalog
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const benefits = await getBenefitCatalog();

    return NextResponse.json({
      success: true,
      data: benefits,
    });
  } catch (error) {
    console.error('Get benefits error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guestbook/benefits
 * Create new benefit in catalog
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { benefit_type, display_name, description, icon } = body;

    if (!benefit_type || !display_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing benefits to determine sort order
    const existingBenefits = await getBenefitCatalog();
    const maxSortOrder = existingBenefits.reduce((max, b) => Math.max(max, b.sort_order), 0);

    const benefit = await createBenefit({
      benefit_type,
      display_name,
      description,
      icon,
      sort_order: maxSortOrder + 1,
    });

    if (!benefit) {
      return NextResponse.json(
        { success: false, error: 'Failed to create benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: benefit,
    });
  } catch (error) {
    console.error('Create benefit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCampaigns, getKeywords, getGeoTargeting, getAudienceTargeting, getAdGroups } from '@/lib/google-ads';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  const type = searchParams.get('type') || 'campaigns';

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json(
      { error: 'GOOGLE_ADS_DEVELOPER_TOKEN not configured' },
      { status: 500 }
    );
  }

  const config = {
    accessToken: session.accessToken,
    developerToken,
    customerId,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
  };

  try {
    let data;
    switch (type) {
      case 'campaigns':
        data = await getCampaigns(config);
        break;
      case 'keywords':
        data = await getKeywords(config);
        break;
      case 'geo':
        data = await getGeoTargeting(config);
        break;
      case 'audiences':
        data = await getAudienceTargeting(config);
        break;
      case 'adgroups':
        data = await getAdGroups(config);
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ [type]: data });
  } catch (err: unknown) {
    console.error('Google Ads API error:', err instanceof Error ? err.message : err);
    const msg = err instanceof Error ? err.message : 'Failed to fetch Google Ads data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

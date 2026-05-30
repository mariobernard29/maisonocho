import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    return NextResponse.json({
      success: true,
      apiKey: apiKey
    });
  } catch (err: any) {
    console.error('Error fetching Google Maps API key:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');

    if (!destination) {
      return NextResponse.json({ error: 'Missing destination parameter' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const isKeyConfigured = apiKey && !apiKey.includes('YourGoogleMapsApiKey') && !apiKey.includes('YourGoogleApiKey');

    // Default fallback origin coordinates (Los Mochis center)
    let originLat = 25.7954;
    let originLng = -108.9924;

    // Load actual coordinates dynamically from CRM Settings in DB
    try {
      const sett = await db.getSettings();
      if (sett?.delivery_kitchen_coords?.lat && sett?.delivery_kitchen_coords?.lng) {
        originLat = sett.delivery_kitchen_coords.lat;
        originLng = sett.delivery_kitchen_coords.lng;
        console.log(`Loaded custom kitchen origin from database settings: ${originLat}, ${originLng}`);
      }
    } catch (err) {
      console.warn('Failed to load kitchen coords from db settings, using fallback:', err);
    }

    if (isKeyConfigured) {
      console.log('Fetching true distance via Google Matrix API...');
      // 1. First Geocode the destination address to get lat/lng
      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`
      );
      const geocodeData = await geocodeRes.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
        return NextResponse.json({ error: 'Address geocoding failed' }, { status: 400 });
      }

      const destCoords = geocodeData.results[0].geometry.location;

      // 2. Query Distance Matrix from dynamic origin to geocoded destination
      const matrixRes = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destCoords.lat},${destCoords.lng}&key=${apiKey}`
      );
      const matrixData = await matrixRes.json();

      if (matrixData.status === 'OK' && matrixData.rows[0]?.elements[0]?.status === 'OK') {
        const element = matrixData.rows[0].elements[0];
        const distanceKm = element.distance.value / 1000; // in km
        const durationText = element.duration.text;
        
        return NextResponse.json({
          success: true,
          real_api: true,
          distance_km: parseFloat(distanceKm.toFixed(1)),
          duration_text: durationText,
          coords: destCoords
        });
      }
    }

    // Elegant fallback simulation if no Google Key is configured
    console.log('Simulating distance calculations (Sandbox Fallback)...');
    const simulatedDistance = parseFloat((Math.random() * 8 + 0.5).toFixed(1));
    const estimatedDuration = Math.round(simulatedDistance * 4 + 10); // ~4 mins per km + buffer

    return NextResponse.json({
      success: true,
      real_api: false,
      distance_km: simulatedDistance,
      duration_text: `${estimatedDuration} minutos`,
      coords: { lat: originLat, lng: originLng } // Default to dynamic resolved coordinates
    });

  } catch (err: any) {
    console.error('API Distance matrix error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

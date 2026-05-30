import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');

    if (!destination) {
      return NextResponse.json({ error: 'Missing destination parameter' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const isKeyConfigured = apiKey && !apiKey.includes('YourGoogleMapsApiKey');

    // Origin kitchen coordinates (Los Mochis center)
    const originLat = 25.7954;
    const originLng = -108.9924;

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

      // 2. Query Distance Matrix
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
      coords: { lat: 19.4124, lng: -99.1712 } // Roma Norte default mock
    });

  } catch (err: any) {
    console.error('API Distance matrix error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

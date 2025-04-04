import { useState, useEffect } from 'react';

interface GeoLocationData {
  country_code: string;
  country_name: string;
  loading: boolean;
  error: string | null;
}

export function useGeoLocation() {
  const [geoData, setGeoData] = useState<GeoLocationData>({
    country_code: '',
    country_name: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        // Using ipapi.co which provides a free tier with no API key required
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch geolocation data');
        }
        
        const data = await response.json();
        
        setGeoData({
          country_code: data.country_code || '',
          country_name: data.country_name || '',
          loading: false,
          error: null
        });
        
        console.log('📍 Geolocation detected:', data.country_name);
      } catch (error) {
        console.error('Error fetching geolocation:', error);
        setGeoData({
          country_code: '',
          country_name: '',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    fetchGeoData();
  }, []);

  return geoData;
}

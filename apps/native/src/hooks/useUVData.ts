import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  fetchCurrentUV,
  fetchUVForecast,
  UVForecastDay,
} from '../services/uvService';

export interface UVData {
  uv: number;
  uvMax: number;
  label: string;
  advice: string;
  locationName: string;
  sunrise?: string;
  sunset?: string;
  ozone?: number;
}

export interface WeekDay {
  day: string;
  uv: number;
}

export interface UVState {
  current: UVData | null;
  forecast: WeekDay[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  permissionDenied: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const POLL_INTERVAL_MS = 60_000;
const LOCATION_DISTANCE_THRESHOLD = 500;

function getUVLevel(uv: number) {
  if (uv <= 2)
    return { label: 'Low', advice: 'No protection needed.' };
  if (uv <= 5)
    return { label: 'Moderate', advice: 'Apply SPF 30+.' };
  if (uv <= 7)
    return { label: 'High', advice: 'Apply SPF 50+, seek shade.' };
  if (uv <= 10)
    return { label: 'Very High', advice: 'Avoid midday sun. SPF 50+.' };
  return { label: 'Extreme', advice: 'Stay indoors if possible.' };
}

async function fetchUVData(lat: number, lng: number) {
  const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
  const locationName = geocode[0]
    ? [geocode[0].city, geocode[0].country].filter(Boolean).join(', ')
    : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

  const [uvResult, forecastResult] = await Promise.all([
    fetchCurrentUV(lat, lng),
    fetchUVForecast(lat, lng),
  ]);

  const level = getUVLevel(uvResult.uv);
  const today = new Date().getDay();

  const forecast: WeekDay[] = forecastResult
    .slice(0, 7)
    .map((day: UVForecastDay, i: number) => ({
      day: DAY_NAMES[(today + i) % 7],
      uv: Math.round(day.uvMax * 10) / 10,
    }));

  return {
    current: {
      uv: Math.round(uvResult.uv * 10) / 10,
      uvMax: Math.round(uvResult.uvMax * 10) / 10,
      label: level.label,
      advice: level.advice,
      locationName,
      sunrise: uvResult.sunInfo?.sunrise,
      sunset: uvResult.sunInfo?.sunset,
      ozone: Math.round(uvResult.ozone),
    },
    forecast,
  };
}

export function useUVData() {
  const [state, setState] = useState<UVState>({
    current: null,
    forecast: [],
    loading: true,
    refreshing: false,
    error: null,
    permissionDenied: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async (isBackground = false) => {
    if (cancelledRef.current) return;

    try {
      if (!isBackground) {
        setState((s) => ({ ...s, loading: true, error: null }));
      } else {
        setState((s) => ({ ...s, refreshing: true }));
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: 'Location permission denied',
          permissionDenied: true,
        }));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (cancelledRef.current) return;

      const data = await fetchUVData(loc.coords.latitude, loc.coords.longitude);
      if (cancelledRef.current) return;

      setState({
        current: data.current,
        forecast: data.forecast,
        loading: false,
        refreshing: false,
        error: null,
        permissionDenied: false,
      });
    } catch (err: any) {
      if (!cancelledRef.current) {
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: err?.message ?? 'Failed to load UV data',
        }));
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    load();

    intervalRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { ...state, refetch: () => load(false) };
}

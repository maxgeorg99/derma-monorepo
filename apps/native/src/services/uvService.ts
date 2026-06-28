const OPENUV_BASE = 'https://api.openuv.io/api/v1';

export interface UVCurrentData {
  uv: number;
  uvMax: number;
  uvTime: string;
  ozone: number;
  sunInfo: {
    sunrise: string;
    sunset: string;
    solarNoon: string;
  };
}

export interface UVForecastDay {
  uv: number;
  uvMax: number;
  uvTime: string;
  ozone: number;
}

let apiKey: string | null = null;

function getApiKey(): string {
  if (!apiKey) {
    apiKey =
      process.env.EXPO_PUBLIC_OPEN_UV_API_KEY ??
      process.env.OPEN_UV_API_KEY ??
      null;
  }
  if (!apiKey) {
    throw new Error(
      'OpenUV API key not found. Set EXPO_PUBLIC_OPEN_UV_API_KEY in your .env.local'
    );
  }
  return apiKey;
}

function buildHeaders(): HeadersInit {
  return {
    'x-access-token': getApiKey(),
    'Content-Type': 'application/json',
  };
}

export async function fetchCurrentUV(
  lat: number,
  lng: number
): Promise<UVCurrentData> {
  const url = `${OPENUV_BASE}/uv?lat=${lat}&lng=${lng}`;
  const res = await fetch(url, { headers: buildHeaders() });

  if (!res.ok) {
    throw new Error(`OpenUV /uv failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return {
    uv: json.result.uv,
    uvMax: json.result.uv_max,
    uvTime: json.result.uv_time,
    ozone: json.result.ozone,
    sunInfo: {
      sunrise: json.result.sun_info?.sun_times?.sunrise,
      sunset: json.result.sun_info?.sun_times?.sunset,
      solarNoon: json.result.sun_info?.sun_times?.solarNoon,
    },
  };
}

export async function fetchUVForecast(
  lat: number,
  lng: number
): Promise<UVForecastDay[]> {
  const url = `${OPENUV_BASE}/forecast?lat=${lat}&lng=${lng}`;
  const res = await fetch(url, { headers: buildHeaders() });

  if (!res.ok) {
    throw new Error(
      `OpenUV /forecast failed: ${res.status} ${await res.text()}`
    );
  }

  const json = await res.json();
  return (json.result ?? []).map((day: any) => ({
    uv: day.uv,
    uvMax: day.uv_max,
    uvTime: day.uv_time,
    ozone: day.ozone,
  }));
}

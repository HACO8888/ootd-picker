// Live weather detection via Open-Meteo (keyless, no API token required).
import type { Weather } from "./types";

export interface DetectedWeather {
  weather: Weather;
  temperature: number;
  /** Human-readable label for UI (e.g. "12°C・多雲"). */
  label: string;
}

/** Map an Open-Meteo WMO weather code + temperature to our 4 weather buckets. */
export function mapToWeather(code: number, temp: number): Weather {
  // Cold dominates regardless of sky when it is genuinely chilly.
  if (temp <= 12) return "cold";
  // Rain / drizzle / snow / thunderstorm codes.
  if ((code >= 51 && code <= 67) || (code >= 71 && code <= 86) || (code >= 95 && code <= 99) || (code >= 80 && code <= 82))
    return "rainy";
  // Clear / mainly clear.
  if (code === 0 || code === 1) return "sunny";
  // Partly cloudy / overcast / fog.
  return "cloudy";
}

const WEATHER_ZH: Record<Weather, string> = {
  sunny: "晴朗",
  cloudy: "多雲",
  rainy: "有雨",
  cold: "寒冷",
};

/** Resolve the user's coordinates via the Geolocation API. */
function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("此裝置不支援定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

/** Detect today's weather for the user's current location. */
export async function detectTodayWeather(): Promise<DetectedWeather> {
  const pos = await getPosition();
  const { latitude, longitude } = pos.coords;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("天氣服務暫時無法使用");
  const data = await res.json();
  const temp: number = data?.current?.temperature_2m ?? 20;
  const code: number = data?.current?.weather_code ?? 3;
  const weather = mapToWeather(code, temp);
  return {
    weather,
    temperature: Math.round(temp),
    label: `${Math.round(temp)}°C・${WEATHER_ZH[weather]}`,
  };
}

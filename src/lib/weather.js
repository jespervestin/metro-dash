/**
 * Open-Meteo API – no API key. Coordinates for Duvbo/Stockholm area.
 */
const LAT = 59.36;
const LON = 17.95;
const TZ = 'Europe/Stockholm';
const URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=${encodeURIComponent(TZ)}`;

/** WMO weather code → short label in Swedish. */
const WEATHER_LABELS = {
  0: 'Klart',
  1: 'Nästan klart',
  2: 'Delvis molnigt',
  3: 'Mulet',
  45: 'Dimma',
  48: 'Dimma',
  51: 'Duggregn',
  53: 'Duggregn',
  55: 'Duggregn',
  61: 'Lätt regn',
  63: 'Regn',
  65: 'Kraftigt regn',
  71: 'Snö',
  73: 'Snö',
  75: 'Snö',
  77: 'Snö',
  80: 'Regnbyar',
  81: 'Regnbyar',
  82: 'Regnbyar',
  85: 'Snöbyar',
  86: 'Snöbyar',
  95: 'Åskväder',
  96: 'Åskväder',
  99: 'Åskväder',
};

/**
 * Dev mode: predefined weather scenarios to cycle through (same shape as API response).
 * Only used when running in Vite dev (import.meta.env.DEV).
 */
export const DEV_WEATHER_SCENARIOS = [
  { code: 0, isDay: true, temp: 22, humidity: 45, label: 'Klart' },
  { code: 0, isDay: false, temp: 14, humidity: 60, label: 'Klart' },
  { code: 1, isDay: true, temp: 19, humidity: 52, label: 'Nästan klart' },
  { code: 2, isDay: true, temp: 18, humidity: 58, label: 'Delvis molnigt' },
  { code: 2, isDay: false, temp: 10, humidity: 72, label: 'Delvis molnigt' },
  { code: 3, isDay: true, temp: 12, humidity: 78, label: 'Mulet' },
  { code: 3, isDay: false, temp: 8, humidity: 85, label: 'Mulet' },
  { code: 45, isDay: true, temp: 5, humidity: 95, label: 'Dimma' },
  { code: 61, isDay: true, temp: 11, humidity: 88, label: 'Lätt regn' },
  { code: 63, isDay: false, temp: 7, humidity: 92, label: 'Regn' },
  { code: 71, isDay: true, temp: -2, humidity: 80, label: 'Snö' },
  { code: 80, isDay: true, temp: 13, humidity: 82, label: 'Regnbyar' },
  { code: 95, isDay: false, temp: 16, humidity: 75, label: 'Åskväder' },
];

/**
 * Fetch current weather and return a simple object for display.
 * @returns {Promise<{ temp: number, humidity: number, code: number, label: string }>}
 */
export async function getCurrentWeather() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Weather: ${res.status}`);
  const data = await res.json();
  const c = data.current || {};
  const code = c.weather_code ?? 0;
  const isDay = c.is_day !== 0;
  return {
    temp: c.temperature_2m ?? null,
    humidity: c.relative_humidity_2m ?? null,
    code,
    label: WEATHER_LABELS[code] ?? 'Okänd',
    isDay,
  };
}

/** Theme for Apple-style dynamic background and icon. */
export function getWeatherTheme(code, isDay = true) {
  const night = !isDay;
  // Group WMO codes: clear(0), mainly-clear(1), partly-cloudy(2), cloudy(3), fog(45,48),
  // drizzle(51-55), rain(61-67,80-82), snow(71-77,85-86), thunder(95-99)
  if (code === 0) {
    return {
      icon: 'clear',
      topColor: night ? '#0c1445' : '#5b8def',
      gradient: night
        ? 'linear-gradient(180deg, #0c1445 0%, #1a237e 40%, #283593 100%)'
        : 'linear-gradient(180deg, #5b8def 0%, #87ceeb 35%, #e8f4fc 100%)',
      light: false,
    };
  }
  if (code === 1) {
    return {
      icon: 'mainly-clear',
      topColor: night ? '#1a237e' : '#6b9de8',
      gradient: night
        ? 'linear-gradient(180deg, #1a237e 0%, #283593 50%, #3949ab 100%)'
        : 'linear-gradient(180deg, #6b9de8 0%, #90b4e8 40%, #c5d9f0 100%)',
      light: false,
    };
  }
  if (code === 2) {
    return {
      icon: 'partly-cloudy',
      topColor: night ? '#263056' : '#7ba3d4',
      gradient: night
        ? 'linear-gradient(180deg, #263056 0%, #364a7a 50%, #4a5f8f 100%)'
        : 'linear-gradient(180deg, #7ba3d4 0%, #9fc0e8 35%, #d4e4f4 100%)',
      light: false,
    };
  }
  if (code === 3) {
    return {
      icon: 'cloudy',
      topColor: night ? '#37474f' : '#607d8b',
      gradient: night
        ? 'linear-gradient(180deg, #37474f 0%, #455a64 50%, #546e7a 100%)'
        : 'linear-gradient(180deg, #607d8b 0%, #78909c 40%, #90a4ae 100%)',
      light: false,
    };
  }
  if (code === 45 || code === 48) {
    return {
      icon: 'fog',
      topColor: '#78909c',
      gradient: 'linear-gradient(180deg, #78909c 0%, #90a4ae 50%, #b0bec5 100%)',
      light: false,
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      icon: 'rain',
      topColor: night ? '#263238' : '#455a64',
      gradient: night
        ? 'linear-gradient(180deg, #263238 0%, #37474f 50%, #455a64 100%)'
        : 'linear-gradient(180deg, #455a64 0%, #546e7a 35%, #78909c 100%)',
      light: false,
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      icon: 'snow',
      topColor: '#b0bec5',
      gradient: 'linear-gradient(180deg, #b0bec5 0%, #cfd8dc 40%, #eceff1 100%)',
      light: true,
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      icon: 'rain',
      topColor: night ? '#263238' : '#546e7a',
      gradient: night
        ? 'linear-gradient(180deg, #263238 0%, #37474f 50%, #455a64 100%)'
        : 'linear-gradient(180deg, #546e7a 0%, #607d8b 40%, #78909c 100%)',
      light: false,
    };
  }
  if (code >= 85 && code <= 86) {
    return {
      icon: 'snow',
      topColor: '#90a4ae',
      gradient: 'linear-gradient(180deg, #90a4ae 0%, #b0bec5 50%, #eceff1 100%)',
      light: true,
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      icon: 'thunderstorm',
      topColor: '#1a237e',
      gradient: 'linear-gradient(180deg, #1a237e 0%, #263238 40%, #37474f 100%)',
      light: false,
    };
  }
  return {
    icon: 'cloudy',
    topColor: '#607d8b',
    gradient: 'linear-gradient(180deg, #607d8b 0%, #78909c 40%, #90a4ae 100%)',
    light: false,
  };
}

// Weather — small Open-Meteo helper for Stella's "she sees the day" chip.
// Exposes window.fetchWeather(lat, lon) → { tempC, code, isDay, vibe, icon } | null.

const WMO_VIBE = {
  0:  { vibe: "clear and bright", icon: "☀️", night: { vibe: "clear night sky", icon: "🌙" } },
  1:  { vibe: "soft sun", icon: "🌤️" },
  2:  { vibe: "drifting cloud", icon: "⛅" },
  3:  { vibe: "low cloud", icon: "☁️" },
  45: { vibe: "misty", icon: "🌫️" },
  48: { vibe: "frosty mist", icon: "🌫️" },
  51: { vibe: "light drizzle", icon: "🌦️" },
  53: { vibe: "drizzling", icon: "🌦️" },
  55: { vibe: "heavy drizzle", icon: "🌧️" },
  56: { vibe: "icy drizzle", icon: "🌧️" },
  57: { vibe: "icy rain", icon: "🌧️" },
  61: { vibe: "soft rain", icon: "🌦️" },
  63: { vibe: "steady rain", icon: "🌧️" },
  65: { vibe: "heavy rain", icon: "🌧️" },
  66: { vibe: "freezing rain", icon: "🌧️" },
  67: { vibe: "icy downpour", icon: "🌧️" },
  71: { vibe: "snow falling", icon: "🌨️" },
  73: { vibe: "snow", icon: "🌨️" },
  75: { vibe: "deep snow", icon: "❄️" },
  77: { vibe: "snow grains", icon: "🌨️" },
  80: { vibe: "rain showers", icon: "🌦️" },
  81: { vibe: "heavy showers", icon: "🌧️" },
  82: { vibe: "stormy showers", icon: "⛈️" },
  85: { vibe: "snow showers", icon: "🌨️" },
  86: { vibe: "heavy snow showers", icon: "🌨️" },
  95: { vibe: "thunderstorm", icon: "⛈️" },
  96: { vibe: "thunder with hail", icon: "⛈️" },
  99: { vibe: "heavy thunder", icon: "⛈️" },
};

let _cache = null; // { key, data, ts }

function _cacheKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fetchWeather(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const key = _cacheKey(lat, lon);
  const now = Date.now();
  if (_cache && _cache.key === key && now - _cache.ts < 10 * 60 * 1000) {
    return _cache.data;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("weather fetch failed");
    const j = await r.json();
    const code = j?.current?.weather_code ?? 1;
    const isDay = !!j?.current?.is_day;
    const entry = WMO_VIBE[code] || { vibe: "still day", icon: "🌤️" };
    const vibe = !isDay && entry.night ? entry.night.vibe : entry.vibe;
    const icon = !isDay && entry.night ? entry.night.icon : entry.icon;
    const data = {
      tempC: Math.round(j?.current?.temperature_2m ?? 20),
      code,
      isDay,
      vibe,
      icon,
    };
    _cache = { key, data, ts: now };
    return data;
  } catch (e) {
    console.warn("fetchWeather failed", e);
    return null;
  }
}

window.fetchWeather = fetchWeather;

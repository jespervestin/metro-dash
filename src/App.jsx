import { useState, useEffect, useCallback } from 'react';
import { findSiteIdByName, getDepartures } from './lib/slTransport';
import { getCurrentWeather, getWeatherTheme, DEV_WEATHER_SCENARIOS } from './lib/weather';
import Weather from './components/Weather';
// import Calendar from './components/Calendar';
import Departures from './components/Departures';
import './App.css';

const PAGE_BG_FALLBACK = '#455a64';
const DEV_MODE = import.meta.env.DEV;

const STATION_NAME = 'Duvbo';
const DEPARTURES_INTERVAL_MS = 45000;
const WEATHER_INTERVAL_MS = 5 * 60 * 1000;

function App() {
  const [siteId, setSiteId] = useState(null);
  const [departures, setDepartures] = useState(null);
  const [departuresError, setDeparturesError] = useState(null);
  const [departuresLoading, setDeparturesLoading] = useState(true);
  const [weather, setWeather] = useState(
    () => (DEV_MODE && DEV_WEATHER_SCENARIOS.length > 0 ? DEV_WEATHER_SCENARIOS[0] : null)
  );
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(!DEV_MODE);
  const [devScenarioIndex, setDevScenarioIndex] = useState(0);
  const [useLiveWeather, setUseLiveWeather] = useState(false);

  const loadDepartures = useCallback(async () => {
    if (siteId == null) return;
    setDeparturesError(null);
    try {
      const { departures: list } = await getDepartures(siteId);
      setDepartures(list);
    } catch (e) {
      setDeparturesError(e.message || 'Failed to load departures');
    } finally {
      setDeparturesLoading(false);
    }
  }, [siteId]);

  const refreshDepartures = useCallback(() => {
    if (siteId == null) return;
    setDeparturesLoading(true);
    loadDepartures();
  }, [siteId, loadDepartures]);

  const loadWeather = useCallback(async () => {
    setWeatherError(null);
    try {
      const data = await getCurrentWeather();
      setWeather(data);
    } catch (e) {
      setWeatherError(e.message || 'Failed to load weather');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function resolveSite() {
      try {
        const id = await findSiteIdByName(STATION_NAME);
        if (!cancelled) setSiteId(id);
      } catch (e) {
        if (!cancelled) setDeparturesError(e.message || 'Failed to find station');
        if (!cancelled) setDeparturesLoading(false);
      }
    }
    resolveSite();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (siteId == null) return;
    setDeparturesLoading(true);
    loadDepartures();
    const t = setInterval(loadDepartures, DEPARTURES_INTERVAL_MS);
    return () => clearInterval(t);
  }, [siteId, loadDepartures]);

  useEffect(() => {
    if (DEV_MODE && !useLiveWeather) return;
    loadWeather();
    const t = setInterval(loadWeather, WEATHER_INTERVAL_MS);
    return () => clearInterval(t);
  }, [loadWeather, DEV_MODE, useLiveWeather]);

  useEffect(() => {
    if (DEV_MODE && !useLiveWeather && DEV_WEATHER_SCENARIOS.length > 0) {
      setWeather(DEV_WEATHER_SCENARIOS[devScenarioIndex]);
      setWeatherLoading(false);
      setWeatherError(null);
    }
  }, [DEV_MODE, useLiveWeather, devScenarioIndex]);

  const cycleDevWeather =
    DEV_MODE && !useLiveWeather
      ? () => setDevScenarioIndex((i) => (i + 1) % DEV_WEATHER_SCENARIOS.length)
      : undefined;

  const pageBgColor =
    weather != null
      ? getWeatherTheme(weather.code, weather.isDay).topColor
      : PAGE_BG_FALLBACK;

  useEffect(() => {
    document.documentElement.style.backgroundColor = pageBgColor;
    document.body.style.backgroundColor = pageBgColor;
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, [pageBgColor]);

  return (
    <div className="app">
      <Weather
        data={weather}
        loading={(!DEV_MODE || useLiveWeather) && weatherLoading}
        error={(!DEV_MODE || useLiveWeather) ? weatherError : null}
        devMode={DEV_MODE && !useLiveWeather}
        onCycleScenario={cycleDevWeather}
        onUseLiveData={DEV_MODE ? () => setUseLiveWeather(true) : undefined}
        scenarioLabel={
          DEV_MODE && !useLiveWeather && DEV_WEATHER_SCENARIOS[devScenarioIndex]
            ? DEV_WEATHER_SCENARIOS[devScenarioIndex].label
            : null
        }
      />
      {/* <Calendar /> */}
      <main className="app__main">
        <Departures
          departures={departures}
          loading={siteId == null || departuresLoading}
          error={departuresError}
          onRefresh={refreshDepartures}
        />
      </main>
    </div>
  );
}

export default App;

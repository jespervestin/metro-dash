import { useState, useEffect, useCallback, useMemo } from 'react';
import { findSiteIdByName, getDepartures, DEV_DEPARTURE_SCENARIOS } from './lib/slTransport';
import { getCurrentWeather, DEV_WEATHER_SCENARIOS } from './lib/weather';
import { DEV_CALENDAR_SCENARIOS } from './lib/calendar';
import { deriveMetro } from './lib/metroState';
import { useMinuteTick } from './lib/useMinuteTick';
import Clock from './components/Clock';
import Weather from './components/Weather';
import Departures from './components/Departures';
import Calendar from './components/Calendar';
import './App.css';

const DEV_MODE = import.meta.env.DEV;
const STATION_NAME = 'Duvbo';
const DEPARTURES_INTERVAL_MS = 30000;
const WEATHER_INTERVAL_MS = 5 * 60 * 1000;

function App() {
  const now = useMinuteTick();

  const [siteId, setSiteId] = useState(null);
  const [departures, setDepartures] = useState(null);
  const [departuresError, setDeparturesError] = useState(null);
  const [departuresLoading, setDeparturesLoading] = useState(true);

  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(!DEV_MODE);

  const [devWeatherIndex, setDevWeatherIndex] = useState(0);
  const [devCalendarIndex, setDevCalendarIndex] = useState(1);
  const [devMetroIndex, setDevMetroIndex] = useState(0);

  const loadDepartures = useCallback(async () => {
    if (siteId == null) return;
    setDeparturesError(null);
    try {
      const { departures: list } = await getDepartures(siteId);
      setDepartures(list);
    } catch (e) {
      setDeparturesError(e.message || 'Kunde inte hämta avgångar');
    } finally {
      setDeparturesLoading(false);
    }
  }, [siteId]);

  const loadWeather = useCallback(async () => {
    setWeatherError(null);
    try {
      setWeather(await getCurrentWeather());
    } catch (e) {
      setWeatherError(e.message || 'Kunde inte hämta väder');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (DEV_MODE) return;
    let cancelled = false;
    (async () => {
      try {
        const id = await findSiteIdByName(STATION_NAME);
        if (!cancelled) setSiteId(id);
      } catch (e) {
        if (cancelled) return;
        setDeparturesError(e.message || 'Kunde inte hitta stationen');
        setDeparturesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (DEV_MODE || siteId == null) return;
    loadDepartures();
    const t = setInterval(loadDepartures, DEPARTURES_INTERVAL_MS);
    return () => clearInterval(t);
  }, [siteId, loadDepartures]);

  useEffect(() => {
    if (DEV_MODE) return;
    loadWeather();
    const t = setInterval(loadWeather, WEATHER_INTERVAL_MS);
    return () => clearInterval(t);
  }, [loadWeather]);

  // `now` is a dependency so countdowns re-derive on every minute boundary,
  // not only when a fetch happens to land.
  const metro = useMemo(
    () =>
      deriveMetro(
        DEV_MODE ? DEV_DEPARTURE_SCENARIOS[devMetroIndex].departures : departures,
        now.getTime()
      ),
    [departures, devMetroIndex, now]
  );

  const shownWeather = DEV_MODE ? DEV_WEATHER_SCENARIOS[devWeatherIndex] : weather;
  const loading = DEV_MODE ? false : departuresLoading;
  const error = DEV_MODE ? null : departuresError;

  // The clock only takes the top slot once we actually know there is nothing
  // to lead with — never while still loading or after a failed fetch.
  const clockLeads = !loading && !error && metro.kind === 'none';

  const cycle = (setter, list) => () => setter((i) => (i + 1) % list.length);

  return (
    <div className="panel">
      {clockLeads ? (
        <>
          <Clock variant="hero" />
          <div className="panel__rule" />
          <Weather
            variant="large"
            data={shownWeather}
            loading={DEV_MODE ? false : weatherLoading}
            error={DEV_MODE ? null : weatherError}
            onCycleScenario={DEV_MODE ? cycle(setDevWeatherIndex, DEV_WEATHER_SCENARIOS) : undefined}
          />
        </>
      ) : (
        <>
          <header className="panel__header">
            <div className="panel__header-left">
              <Clock />
            </div>
            <div className="panel__header-right">
              <Weather
                data={shownWeather}
                loading={DEV_MODE ? false : weatherLoading}
                error={DEV_MODE ? null : weatherError}
                onCycleScenario={DEV_MODE ? cycle(setDevWeatherIndex, DEV_WEATHER_SCENARIOS) : undefined}
              />
            </div>
          </header>
          <div className="panel__rule" />
        </>
      )}

      <Departures state={metro} loading={loading} error={error} />

      <Calendar
        devMode={DEV_MODE}
        devData={DEV_MODE ? DEV_CALENDAR_SCENARIOS[devCalendarIndex]?.data : null}
        onCycleScenario={DEV_MODE ? cycle(setDevCalendarIndex, DEV_CALENDAR_SCENARIOS) : undefined}
        /* The inverted "Hinner ej gå" hero is ~45px taller than the normal one,
           which is exactly one calendar row's worth of the fixed 1024px budget. */
        maxEvents={metro.kind === 'missed' ? 2 : 3}
      />

      {DEV_MODE && (
        <div className="panel__dev">
          <button type="button" onClick={cycle(setDevMetroIndex, DEV_DEPARTURE_SCENARIOS)}>
            {DEV_DEPARTURE_SCENARIOS[devMetroIndex].label}
          </button>
          <button type="button" onClick={cycle(setDevWeatherIndex, DEV_WEATHER_SCENARIOS)}>
            {DEV_WEATHER_SCENARIOS[devWeatherIndex].label}
          </button>
          <button type="button" onClick={cycle(setDevCalendarIndex, DEV_CALENDAR_SCENARIOS)}>
            {DEV_CALENDAR_SCENARIOS[devCalendarIndex].label}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

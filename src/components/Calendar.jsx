import { useState, useEffect, useCallback } from 'react';
import { fetchCalendarEvents, CALENDAR_REFRESH_MS } from '../lib/calendar';
import './Calendar.css';

const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };

/* Default cap. The caller lowers it when the metro block is taller — the two
   share one fixed height budget and the panel cannot scroll. */
const DEFAULT_MAX_EVENTS = 3;

function formatEventTime(ev) {
  if (ev.allDay) return 'Hela dagen';
  const start = ev.startDate.toLocaleTimeString('sv-SE', timeOpts);
  const end = ev.endDate.toLocaleTimeString('sv-SE', timeOpts);
  return start === end ? start : `${start} – ${end}`;
}

export default function Calendar({ devMode, devData, onCycleScenario, maxEvents = DEFAULT_MAX_EVENTS }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchCalendarEvents());
    } catch (e) {
      setError(e.message || 'Kunde inte ladda kalendern');
    }
  }, []);

  useEffect(() => {
    if (devMode) return; // dev renders from fixed scenarios instead
    load();
    const t = setInterval(load, CALENDAR_REFRESH_MS);
    return () => clearInterval(t);
  }, [load, devMode]);

  const shown = devMode ? devData : data;
  // Capped to keep the fixed-height panel from overflowing — see MAX_ROWS in
  // Departures. The soonest events are the useful ones on a hallway glance.
  const events = (shown?.events ?? []).slice(0, maxEvents);
  // Header still names the day even when it has no events, so the empty state
  // reads as "nothing that day" rather than "nothing, ever".
  const header = shown?.dateLabel ?? (error ? 'Kalender' : 'Idag');

  return (
    <section
      className="calendar"
      aria-label="Kalender"
      onClick={onCycleScenario || undefined}
    >
      <p className="calendar__header">{header}</p>
      {error && !devMode ? (
        <p className="calendar__empty">{error}</p>
      ) : events.length === 0 ? (
        <p className="calendar__empty">Inga kommande händelser</p>
      ) : (
        <ul className="calendar__list">
          {events.map((ev, i) => (
            <li className="calendar__event" key={i}>
              <span className="calendar__time">{formatEventTime(ev)}</span>
              <span className="calendar__title">{ev.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
